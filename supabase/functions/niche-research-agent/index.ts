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

// Real, grounded research using Anthropic's server-side web_search tool.
// Replaces the old stub that just fed the query string back to Claude and
// let it hallucinate patterns from training knowledge.
async function extractPatterns(niche: string, anthropicKey: string) {
  const prompt = `You are a senior Instagram content strategist with access to real-time web search.

TASK: Research CURRENT, REAL information for the "${niche}" niche (Brazil + global), using web search before answering:
1. Any recent Instagram/Meta algorithm changes, ranking signal updates, or official guidance from 2025-2026 that affects how content is distributed.
2. The top viral content formats and patterns ACTUALLY working right now on Instagram for the "${niche}" niche — based on real posts, creators, or reporting you find, not assumptions.

Search using queries like:
- "Instagram algorithm update 2026"
- "Instagram algorithm changes ranking signals"
- "${niche} Instagram viral content trends 2026"
- "${niche} Instagram Reels tendências 2026"

After researching, return STRICT JSON only, no markdown, no commentary outside the JSON:
{
  "summary": "2-3 sentence narrative of what's working in this niche right now on Instagram, grounded in what you found",
  "algorithmNotes": "1-2 sentences on the most relevant CURRENT Instagram algorithm behavior/signal affecting this niche, based on real sources you found. If you found nothing niche-specific, summarize the most relevant general algorithm finding instead.",
  "patterns": [
    { "pattern": "specific content format name", "description": "why it goes viral in this niche right now", "example": "concrete example for ${niche}", "source": "domain or publication name where you found this (e.g. 'later.com', 'Meta Newsroom', 'socialmediatoday.com')" }
  ]
}

Return exactly 5 patterns. If web search returns nothing useful for a claim, say so plainly in that field instead of fabricating a source.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    }),
  });
  if (!res.ok) throw new Error(`Claude failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();

  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn(`[niche-research] ${niche}: no JSON found in response. Raw text:`, text.slice(0, 500));
    return { summary: "", algorithmNotes: "", patterns: [] };
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.warn(`[niche-research] ${niche}: JSON parse failed:`, (e as Error).message);
    return { summary: "", algorithmNotes: "", patterns: [] };
  }
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

  // No explicit niches passed (e.g. the weekly cron call) → only research
  // niches you've actively opted into via nicho_seed_accounts, instead of
  // spending real web-search calls on every niche by default. Curating a
  // niche there is what signals "I want deeper knowledge here".
  let target = requested && requested.length > 0 ? requested : null;
  if (!target) {
    const { data: priorityRows, error: priorityErr } = await supabase
      .from("nicho_seed_accounts")
      .select("nicho");
    if (priorityErr) console.warn("[niche-research] failed to load priority niches:", priorityErr.message);
    target = [...new Set((priorityRows ?? []).map((r: any) => r.nicho as string))];
  }

  // Real web search per niche is much slower than the old stub, so we run the
  // batch in the background (like analyze-video / process-job do) and reply
  // immediately — otherwise a full 20-niche cron run risks the edge function
  // wall-clock timeout.
  async function runResearch() {
    console.log(`[niche-research] Processing ${target.length} niches: ${target.join(", ")}`);
    let processed = 0;
    for (const niche of target) {
      try {
        console.log(`[niche-research] Researching: ${niche}`);
        const extracted = await extractPatterns(niche, ANTHROPIC_API_KEY!);
        const patterns = extracted.patterns || [];
        const insightText = [extracted.summary, extracted.algorithmNotes ? `Algoritmo: ${extracted.algorithmNotes}` : null]
          .filter(Boolean)
          .join(" ");
        console.log(`[niche-research] ${niche} EXTRACTED:`, JSON.stringify(extracted).slice(0, 800));

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
      } catch (err: any) {
        console.error(`[niche-research] ✗ ${niche}:`, err.message);
      }

      await new Promise((r) => setTimeout(r, 1500));
    }
    console.log(`[niche-research] Done. ${processed}/${target.length} niches processed.`);
  }

  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  const work = runResearch();
  if (rt?.waitUntil) rt.waitUntil(work);
  else work.catch((e) => console.error("[niche-research] background failure:", e));

  return new Response(JSON.stringify({ accepted: true, niches: target }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
