// Manually-triggered batch agent: discovers a small batch of REAL Instagram
// profiles via web search, scrapes each one, and runs a lightweight (Haiku,
// vision) extraction — content pillars, dominant pillar %, visual consistency,
// and whether real performance data is available — instead of the full
// paid-analysis pipeline (process-job). Produces a comparative table across
// the batch and feeds the aggregates back into nicho_insights so future
// analyses (paid or benchmark) are grounded in more real examples.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { scrapeInstagram, type ScrapeResult } from "../_shared/apify.ts";
import { fetchImageAsBase64 } from "../_shared/images.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NICHES = [
  "Imobiliaria", "Fitness", "Beleza", "Moda", "Alimentacao", "Educacao", "Tecnologia",
  "Marketing", "Financas", "Saude", "Coaching", "Ecommerce", "Turismo", "Automotivo",
  "Entretenimento", "Servicos", "B2B", "Lifestyle", "Arte",
  "Empresarios", "Empresas", "Influenciadores", "Outros",
];

const ADMIN_EMAILS = new Set([
  "aronfonseca2020@gmail.com",
  "aronfonsecaoficial@gmail.com",
]);

const DEFAULT_BATCH_SIZE = 12;
const SCRAPE_TIMEOUT_MS = 60_000;

interface DiscoveredProfile {
  username: string;
  nicho: string;
  reasoning: string;
}

async function discoverProfiles(
  niches: string[],
  excludeUsernames: string[],
  count: number,
  anthropicKey: string,
): Promise<DiscoveredProfile[]> {
  const excludeLine = excludeUsernames.length
    ? `\nDo NOT suggest any of these usernames — already scanned recently: ${excludeUsernames.slice(0, 200).join(", ")}`
    : "";

  const prompt = `You are a social media research analyst with access to real-time web search.

TASK: Find ${count} REAL, currently active, public Instagram profiles spread across these niches (roughly balanced): ${niches.join(", ")}. Use web search to confirm each account actually exists and is active — do not guess from memory. Prefer accounts with a genuinely distinguishable content style (useful for studying content pillars and visual consistency), avoid private/inactive-looking accounts.${excludeLine}

Return STRICT JSON only, no markdown, no commentary outside the JSON:
{
  "profiles": [
    { "username": "instagram_handle_without_@", "nicho": "one of: ${niches.join(", ")}", "reasoning": "short reason this is a good real example to study" }
  ]
}

Return up to ${count} profiles. If you cannot verify enough real accounts via search, return fewer rather than inventing ones.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
    }),
  });
  if (!res.ok) throw new Error(`Claude discovery failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
  const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn("[pillar-scan] discovery: no JSON found in response");
    return [];
  }
  try {
    const parsed = JSON.parse(match[0]);
    const profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
    return profiles
      .filter((p: any) => typeof p?.username === "string" && p.username.trim().length > 0)
      .map((p: any) => ({
        username: String(p.username).replace(/^@/, "").trim().toLowerCase(),
        nicho: NICHES.includes(p.nicho) ? p.nicho : "Outros",
        reasoning: String(p.reasoning || "").slice(0, 300),
      }))
      .slice(0, count);
  } catch (e) {
    console.warn("[pillar-scan] discovery: JSON parse failed:", (e as Error).message);
    return [];
  }
}

const SCAN_SCHEMA = {
  name: "pillar_scan",
  description: "Lightweight extraction of content-pillar structure and visual consistency from a real Instagram profile's scraped data and thumbnails.",
  input_schema: {
    type: "object",
    properties: {
      pillars: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 6,
        description: "Distinct content pillars/themes found across the analysed posts (short labels).",
      },
      dominantPillar: { type: "string", description: "Must be one of the entries in 'pillars' — the most frequent one." },
      dominantPillarPercent: { type: "number", description: "Approximate % (0-100) of analysed posts belonging to dominantPillar." },
      visualConsistency: { type: "string", enum: ["alta", "media", "baixa"], description: "Judge from the real thumbnail images if provided; otherwise 'media' as a neutral default." },
      visualConsistencyReasoning: { type: "string", description: "One short sentence grounded in what you observed (colour palette, typography, face presence) or the post captions if no images were available." },
    },
    required: ["pillars", "dominantPillar", "dominantPillarPercent", "visualConsistency", "visualConsistencyReasoning"],
    additionalProperties: false,
  },
};

async function scanProfile(
  scrape: ScrapeResult,
  anthropicKey: string,
): Promise<{
  pillars: string[];
  dominantPillar: string;
  dominantPillarPercent: number;
  visualConsistency: "alta" | "media" | "baixa";
  visualConsistencyReasoning: string;
} | null> {
  const imageBlocks = (await Promise.all(
    (scrape.postImageUrls || []).slice(0, 3).map((url) => fetchImageAsBase64(url)),
  )).filter((img): img is { data: string; mediaType: string } => img != null);

  const content: any[] = [];
  if (imageBlocks.length > 0) {
    content.push({
      type: "text",
      text: `The ${imageBlocks.length} images below are REAL thumbnails of this profile's recent posts. Use them to judge visualConsistency directly and confidently.`,
    });
    for (const img of imageBlocks) {
      content.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } });
    }
  }
  content.push({
    type: "text",
    text: `Analyse the content pillars and (if images were shown above) visual consistency of this Instagram profile from its real scraped data:\n\n${scrape.summary}`,
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      temperature: 0.1,
      tools: [SCAN_SCHEMA],
      tool_choice: { type: "tool", name: SCAN_SCHEMA.name },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    console.warn(`[pillar-scan] scan Anthropic error [${res.status}]:`, (await res.text()).slice(0, 300));
    return null;
  }
  const data = await res.json();
  const toolUse = (data.content || []).find((b: any) => b.type === "tool_use");
  if (!toolUse?.input) return null;
  return toolUse.input;
}

async function runBatch(supabase: any, batchId: string, profiles: DiscoveredProfile[], anthropicKey: string) {
  for (const profile of profiles) {
    try {
      console.log(`[pillar-scan] scanning @${profile.username} (${profile.nicho})`);
      const scrape = await scrapeInstagram(profile.username, SCRAPE_TIMEOUT_MS);
      const dadosPerformanceDisponiveis =
        scrape.followers != null && scrape.followers > 0 &&
        (scrape.avgLikes != null || scrape.avgComments != null || scrape.avgViews != null);

      if (!dadosPerformanceDisponiveis) {
        await supabase.from("profile_pillar_scans").insert({
          batch_id: batchId,
          username: profile.username,
          nicho: profile.nicho,
          dados_performance_disponiveis: false,
          scan_error: "Sem dados públicos suficientes (perfil privado, inexistente ou scrape falhou).",
        });
        continue;
      }

      const scan = await scanProfile(scrape, anthropicKey);
      if (!scan) {
        await supabase.from("profile_pillar_scans").insert({
          batch_id: batchId,
          username: profile.username,
          nicho: profile.nicho,
          dados_performance_disponiveis: true,
          scan_error: "Falha na extração de pilares (erro de IA).",
        });
        continue;
      }

      await supabase.from("profile_pillar_scans").insert({
        batch_id: batchId,
        username: profile.username,
        nicho: profile.nicho,
        pilares_distintos: Array.isArray(scan.pillars) ? scan.pillars.length : null,
        pilar_dominante: scan.dominantPillar ?? null,
        pilar_dominante_pct: Number.isFinite(scan.dominantPillarPercent) ? scan.dominantPillarPercent : null,
        consistencia_visual: scan.visualConsistency ?? null,
        dados_performance_disponiveis: true,
        pillars_detail: {
          pillars: scan.pillars ?? [],
          visualConsistencyReasoning: scan.visualConsistencyReasoning ?? "",
        },
      });
      console.log(`[pillar-scan] ✓ @${profile.username}: ${scan.pillars?.length ?? "?"} pilares, visual=${scan.visualConsistency}`);
    } catch (err: any) {
      console.error(`[pillar-scan] ✗ @${profile.username}:`, err.message);
      await supabase.from("profile_pillar_scans").insert({
        batch_id: batchId,
        username: profile.username,
        nicho: profile.nicho,
        scan_error: err.message?.slice(0, 300) || "Erro desconhecido",
      });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  await supabase.from("pillar_scan_batches").update({
    status: "completed",
    completed_at: new Date().toISOString(),
  }).eq("id", batchId);
  console.log(`[pillar-scan] batch ${batchId} completed`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: any = {};
  try { body = await req.json(); } catch (_) { /* no body */ }
  const action = body?.action === "list" ? "list" : "run";

  if (action === "list") {
    let batchQuery = supabase.from("pillar_scan_batches").select("*");
    if (typeof body?.batchId === "string") {
      batchQuery = batchQuery.eq("id", body.batchId);
    } else {
      batchQuery = batchQuery.order("created_at", { ascending: false }).limit(1);
    }
    const { data: batches, error: batchErr } = await batchQuery;
    if (batchErr) {
      return new Response(JSON.stringify({ error: batchErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const batch = batches?.[0] ?? null;
    if (!batch) {
      return new Response(JSON.stringify({ batch: null, scans: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: scans, error: scansErr } = await supabase
      .from("profile_pillar_scans")
      .select("*")
      .eq("batch_id", batch.id)
      .order("created_at", { ascending: true });
    if (scansErr) {
      return new Response(JSON.stringify({ error: scansErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ batch, scans: scans ?? [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // action === "run"
  const requestedCount = Number.isFinite(body?.count) && body.count > 0 && body.count <= DEFAULT_BATCH_SIZE
    ? Math.floor(body.count)
    : DEFAULT_BATCH_SIZE;

  let targetNiches: string[] = Array.isArray(body?.niches)
    ? body.niches.filter((n: any) => NICHES.includes(n))
    : [];

  if (targetNiches.length === 0) {
    // Prioritise niches with the least pillar-scan coverage so far.
    const { data: existing } = await supabase.from("profile_pillar_scans").select("nicho");
    const counts = new Map<string, number>();
    for (const n of NICHES) counts.set(n, 0);
    for (const row of existing ?? []) {
      if (row.nicho) counts.set(row.nicho, (counts.get(row.nicho) ?? 0) + 1);
    }
    targetNiches = [...counts.entries()].sort((a, b) => a[1] - b[1]).slice(0, 6).map(([n]) => n);
  }

  // Avoid re-scanning the same profiles across recent runs.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentScans } = await supabase
    .from("profile_pillar_scans")
    .select("username")
    .gte("created_at", since);
  const excludeUsernames = [...new Set((recentScans ?? []).map((r: any) => r.username))];

  let discovered: DiscoveredProfile[];
  try {
    discovered = await discoverProfiles(targetNiches, excludeUsernames, requestedCount, ANTHROPIC_API_KEY);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Discovery failed: ${err.message}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (discovered.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhum perfil real encontrado nesta rodada — tenta de novo ou muda os nichos." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: batchRow, error: batchInsertErr } = await supabase
    .from("pillar_scan_batches")
    .insert({ requested_count: discovered.length, niches: targetNiches, status: "running" })
    .select("id")
    .single();
  if (batchInsertErr || !batchRow) {
    return new Response(JSON.stringify({ error: batchInsertErr?.message || "Failed to create batch" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  const work = runBatch(supabase, batchRow.id, discovered, ANTHROPIC_API_KEY);
  if (rt?.waitUntil) rt.waitUntil(work);
  else work.catch((e) => console.error("[pillar-scan] background failure:", e));

  return new Response(JSON.stringify({ accepted: true, batchId: batchRow.id, targetCount: discovered.length }), {
    status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
