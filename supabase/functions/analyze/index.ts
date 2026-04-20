import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
          probability: { type: "number", description: "0-100 viral probability" },
          hookStrengthFactor: { type: "number", description: "0-100 hook strength contribution" },
          editDensityFactor: { type: "number", description: "0-100 edit density contribution" },
          verdict: { type: "string", description: "One-sentence verdict about virality potential" },
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
        description: "10 video ideas with mixed formats and clear recording direction",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Video title with hook already written" },
            format: { type: "string", enum: ["Tutorial", "Polêmica", "Comparativo", "Bastidores", "Prova Social"] },
            hookVerbal: { type: "string", description: "Verbal hook for the first 3 seconds" },
            structure: {
              type: "object",
              properties: {
                gancho: { type: "string", description: "Act 1: Hook" },
                desenvolvimento: { type: "string", description: "Act 2: Development" },
                cta: { type: "string", description: "Act 3: Call to Action" },
              },
              required: ["gancho", "desenvolvimento", "cta"],
              additionalProperties: false,
            },
            bestDay: { type: "string", description: "Best day of the week to post" },
            bestTime: { type: "string", description: "Best time to post (e.g. 18:30)" },
            hashtags: { type: "array", items: { type: "string" }, description: "5-8 strategic hashtags" },
          },
          required: ["title", "format", "hookVerbal", "structure", "bestDay", "bestTime", "hashtags"],
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
    ],
    additionalProperties: false,
  },
};

function buildPrompts(username: string, url: string, lang: string, company: string) {
  const isPT = lang === "pt-BR";
  const c = company || "Viewsup Insights";
  const systemPrompt = isPT
    ? `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance.

OUTPUT LANGUAGE: ALL text in the response MUST be in Português Brasileiro (PT-BR). Use linguagem natural do Brasil. NUNCA escreva em inglês.

Given an Instagram username and URL, simulate a lean but high-quality audit of the profile and recent content. Be specific, realistic, concise, and constructive. Scores should be realistic (most profiles 35-70, rarely above 80).

Return ONLY the fields defined in the tool schema.

Focus ONLY on these outputs:
• overallScore
• dimensions
• profileHealth
• hookRetention
• viralScore
• burningProblems (3 items, mentioning ${c} naturally in the solutions when relevant)
• issues (4-8 items)
• patterns (3-5 items)
• improvedHooks (5 items)
• rewrittenCaptions (3 items)
• videoIdeas (10 items with mixed formats)

Keep each text field tight so the full JSON stays compact and fast to generate.`
    : `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance.

OUTPUT LANGUAGE: ALL text MUST be in British English (EN-GB).

Given an Instagram username and URL, simulate a lean but high-quality audit of the profile and recent content. Be specific, realistic, concise, and constructive. Scores should be realistic (most profiles 35-70, rarely above 80).

Return ONLY the fields defined in the tool schema.

Focus ONLY on these outputs:
• overallScore
• dimensions
• profileHealth
• hookRetention
• viralScore
• burningProblems (3 items, mentioning ${c} naturally in the solutions when relevant)
• issues (4-8 items)
• patterns (3-5 items)
• improvedHooks (5 items)
• rewrittenCaptions (3 items)
• videoIdeas (10 items with mixed formats)

Keep each text field tight so the full JSON stays compact and fast to generate.`;

  const userPrompt = isPT
    ? `Analise o perfil do Instagram @${username} (URL: ${url}). Retorne apenas a análise enxuta definida no schema. IMPORTANTE: Todo o conteúdo DEVE ser em Português Brasileiro (PT-BR).`
    : `Analyse the Instagram profile @${username} (URL: ${url}). Return only the lean analysis defined in the schema. ALL content must be in British English.`;

  return { systemPrompt, userPrompt };
}

// Apify scraping removed — Claude now performs the audit using only the profile URL/username.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user (prevent abuse of paid AI/scraping APIs)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authedSupabase.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url, language, companyName } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "A valid Instagram profile URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?(\?.*)?$/;
    if (url.length > 200 || !INSTAGRAM_URL_RE.test(url)) {
      return new Response(
        JSON.stringify({
          error: "URL inválida. Forneça um link de perfil do Instagram (ex: https://www.instagram.com/usuario).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeCompanyName =
      typeof companyName === "string"
        ? companyName.replace(/[<>{}`$]/g, "").slice(0, 80).trim() || "Viewsup Insights"
        : "Viewsup Insights";

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    console.log("[Secrets] ANTHROPIC_API_KEY present:", !!ANTHROPIC_API_KEY, "length:", ANTHROPIC_API_KEY?.length ?? 0);
    if (!ANTHROPIC_API_KEY) {
      console.error("[Secrets] Missing ANTHROPIC_API_KEY");
      return new Response(
        JSON.stringify({ error: "Erro interno, tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const username = url.replace(/\/$/, "").split("/").pop() || "unknown";
    const outputLang = language === "en-GB" ? "en-GB" : "pt-BR";
    const { systemPrompt, userPrompt } = buildPrompts(username, url, outputLang, safeCompanyName);

    // Apify removed — Claude simulates the audit from the URL/username alone.
    const enrichedUserPrompt = userPrompt;

    const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
    console.log("[Anthropic] → POST /v1/messages | model:", ANTHROPIC_MODEL, "| prompt chars:", enrichedUserPrompt.length);
    const anthropicStart = Date.now();

    // Hard timeout below the 150s edge-function idle limit so we always return cleanly.
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 140_000);

    let anthropicRes: Response;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 4000,
          temperature: 0.2,
          system: systemPrompt,
          tools: [
            {
              name: ANALYSIS_SCHEMA.name,
              description: ANALYSIS_SCHEMA.description,
              input_schema: ANALYSIS_SCHEMA.parameters,
            },
          ],
          tool_choice: { type: "tool", name: ANALYSIS_SCHEMA.name },
          messages: [{ role: "user", content: enrichedUserPrompt }],
        }),
        signal: ac.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      const isAbort = (e as Error)?.name === "AbortError";
      console.error("[Anthropic] fetch failed:", isAbort ? "TIMEOUT after 140s" : (e as Error).message);
      return new Response(
        JSON.stringify({ error: isAbort ? "A análise demorou demais. Tente novamente." : "Erro de rede ao consultar IA." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);
    console.log("[Anthropic] ← status:", anthropicRes.status, anthropicRes.statusText, "| elapsed:", Date.now() - anthropicStart, "ms");

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      console.error("[Anthropic] error body:", errorText.slice(0, 2000));
      if (anthropicRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Estamos com muitas solicitações no momento. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro interno, tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content || []).find((b: any) => b.type === "tool_use");
    if (!toolUse?.input) {
      console.error("No tool_use in Anthropic response:", JSON.stringify(data).slice(0, 500));
      throw new Error("AI did not return structured analysis");
    }

    const analysis = toolUse.input;
    const result = { url, username, ...analysis };

    // 3) Persist to reports table linked to logged-in user
    try {
      const { error: insertError } = await authedSupabase.from("reports").insert({
        user_id: authData.user.id,
        username,
        profile_url: url,
        language: outputLang,
        analysis_data: result as any,
      });
      if (insertError) console.warn("Report save failed:", insertError.message);
    } catch (e) {
      console.warn("Persist step skipped:", e);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno, tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
