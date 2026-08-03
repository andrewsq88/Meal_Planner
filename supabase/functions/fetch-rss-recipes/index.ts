import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://www.weeklymealplan.space",
  "https://weeklymealplan.space",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

// RSS feeds to aggregate — all are publicly accessible, CORS-free from server side
const RSS_FEEDS: Array<{ url: string; name: string }> = [
  { url: "https://feeds.feedburner.com/smittenkitchen", name: "Smitten Kitchen" },
  { url: "https://www.budgetbytes.com/feed/", name: "Budget Bytes" },
  { url: "https://cookieandkate.com/feed/", name: "Cookie and Kate" },
  { url: "https://www.loveandlemons.com/feed/", name: "Love and Lemons" },
];

// Cache TTL: 30 minutes in milliseconds
const CACHE_TTL_MS = 30 * 60 * 1000;

const VALID_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner"]);

type MealType = "breakfast" | "lunch" | "dinner";

interface RssItem {
  id: string;
  title: string;
  description: string;
  link: string;
  source: string;
  pubDate: string;
  imageUrl: string;
  meal_type: MealType;
}

function inferMealType(text: string): MealType {
  const lower = text.toLowerCase();
  const breakfastWords = ["breakfast", "pancake", "waffle", "oatmeal", "granola", "muffin", "egg", "scramble", "frittata", "brunch", "morning", "toast"];
  const lunchWords = ["lunch", "sandwich", "wrap", "salad", "soup", "bowl", "lunchbox", "midday", "light meal"];
  for (const w of breakfastWords) if (lower.includes(w)) return "breakfast";
  for (const w of lunchWords) if (lower.includes(w)) return "lunch";
  return "dinner";
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", ldquo: "\u201C", rdquo: "\u201D",
  lsquo: "\u2018", rsquo: "\u2019", hellip: "…", trade: "™",
  reg: "®", copy: "©", deg: "°", frac12: "½", frac14: "¼",
};

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

function decodeUrl(url: string): string {
  return url.replace(/&amp;/g, "&").replace(/&#38;/g, "&");
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function extractTag(xml: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i");
  const match = xml.match(re);
  return match ? match[1] : "";
}

function parseItems(xmlText: string, sourceName: string): RssItem[] {
  const itemPattern = /<item[\s>][\s\S]*?<\/item>/gi;
  const rawItems = xmlText.match(itemPattern) ?? [];
  const items: RssItem[] = [];

  for (const raw of rawItems) {
    const title = stripHtml(extractTag(raw, "title"));
    if (!title) continue;

    const link = extractTag(raw, "link") ||
      extractTag(raw, "guid") ||
      extractAttr(raw, "link", "href");
    if (!link || !link.startsWith("http")) continue;

    const rawDesc = extractTag(raw, "description") || extractTag(raw, "content:encoded") || extractTag(raw, "summary");
    const description = stripHtml(rawDesc).slice(0, 200);

    const pubDate = extractTag(raw, "pubDate") || extractTag(raw, "published") || extractTag(raw, "dc:date") || "";

    let imageUrl =
      extractAttr(raw, "media:content", "url") ||
      extractAttr(raw, "enclosure", "url") ||
      extractAttr(raw, "media:thumbnail", "url");
    if (!imageUrl) {
      const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    // Only accept http/https image URLs
    if (imageUrl) {
      imageUrl = decodeUrl(imageUrl);
      if (!/^https?:\/\//i.test(imageUrl)) imageUrl = "";
    }

    const meal_type = inferMealType(title + " " + description);

    items.push({
      id: simpleHash(link),
      title,
      description,
      link,
      source: sourceName,
      pubDate,
      imageUrl,
      meal_type,
    });
  }

  return items;
}

async function fetchFeed(feed: { url: string; name: string }): Promise<RssItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseItems(text, feed.name);
  } catch {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get("query") ?? "").trim().toLowerCase().slice(0, 100);
    const rawMealType = url.searchParams.get("meal_type") ?? "all";
    const mealTypeFilter = VALID_MEAL_TYPES.has(rawMealType) ? rawMealType : "all";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = Date.now();
    const allItems: RssItem[] = [];

    await Promise.all(
      RSS_FEEDS.map(async (feed) => {
        const { data: cached } = await supabase
          .from("rss_cache")
          .select("items, fetched_at")
          .eq("feed_url", feed.url)
          .maybeSingle();

        let items: RssItem[];

        const isFresh = cached && (now - new Date(cached.fetched_at).getTime()) < CACHE_TTL_MS;

        if (isFresh) {
          items = cached.items as RssItem[];
        } else {
          items = await fetchFeed(feed);
          if (items.length > 0) {
            await supabase
              .from("rss_cache")
              .upsert(
                { feed_url: feed.url, items, fetched_at: new Date().toISOString() },
                { onConflict: "feed_url" },
              );
          } else if (cached) {
            items = cached.items as RssItem[];
          }
        }

        allItems.push(...items);
      }),
    );

    allItems.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    let filtered = allItems;
    if (query) {
      filtered = allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      );
    }

    if (mealTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.meal_type === mealTypeFilter);
    }

    const seen = new Set<string>();
    const results: RssItem[] = [];
    for (const item of filtered) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
      if (results.length >= 16) break;
    }

    return new Response(JSON.stringify({ items: results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
