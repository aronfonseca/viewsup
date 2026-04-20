// Worker that processes a single analysis_jobs row.
// Designed to be triggered by the client right after enqueueing the job.
// The function returns immediately after kicking off background processing
// (EdgeRuntime.waitUntil) so the HTTP request never times out.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_SCHEMA = {
  name: "instagram_analysis",
  description: "Lean Instagram audit focused on the most essential retention and content outputs",
  parameters: {
    type: "object",
    properties: {
      overallScore: { type: "number" },
      dimensions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            score: { type: "number" },
            label: { type: "string" },
            icon: { type: "string", enum: ["Zap", "Eye", "MessageCircle", "LayoutGrid", "Heart"] },
          },
          required: ["name", "score", "label", "icon"],
          additionalProperties: false,
        },
      },
      profileHealth: {
        type: "object",
        properties: {
          visualConsistency: {
            type: "object",
            properties: {
              score: { type: "number" },
              hasColorPattern: { type: "boolean" },
              hasFontPattern: { type: "boolean" },
              hostFaceVisible: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["score", "hasColorPattern", "hasFontPattern", "hostFaceVisible", "issues", "insight"],
            additionalProperties: false,
          },
          bioHook: {
            type: "object",
            properties: {
              hasUSP: { type: "boolean" },
              hasVisibleLink: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["hasUSP", "hasVisibleLink", "issues", "insight"],
            additionalProperties: false,
          },
          engagementRatio: {
            type: "object",
            properties: {
              ratio: { type: "number" },
              avgLikes: { type: "number" },
              avgComments: { type: "number" },
              healthLabel: { type: "string", enum: ["Healthy", "Average", "Low", "Critical"] },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["ratio", "avgLikes", "avgComments", "healthLabel", "issues", "insight"],
            additionalProperties: false,
          },
        },
        required: ["visualConsistency", "bioHook", "engagementRatio"],
        additionalProperties: false,
      },
      hookRetention: {
        type: "object",
        properties: {
          score: { type: "number" },
          audienceLostPercent: { type: "number" },
          hasVisualHook: { type: "boolean" },
          hasVerbalHook: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "audienceLostPercent", "hasVisualHook", "hasVerbalHook", "issues", "insight"],
        additionalProperties: false,
      },
      viralScore: {
        type: "object",
        properties: {
          probability: { type: "number" },
          hookStrengthFactor: { type: "number" },
          editDensityFactor: { type: "number" },
          verdict: { type: "string" },
        },
        required: ["probability", "hookStrengthFactor", "editDensityFactor", "verdict"],
        additionalProperties: false,
      },
      burningProblems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            problem: { type: "string" },
            impact: { type: "string" },
            solution: { type: "string" },
          },
          required: ["problem", "impact", "solution"],
          additionalProperties: false,
        },
      },
      issues: { type: "array", items: { type: "string" } },
      patterns: { type: "array", items: { type: "string" } },
      improvedHooks: { type: "array", items: { type: "string" } },
      rewrittenCaptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            rewritten: { type: "string" },
          },
          required: ["original", "rewritten"],
          additionalProperties: false,
        },
      },
      videoIdeas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            format: { type: "string", enum: ["Tutorial", "Polêmica", "Comparativo", "Bastidores", "Prova Social"] },
            hookVerbal: { type: "string" },
            structure: {
              type: "object",
              properties: {
                gancho: { type: "string" },
                desenvolvimento: { type: "string" },
                cta: { type: "string" },
              },
              required: ["gancho", "desenvolvimento", "cta"],
              additionalProperties: false,
            },
            bestDay: { type: "string" },
            bestTime: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
          },
          required: ["title", "format", "hookVerbal", "structure", "bestDay", "bestTime", "hashtags"],
          additionalProperties: false,
        },
      },
      trendRadar: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            example: { type: "string" },
            relevance: { type: "string" },
          },
          required: ["title", "description", "example", "relevance"],
          additionalProperties: false,
        },
      },
      scriptSuggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            visualDirection: { type: "string" },
            whyItWorks: { type: "string" },
          },
          required: ["title", "hook", "visualDirection", "whyItWorks"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "overallScore",
      "dimensions",
      "profileHealth",
      "hookRetention",
      "viralScore",
      "burningProblems",
      "issues",
      "patterns",
      "improvedHooks",
      "rewrittenCaptions",
      "videoIdeas",
      "trendRadar",
      "scriptSuggestions",
    ],
    additionalProperties: false,
  },
};

function buildPrompts(username: string, url: string, lang: string, company: string, scrapedSummary: string) {
  const isPT = lang === "pt-BR";
  const c = company || "Viewsup Insights";
  const langLine = isPT
    ? "OUTPUT LANGUAGE: ALL text MUST be in Português Brasileiro (PT-BR)."
    : "OUTPUT LANGUAGE: ALL text MUST be in British English (EN-GB).";

  const systemPrompt = `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance.

${langLine}

Given an Instagram profile and (when available) recent post data, deliver a lean but high-quality audit. Be specific, realistic, concise and constructive. Scores realistic (most profiles 35-70, rarely above 80).

Return ONLY the fields defined in the tool schema, mentioning ${c} naturally in burningProblems solutions when relevant.

Keep each text field tight so the full JSON stays compact.`;

  const userPrompt = isPT
    ? `Analise o perfil do Instagram @${username} (URL: ${url}).

DADOS COLETADOS:
${scrapedSummary}

Retorne apenas a análise enxuta definida no schema. Todo o conteúdo DEVE ser em Português Brasileiro.`
    : `Analyse the Instagram profile @${username} (URL: ${url}).

SCRAPED DATA:
${scrapedSummary}

Return only the lean analysis defined in the schema. ALL content must be in British English.`;

  return { systemPrompt, userPrompt };
}

// --- Apify Instagram scraping (best-effort; failure is non-fatal) ---
async function scrapeInstagram(username: string): Promise<string> {
  const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
  if (!APIFY_API_KEY) {
    console.log("[Apify] no key — skipping scrape");
    return "Sem dados de scraping disponíveis. Faça uma análise simulada com base no username e boas práticas.";
  }
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), 90_000);
  try {
    console.log("[Apify] starting scrape for @", username);
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=80`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] }),
        signal: ac.signal,
      },
    );
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn("[Apify] non-OK status:", res.status);
      return "Sem dados de scraping disponíveis. Faça análise simulada baseada no username.";
    }
    const items = (await res.json()) as any[];
    const profile = items?.[0];
    if (!profile) return "Sem dados de scraping disponíveis.";
    const posts = (profile.latestPosts || []).slice(0, 8).map((p: any, i: number) =>
      `Post ${i + 1}: ${p.type || "?"} | likes=${p.likesCount ?? "?"} comments=${p.commentsCount ?? "?"} | caption="${(p.caption || "").slice(0, 180)}"`
    ).join("\n");
    return `Bio: ${profile.biography || "(empty)"}
Followers: ${profile.followersCount ?? "?"} | Following: ${profile.followsCount ?? "?"} | Posts: ${profile.postsCount ?? "?"}
Verified: ${!!profile.verified} | Business: ${!!profile.isBusinessAccount}
External link: ${profile.externalUrl || "(none)"}
Recent posts:
${posts || "(none)"}`;
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("[Apify] failed:", (e as Error).message);
    return "Sem dados de scraping disponíveis (apify timeout/error). Faça análise simulada.";
  }
}

async function processJob(jobId: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Load job & flip to processing
  const { data: job, error: loadErr } = await admin
    .from("analysis_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (loadErr || !job) {
    console.error("[Worker] job not found:", jobId, loadErr?.message);
    return;
  }
  if (job.status !== "pending") {
    console.log("[Worker] job already in status:", job.status);
    return;
  }

  await admin.from("analysis_jobs").update({
    status: "processing",
    started_at: new Date().toISOString(),
  }).eq("id", jobId);

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    const username = job.username as string;
    const scrapedSummary = await scrapeInstagram(username);
    const { systemPrompt, userPrompt } = buildPrompts(
      username,
      job.instagram_url,
      job.language,
      job.company_name || "Viewsup Insights",
      scrapedSummary,
    );

    console.log("[Worker] calling Anthropic for job:", jobId);
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 240_000);
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        temperature: 0.2,
        system: systemPrompt,
        tools: [{
          name: ANALYSIS_SCHEMA.name,
          description: ANALYSIS_SCHEMA.description,
          input_schema: ANALYSIS_SCHEMA.parameters,
        }],
        tool_choice: { type: "tool", name: ANALYSIS_SCHEMA.name },
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: ac.signal,
    });
    clearTimeout(timeoutId);

    if (!anthropicRes.ok) {
      const txt = await anthropicRes.text();
      console.error("[Anthropic] error:", anthropicRes.status, txt.slice(0, 500));
      throw new Error(`Anthropic ${anthropicRes.status}`);
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content || []).find((b: any) => b.type === "tool_use");
    if (!toolUse?.input) throw new Error("AI did not return structured analysis");

    const result = {
      url: job.instagram_url,
      username,
      language: job.language,
      ...toolUse.input,
    };

    await admin.from("analysis_jobs").update({
      status: "completed",
      result_data: result,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Mirror to legacy reports table for dashboard listing
    try {
      await admin.from("reports").insert({
        user_id: job.user_id,
        username,
        profile_url: job.instagram_url,
        language: job.language,
        analysis_data: result,
      });
    } catch (e) {
      console.warn("[Worker] reports mirror failed:", (e as Error).message);
    }

    console.log("[Worker] job completed:", jobId);
  } catch (e) {
    const msg = (e as Error).message || "Unknown error";
    console.error("[Worker] job failed:", jobId, msg);
    await admin.from("analysis_jobs").update({
      status: "failed",
      error_message: msg.slice(0, 500),
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authErr } = await authed.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== "string") {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the job belongs to the user (RLS would also block, but be explicit)
    const { data: job } = await authed
      .from("analysis_jobs")
      .select("id, user_id, status")
      .eq("id", jobId)
      .maybeSingle();
    if (!job || job.user_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kick off processing in the background — the HTTP response returns immediately,
    // so the client never holds the connection open and there is no idle timeout.
    // @ts-ignore EdgeRuntime is provided by Supabase Edge runtime
    EdgeRuntime.waitUntil(processJob(jobId));

    return new Response(JSON.stringify({ ok: true, jobId }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-job error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
