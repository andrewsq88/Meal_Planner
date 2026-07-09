import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = [
  "https://www.weeklymealplan.space",
  "https://weeklymealplan.space",
];

const MINIMAX_API_URL = "https://api.minimax.io/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-M2.5-highspeed";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const { name, mealType } = await req.json() as { name: string; mealType: string };

    if (!name || name.trim().length < 3) {
      return new Response(JSON.stringify({ description: "", ingredients: [] }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MINIMAX_API_KEY");
    if (!apiKey) {
      console.error("MINIMAX_API_KEY secret is not set");
      return new Response(JSON.stringify({ description: "", ingredients: [] }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const safeName = name.trim().slice(0, 100);
    const safeMealType = ["breakfast", "lunch", "dinner"].includes(mealType) ? mealType : "dinner";

    const prompt = `Given the meal "${safeName}" served as ${safeMealType}, respond with ONLY valid JSON — no markdown, no code fences, no extra text — in exactly this shape:
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
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    let parsed: { description: string; ingredients: string[] } = { description: "", ingredients: [] };
    try {
      const clean = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggest-meal-details error:", err);
    return new Response(
      JSON.stringify({ description: "", ingredients: [] }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
