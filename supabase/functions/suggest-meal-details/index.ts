import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MINIMAX_API_URL = "https://api.minimax.io/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-M2.5-highspeed";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { name, mealType } = await req.json() as { name: string; mealType: string };

    if (!name || name.trim().length < 3) {
      return new Response(JSON.stringify({ description: "", ingredients: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MINIMAX_API_KEY") ?? "sk-api-eHx-JMX2T8z0bPfDAXnxMVwHaJZB2QjRM2OH9rSaphv4riBwzpPhx0U2NPk3NFaNPQhAR1oLhvnjGdPAlBBo_YPzZlF3SWgfRNnsge5FnZ-5BHKZJcXRn3I";

    const prompt = `Given the meal "${name.trim()}" served as ${mealType}, respond with ONLY valid JSON — no markdown, no code fences, no extra text — in exactly this shape:
{"description":"one concise sentence describing the dish","ingredients":["ingredient 1","ingredient 2","ingredient 3","ingredient 4","ingredient 5","ingredient 6"]}
Use 5–8 common ingredients. Keep the description under 100 characters.`;

    const response = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Minimax error:", response.status, errText);
      return new Response(JSON.stringify({ description: "", ingredients: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    let parsed: { description: string; ingredients: string[] } = { description: "", ingredients: [] };
    try {
      // Strip any accidental markdown fences
      const clean = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggest-meal-details error:", err);
    return new Response(
      JSON.stringify({ description: "", ingredients: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
