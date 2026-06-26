import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ScrapedResult {
  title: string;
  description: string;
  ingredients: string[];
  image_url: string;
  total_time: number;
  servings: string;
}

// ── ISO 8601 duration → minutes (e.g. "PT1H30M" → 90) ───────────────────────
function parseIsoDuration(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value) return 0;
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 60) + parseInt(m[2] ?? "0");
}

// ── Extract recipe data from a schema.org Recipe JSON-LD object ──────────────
function extractFromSchema(schema: Record<string, unknown>): ScrapedResult {
  const title = String(schema.name ?? "").slice(0, 200);
  const description = String(schema.description ?? "").slice(0, 400);

  const rawIngredients = schema.recipeIngredient;
  const ingredients: string[] = Array.isArray(rawIngredients)
    ? rawIngredients.slice(0, 24).map(String)
    : [];

  let image_url = "";
  const img = schema.image;
  if (Array.isArray(img)) {
    const first = img[0];
    image_url = typeof first === "object" && first !== null
      ? String((first as Record<string, unknown>).url ?? first)
      : String(first ?? "");
  } else if (typeof img === "object" && img !== null) {
    image_url = String((img as Record<string, unknown>).url ?? "");
  } else {
    image_url = String(img ?? "");
  }

  const total_time = parseIsoDuration(schema.totalTime ?? schema.cookTime ?? 0);
  const servings = String(schema.recipeYield ?? schema.yield ?? "");

  return { title, description, ingredients, image_url, total_time, servings };
}

// ── Walk JSON-LD blobs for a Recipe node ─────────────────────────────────────
function findRecipeInBlob(blob: unknown): Record<string, unknown> | null {
  if (!blob || typeof blob !== "object") return null;
  const obj = blob as Record<string, unknown>;
  if (obj["@type"] === "Recipe") return obj;
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"] as unknown[]) {
      const found = findRecipeInBlob(item);
      if (found) return found;
    }
  }
  if (Array.isArray(blob)) {
    for (const item of blob as unknown[]) {
      const found = findRecipeInBlob(item);
      if (found) return found;
    }
  }
  return null;
}

// ── Fetch page HTML and extract JSON-LD Recipe schema ────────────────────────
async function tryJsonLdScraper(url: string): Promise<ScrapedResult | null> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RecipeScraper/1.0; +https://familymenuapp.com)",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  // Extract every <script type="application/ld+json"> block
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRe.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(match[1].trim());
      const recipe = findRecipeInBlob(parsed);
      if (recipe && Array.isArray(recipe.recipeIngredient) && (recipe.recipeIngredient as unknown[]).length > 0) {
        return extractFromSchema(recipe);
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ── Python microservice (recipe-scrapers — 400+ sites) ───────────────────────
async function tryPythonScraper(url: string): Promise<ScrapedResult | null> {
  const serviceUrl = Deno.env.get("PYTHON_SCRAPER_URL");
  if (!serviceUrl) return null;

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    const ingredients = Array.isArray(data.ingredients) ? data.ingredients.map(String) : [];
    if (ingredients.length === 0) return null;
    return {
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      ingredients,
      image_url: String(data.image ?? ""),
      total_time: Number(data.total_time) || 0,
      servings: String(data.servings ?? ""),
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json() as { url?: string };
    const url = (body.url ?? "").trim();

    if (!url || !url.startsWith("http")) {
      return new Response(
        JSON.stringify({ error: "A valid http(s) URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Cache check ──────────────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("scraped_recipes")
      .select("*")
      .eq("url", url)
      .maybeSingle();

    if (cached && Date.now() - new Date(cached.scraped_at).getTime() < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Scrape: Python service → JSON-LD native ──────────────────────────────
    let result = await tryPythonScraper(url);
    if (!result || result.ingredients.length === 0) {
      result = await tryJsonLdScraper(url);
    }

    if (!result || result.ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipe data found on this page. The site may not embed structured recipe markup." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Persist ──────────────────────────────────────────────────────────────
    const row = {
      url,
      title: result.title,
      description: result.description,
      ingredients: result.ingredients,
      image_url: result.image_url,
      total_time: result.total_time,
      servings: result.servings,
      scraped_at: new Date().toISOString(),
    };

    await supabase
      .from("scraped_recipes")
      .upsert(row, { onConflict: "url" });

    return new Response(JSON.stringify(row), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scrape-recipe error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
