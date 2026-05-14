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

async function searchTrends(query: string) {
  return [{ title: "Research Request", snippet: query, link: "" }];
}

async function extractPatterns(niche: string, _results: any[], anthropicKey: string) {
  const prompt = `You are a senior Instagram content strategist with deep knowledge of viral content trends in 2026.

Generate the TOP 5 viral content patterns that are currently working on Instagram specifically for the "${niche}" niche in Brazil and globally.

Base this on your training knowledge of what types of content go viral in this industry.

Return STRICT JSON only, no markdown:
{
  "summary": "2-3 sentence narrative of what's working in this niche right now on Instagram",
  "patterns": [
    { "pattern": "specific content format name", "description": "why it goes viral in this niche", "example": "concrete example for ${niche}" }
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
      model: "claude-haiku-4-5-20251001",
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

const ADMIN_EMAILS = new Set([
  "aronfonseca2020@gmail.com",
  "aronfonsecaoficial@gmail.com",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth: allow service-role bearer (cron) OR signed-in admin email.
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const isServiceCall = bearer === SERVICE_KEY;
  if (!isServiceCall) {
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser();
    if (uErr || !u?.user || !ADMIN_EMAILS.has((u.user.email || "").toLowerCase())) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

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
      const results = await searchTrends(query);
      console.log(`[niche-research] ${niche}: ${results.length} results`);

      const extracted = await extractPatterns(niche, results, ANTHROPIC_API_KEY);
      const patterns = extracted.patterns || [];
      const insightText = extracted.summary || "";
      console.log(`[niche-research] ${niche} CLAUDE EXTRACTED:`, JSON.stringify(extracted, null, 2));

         const { error } = await supabase
      .from("nicho_insights")
      .upsert({
        nicho: niche,
        insight_text: insightText,
        viral_patterns: patterns,
        insight_generated_at: new Date().toISOString(),
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

  return new Response(JSON.stringify({ processed, total: NICHES.length, summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
