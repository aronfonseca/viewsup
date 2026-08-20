// Suggests real Instagram reference accounts per niche using Claude's
// server-side web_search tool, and inserts them into nicho_seed_accounts
// as 'pending'. Nothing here is trusted automatically — niche-benchmark-agent
// only scrapes 'approved' rows, and an admin approves/rejects suggestions
// via the Admin UI (see nicho-seed-review edge function). This keeps a
// human in the loop instead of letting the AI's account picks feed the
// product directly, since it can't verify an account is real or still active.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NICHES = [
  "Imobiliaria","Fitness","Beleza","Moda","Alimentacao","Educacao","Tecnologia",
  "Marketing","Financas","Saude","Coaching","Ecommerce","Turismo","Automotivo",
  "Entretenimento","Servicos","B2B","Lifestyle","Arte",
  "Empresarios","Empresas","Influenciadores","Outros",
];

const ADMIN_EMAILS = new Set([
  "aronfonseca2020@gmail.com",
  "aronfonsecaoficial@gmail.com",
]);

// On a full sweep (no explicit niches requested), skip niches that already
// have this many approved accounts — no need to keep suggesting more.
const MIN_APPROVED_TARGET = 5;
const SUGGESTIONS_PER_NICHE = 3;

async function suggestAccounts(niche: string, anthropicKey: string): Promise<{ username: string; reasoning: string; source: string }[]> {
  const prompt = `You are a social media research analyst with access to real-time web search.

TASK: Find ${SUGGESTIONS_PER_NICHE} REAL, currently active, public Instagram accounts that would make good BENCHMARK/REFERENCE accounts for the "${niche}" niche (Brazil-focused, but a strong global account is acceptable too). Use web search to confirm each account actually exists and posts in this niche — do not guess from memory.

Good candidates: established creators/businesses with a real, findable public Instagram presence, genuinely representative of this niche's content style. Avoid celebrities whose content isn't representative of the niche, avoid accounts you can't verify existed via search, avoid private/inactive-looking accounts.

Return STRICT JSON only, no markdown, no commentary outside the JSON:
{
  "accounts": [
    { "username": "instagram_handle_without_@", "reasoning": "why this account is a good reference for the niche", "source": "domain or article where you found/confirmed this account" }
  ]
}

Return exactly ${SUGGESTIONS_PER_NICHE} accounts. If you cannot verify enough real accounts via search, return fewer rather than inventing ones.`;

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
    console.warn(`[niche-account-scout] ${niche}: no JSON found in response. Raw text:`, text.slice(0, 500));
    return [];
  }
  try {
    const parsed = JSON.parse(match[0]);
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
    return accounts
      .filter((a: any) => typeof a?.username === "string" && a.username.trim().length > 0)
      .map((a: any) => ({
        username: String(a.username).replace(/^@/, "").trim(),
        reasoning: String(a.reasoning || "").slice(0, 500),
        source: String(a.source || "").slice(0, 200),
      }));
  } catch (e) {
    console.warn(`[niche-account-scout] ${niche}: JSON parse failed:`, (e as Error).message);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const CRON_SHARED_SECRET = Deno.env.get("CRON_SHARED_SECRET");

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const isServiceCall = bearer === SERVICE_KEY || (!!CRON_SHARED_SECRET && bearer === CRON_SHARED_SECRET);
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

  let target: string[];
  if (requested && requested.length > 0) {
    target = requested;
  } else {
    // Full sweep: skip niches that already have enough approved accounts.
    const { data: approvedRows, error: approvedErr } = await supabase
      .from("nicho_seed_accounts")
      .select("nicho")
      .eq("status", "approved");
    if (approvedErr) console.warn("[niche-account-scout] failed to load approved counts:", approvedErr.message);
    const approvedCounts = new Map<string, number>();
    for (const row of approvedRows ?? []) {
      approvedCounts.set(row.nicho, (approvedCounts.get(row.nicho) ?? 0) + 1);
    }
    target = NICHES.filter((n) => (approvedCounts.get(n) ?? 0) < MIN_APPROVED_TARGET);
  }

  async function runScout() {
    console.log(`[niche-account-scout] Scouting ${target.length} niches: ${target.join(", ") || "(none — all niches already well covered)"}`);
    let inserted = 0;
    for (const niche of target) {
      try {
        console.log(`[niche-account-scout] Searching accounts for: ${niche}`);
        const accounts = await suggestAccounts(niche, ANTHROPIC_API_KEY!);
        if (accounts.length === 0) {
          console.log(`[niche-account-scout] ${niche}: no candidates found`);
        } else {
          const { error, count } = await supabase
            .from("nicho_seed_accounts")
            .upsert(
              accounts.map((a) => ({
                nicho: niche,
                username: a.username,
                status: "pending",
                suggested_by: "ai",
                reasoning: a.reasoning,
                source: a.source,
              })),
              { onConflict: "nicho,username", ignoreDuplicates: true, count: "exact" },
            );
          if (error) throw error;
          inserted += count ?? accounts.length;
          console.log(`[niche-account-scout] ✓ ${niche}: ${accounts.length} candidates suggested`);
        }
      } catch (err: any) {
        console.error(`[niche-account-scout] ✗ ${niche}:`, err.message);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    console.log(`[niche-account-scout] Done. ~${inserted} new suggestions inserted across ${target.length} niches.`);
  }

  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  const work = runScout();
  if (rt?.waitUntil) rt.waitUntil(work);
  else work.catch((e) => console.error("[niche-account-scout] background failure:", e));

  return new Response(JSON.stringify({ accepted: true, niches: target }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
