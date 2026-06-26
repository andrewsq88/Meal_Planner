import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ScrapedResult {
  title: string;
  description: string;
  ingredients: string[];
  image_url: string;
  total_time: number;
  servings: string;
}

// ── Python microservice path ─────────────────────────────────────────────────
async function tryPythonScraper(url: string): Promise<ScrapedResult | null> {
  const serviceUrl = Deno.env.get("PYTHON_SCRAPER_URL");
  if (!serviceUrl) return null;

  try {
    const res = await fetch(`${serviceUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? "",
      description: data.description ?? "",
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      image_url: data.image ?? "",
      total_time: Number(data.total_time) || 0,
      servings: data.servings ?? "",
    };
  } catch {
    return null;
  }
}

// ── npm:recipe-data-scraper fallback ─────────────────────────────────────────
async function tryNpmScraper(url: string): Promise<ScrapedResult | null> {
  try {
    // @ts-expect-error — dynamic npm import
    const { default: scrapeRecipe } = await import("npm:recipe-data-scraper@1.1.3");
    const data = await scrapeRecipe(url);
    if (!data) return null;
    return {
      title: data.name ?? data.title ?? "",
      description: data.description ?? "",
      ingredients: Array.isArray(data.recipeIngredient ?? data.ingredients)
        ? (data.recipeIngredient ?? data.ingredients)
        : [],
      image_url: Array.isArray(data.image) ? (data.image[0] ?? "") : (data.image ?? ""),
      total_time: Number(data.totalTime) || 0,
      servings: String(data.recipeYield ?? data.servings ?? ""),
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
    const { url } = await req.json() as { url: string };

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

    // ── Scrape: Python first, npm fallback ───────────────────────────────────
    let result = await tryPythonScraper(url);
    if (!result || result.ingredients.length === 0) {
      result = await tryNpmScraper(url);
    }

    if (!result || result.ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not extract recipe data from this URL" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Persist to cache ─────────────────────────────────────────────────────
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
