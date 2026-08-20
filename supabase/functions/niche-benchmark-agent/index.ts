// Updated by Aron on 2026-08-20
// Scrapes admin-curated reference accounts (public.nicho_seed_accounts) per
// niche via Apify and writes real follower/engagement benchmarks into
// nicho_insights.seed_* columns. This is intentionally separate from
// avg_score_geral / avg_engagement etc., which stay computed only from real
// user-submitted profile_history rows (see process-job). No AI calls here —
// pure scraping, so it's cheap to run even for niches with zero paid
// analyses yet.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { scrapeInstagram } from "../_shared/apify.ts";

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

// Cap accounts scraped per niche per run so one invocation stays inside the
// edge function's background wall-clock budget even across several niches.
const MAX_ACCOUNTS_PER_NICHE = 8;
const SCRAPE_TIMEOUT_MS = 60_000;

function avg(arr: number[]): number | null {
  return arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  // Fallback shared secret for the cron job, for setups where the caller
  // doesn't have direct access to SUPABASE_SERVICE_ROLE_KEY (e.g. managed
  // via Lovable Cloud). Set as a Lovable secret + a matching Vault secret.
  const CRON_SHARED_SECRET = Deno.env.get("CRON_SHARED_SECRET");
  console.log("[debug] CRON_SHARED_SECRET set:", !!CRON_SHARED_SECRET, "length:", CRON_SHARED_SECRET?.length);


  // Auth: allow service-role bearer OR the cron shared secret OR signed-in admin email.
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

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let requested: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.niches) && body.niches.length > 0) {
      requested = body.niches.filter((n: any) => NICHES.includes(n));
    }
  } catch (_) { /* no body */ }

  // Only process niches that have APPROVED seed accounts — AI-suggested
  // accounts sit as 'pending' until an admin approves them in the Admin UI.
  const { data: seedRows, error: seedErr } = await supabase
    .from("nicho_seed_accounts")
    .select("nicho, username")
    .eq("status", "approved")
    .order("nicho", { ascending: true });

  if (seedErr) {
    return new Response(JSON.stringify({ error: seedErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const byNicho = new Map<string, string[]>();
  for (const row of seedRows ?? []) {
    if (requested && !requested.includes(row.nicho)) continue;
    const list = byNicho.get(row.nicho) ?? [];
    if (list.length < MAX_ACCOUNTS_PER_NICHE) list.push(row.username);
    byNicho.set(row.nicho, list);
  }

  const target = [...byNicho.keys()];

  async function runBenchmark() {
    console.log(`[niche-benchmark] ${target.length} niches with seed accounts: ${target.join(", ") || "(none)"}`);
    for (const nicho of target) {
      const usernames = byNicho.get(nicho) ?? [];
      const followers: number[] = [];
      const likes: number[] = [];
      const comments: number[] = [];
      const examples: any[] = [];

      for (const username of usernames) {
        try {
          console.log(`[niche-benchmark] scraping @${username} (${nicho})`);
          const scrape = await scrapeInstagram(username, SCRAPE_TIMEOUT_MS);
          if (scrape.followers != null) followers.push(scrape.followers);
          if (scrape.avgLikes != null) likes.push(scrape.avgLikes);
          if (scrape.avgComments != null) comments.push(scrape.avgComments);
          examples.push({
            username,
            followers: scrape.followers,
            avgLikes: scrape.avgLikes,
            avgComments: scrape.avgComments,
            engagementRate: scrape.engagementRate,
          });
        } catch (err: any) {
          console.error(`[niche-benchmark] scrape failed for @${username}:`, err.message);
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      const avgFollowers = avg(followers);
      const avgLikes = avg(likes);
      const avgComments = avg(comments);
      const engagementRate = avgFollowers && (avgLikes != null || avgComments != null)
        ? +(((avgLikes ?? 0) + (avgComments ?? 0)) / avgFollowers * 100).toFixed(2)
        : null;

      const { error } = await supabase
        .from("nicho_insights")
        .upsert({
          nicho,
          seed_profiles_sampled: examples.length,
          seed_avg_followers: avgFollowers,
          seed_avg_likes: avgLikes,
          seed_avg_comments: avgComments,
          seed_engagement_rate: engagementRate,
          seed_examples: examples,
          seed_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "nicho" });

      if (error) {
        console.error(`[niche-benchmark] upsert failed for ${nicho}:`, error.message);
      } else {
        console.log(`[niche-benchmark] ✓ ${nicho}: ${examples.length} accounts sampled, avgFollowers=${avgFollowers ?? "?"}, engagementRate=${engagementRate ?? "?"}%`);
      }
    }
    console.log("[niche-benchmark] done");
  }

  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  const work = runBenchmark();
  if (rt?.waitUntil) rt.waitUntil(work);
  else work.catch((e) => console.error("[niche-benchmark] background failure:", e));

  return new Response(JSON.stringify({
    accepted: true,
    niches: target,
    accountsPerNiche: Object.fromEntries([...byNicho.entries()].map(([k, v]) => [k, v.length])),
  }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
