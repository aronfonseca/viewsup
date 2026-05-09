import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NICHES = [
  "Imobiliaria","Fitness","Beleza","Moda","Alimentacao","Educacao","Tecnologia",
  "Marketing","Financas","Saude","Coaching","Ecommerce","Turismo","Automotivo",
  "Entretenimento","Servicos","B2B","Lifestyle","Arte","Outros",
];

const GOOGLE_CX = "7643ce83db72345b4";

async function googleSearch(query: string, _apiKey: string) {
  const encodedQuery = encodeURIComponent(query);
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`,
    { headers: { "User-Agent": "ViewsupAgent/1.0" } }
  );
  if (!res.ok) throw new Error(`DuckDuckGo search failed [${res.status}]`);
  const data = await res.json();
  const results = [
    data.AbstractText ? { title: "Overview", snippet: data.AbstractText, link: data.AbstractURL } : null,
    ...(data.RelatedTopics || []).slice(0, 9).map((t: any) => ({
      title: t.Text?.split(" - ")?.[0] || "Related",
      snippet: t.Text || "",
      link: t.FirstURL || "",
    })),
  ].filter(Boolean);
  return results;
}

async function extractPatterns(niche: string, results: any[], anthropicKey: string) {
  const prompt = `You are a senior Instagram content strategist. Based on these real 2026 search results about "${niche}" Instagram viral content trends, extract the TOP 5 viral content patterns specific to this niche.

Search results:
${JSON.stringify(results, null, 2)}

Return STRICT JSON only, no markdown, with this shape:
{
  "summary": "2-3 sentence narrative of what's working in this niche right now",
  "patterns": [
    { "pattern": "short name", "description": "why it works in this niche", "example": "concrete example" }
  ]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { summary: "", patterns: [] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let requested: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.niches) && body.niches.length > 0) {
      requested = body.niches.filter((n: any) => NICHES.includes(n));
    }
  } catch (_) { /* no body */ }
  const target = requested && requested.length > 0 ? requested : NICHES;
  console.log(`[niche-research] Processing ${target.length} niches: ${target.join(", ")}`);

  const summary: any[] = [];
  let processed = 0;

  for (const niche of target) {
    try {
      const query = `${niche} tendências conteúdo Instagram 2026 viral`;
      console.log(`[niche-research] Searching: ${query}`);
      const results = await googleSearch(query, GOOGLE_API_KEY);
      console.log(`[niche-research] ${niche}: ${results.length} results`);

      console.log(`[niche-research] ${niche} GOOGLE RESULTS:`, JSON.stringify(results, null, 2));

      if (results.length === 0) {
        summary.push({ niche, status: "no_results" });
        continue;
      }

      const extracted = await extractPatterns(niche, results, ANTHROPIC_API_KEY);
      const patterns = extracted.patterns || [];
      const insightText = extracted.summary || "";
      console.log(`[niche-research] ${niche} CLAUDE EXTRACTED:`, JSON.stringify(extracted, null, 2));

      const { error } = await supabase
        .from("nicho_insights")
        .upsert({
          nicho: niche,
          insight_text: insightText,
          top_problemas: patterns,
          insight_generated_at: new Date().toISOString(),
          insight_generated_at_count: 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: "nicho" });

      if (error) throw error;

      processed++;
      console.log(`[niche-research] ✓ ${niche}: ${patterns.length} patterns saved`);
      summary.push({ niche, summary: insightText, patterns });

      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`[niche-research] ✗ ${niche}:`, err.message);
      summary.push({ niche, status: "error", error: err.message });
    }
  }

  console.log(`[niche-research] Done. ${processed}/${NICHES.length} niches processed.`);
  console.log(`[niche-research] Summary:`, JSON.stringify(summary, null, 2));

  return new Response(JSON.stringify({ processed, total: NICHES.length, summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
