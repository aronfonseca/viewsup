import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_SCHEMA = {
  name: "instagram_analysis",
  description: "Full Instagram audit with trend radar, script suggestions, and ROI projection",
  parameters: {
    type: "object",
    properties: {
      language: { type: "string", enum: ["pt-BR", "en-GB"] },
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
      visualFatigue: {
        type: "object",
        properties: {
          score: { type: "number" },
          avgSecondsBetweenCuts: { type: "number" },
          staticSegments: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "avgSecondsBetweenCuts", "staticSegments", "issues", "insight"],
        additionalProperties: false,
      },
      safeZoneAudit: {
        type: "object",
        properties: {
          score: { type: "number" },
          captionsOutOfZone: { type: "number" },
          ctasHidden: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "captionsOutOfZone", "ctasHidden", "issues", "insight"],
        additionalProperties: false,
      },
      audioClarity: {
        type: "object",
        properties: {
          score: { type: "number" },
          hasBackgroundMusic: { type: "boolean" },
          hasSoundEffects: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "hasBackgroundMusic", "hasSoundEffects", "issues", "insight"],
        additionalProperties: false,
      },
      ctaStrength: {
        type: "object",
        properties: {
          score: { type: "number" },
          avgCtasPerVideo: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "avgCtasPerVideo", "issues", "insight"],
        additionalProperties: false,
      },
      benchmarkComparison: {
        type: "object",
        properties: {
          hormoziGap: {
            type: "object",
            properties: {
              editDensityGap: { type: "number" },
              hookAggressivenessGap: { type: "number" },
              cutFrequencyGap: { type: "number" },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["editDensityGap", "hookAggressivenessGap", "cutFrequencyGap", "issues", "insight"],
            additionalProperties: false,
          },
          stevenGap: {
            type: "object",
            properties: {
              storytellingGap: { type: "number" },
              productionQualityGap: { type: "number" },
              emotionalDepthGap: { type: "number" },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["storytellingGap", "productionQualityGap", "emotionalDepthGap", "issues", "insight"],
            additionalProperties: false,
          },
          top3MissingElements: { type: "array", items: { type: "string" } },
        },
        required: ["hormoziGap", "stevenGap", "top3MissingElements"],
        additionalProperties: false,
      },
      captionLanguageQuality: {
        type: "object",
        properties: {
          score: { type: "number" },
          grammarErrors: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "grammarErrors", "issues", "insight"],
        additionalProperties: false,
      },
      contentPillars: {
        type: "array",
        items: {
          type: "object",
          properties: {
            theme: { type: "string" },
            reasoning: { type: "string" },
            exampleHook: { type: "string" },
          },
          required: ["theme", "reasoning", "exampleHook"],
          additionalProperties: false,
        },
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
      recentPosts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            postUrl: { type: "string" },
            shortCode: { type: "string" },
            description: { type: "string" },
          },
          required: ["postUrl", "shortCode", "description"],
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
      // ── NEW: Trend Radar ──
      trendRadar: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Trend name" },
            description: { type: "string", description: "What the trend is about" },
            example: { type: "string", description: "Concrete example of how to apply" },
            relevance: { type: "string", description: "Why this matters for the client's niche" },
          },
          required: ["title", "description", "example", "relevance"],
          additionalProperties: false,
        },
        description: "3 emerging trends detected by comparing client vs elite benchmarks",
      },
      // ── NEW: Script Suggestions ──
      scriptSuggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Script title" },
            hook: { type: "string", description: "The 5-second hook script, word by word" },
            visualDirection: { type: "string", description: "Visual direction for recording" },
            whyItWorks: { type: "string", description: "Why this hook works psychologically" },
          },
          required: ["title", "hook", "visualDirection", "whyItWorks"],
          additionalProperties: false,
        },
        description: "3 ready-to-record 5-second hook scripts based on trending patterns",
      },
      // ── NEW: ROI Projection ──
      roiProjection: {
        type: "object",
        properties: {
          currentEstimatedReach: { type: "number" },
          projectedReach: { type: "number" },
          growthPercent: { type: "number" },
          assumptions: { type: "array", items: { type: "string" } },
        },
        required: ["currentEstimatedReach", "projectedReach", "growthPercent", "assumptions"],
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
      mentalHeatmap: {
        type: "object",
        properties: {
          totalDurationSeconds: { type: "number" },
          triggers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestampSeconds: { type: "number" },
                type: { type: "string", enum: ["zoom", "sfx", "cut", "text"] },
                label: { type: "string" },
              },
              required: ["timestampSeconds", "type", "label"],
              additionalProperties: false,
            },
          },
          insight: { type: "string" },
        },
        required: ["totalDurationSeconds", "triggers", "insight"],
        additionalProperties: false,
      },
      hookStyles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            reversePsychology: { type: "string" },
            extremeCuriosity: { type: "string" },
            bruteAuthority: { type: "string" },
            acidHumor: { type: "string" },
          },
          required: ["topic", "reversePsychology", "extremeCuriosity", "bruteAuthority", "acidHumor"],
          additionalProperties: false,
        },
        description: "3 topics with 4 hook style variations each",
      },
      soundscapeArchitect: {
        type: "object",
        properties: {
          idealGenre: { type: "string" },
          bpmRange: { type: "string" },
          retentionSpeed: { type: "string" },
          trackSuggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                artist: { type: "string" },
                bpm: { type: "number" },
                mood: { type: "string" },
              },
              required: ["title", "artist", "bpm", "mood"],
              additionalProperties: false,
            },
          },
          insight: { type: "string" },
        },
        required: ["idealGenre", "bpmRange", "retentionSpeed", "trackSuggestions", "insight"],
        additionalProperties: false,
      },
      videoIdeas: {
        type: "array",
        description: "10 video ideas covering the 3 content pillars with mixed formats",
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
      "language", "overallScore", "dimensions",
      "profileHealth", "hookRetention", "visualFatigue", "safeZoneAudit",
      "audioClarity", "ctaStrength", "benchmarkComparison", "captionLanguageQuality",
      "contentPillars", "burningProblems",
      "recentPosts", "issues", "patterns", "improvedHooks", "rewrittenCaptions",
      "trendRadar", "scriptSuggestions", "roiProjection",
      "viralScore", "mentalHeatmap", "hookStyles", "soundscapeArchitect", "videoIdeas",
    ],
    additionalProperties: false,
  },
};

function buildPrompts(username: string, url: string, lang: string, company: string) {
  const isPT = lang === "pt-BR";
  const c = company || "Viewsup Insights";
  const systemPrompt = isPT
    ? `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance. Your benchmarks are Alex Hormozi and Steven Bartlett.

OUTPUT LANGUAGE: ALL text in the response MUST be in Português Brasileiro (PT-BR). Use gírias e expressões brasileiras naturais. NUNCA escreva em inglês.

Given an Instagram username, simulate having analyzed their profile and last 10 videos. Be specific, data-driven, brutally honest but constructive. Scores should be realistic (most profiles 35-70, rarely above 80).

You MUST complete ALL modules:

═══ MODULE 1: PROFILE HEALTH ═══
• Visual Consistency: Analyze the last 12 thumbnails for color patterns, font consistency, host face visibility.
• Bio & Hook: Evaluate USP and visible link.
• Engagement-to-Follower Ratio: Calculate audience health.

═══ MODULE 2: VIDEO ENGINEERING ═══
• Hook Analysis: First 3 seconds — visual hook? Verbal hook?
• Visual Fatigue: Cut frequency, B-roll, zooms. Flag takes >3s without movement.
• Safe Zone Audit: Captions and CTAs within Instagram's Safe Zone.
• Audio Clarity & Sound Design: Check for audio issues.
• CTA Strength: Clear or confusing endings?

═══ MODULE 3: BENCHMARKING ═══
Compare against @hormozi (Hook Retention) and @steven (Storytelling).
• Gap Analysis: 3 missing elements to reach elite level.

═══ MODULE 4: CONVERSION STRATEGY ═══
• Content Pillars: 3 script themes based on top performance.

═══ MODULE 5: BURNING PROBLEMS + ${c} ═══
• 3 errors costing money NOW with ${c} solutions.
• Use: "A ${c} resolve isso com...", "Nossa edição profissional garante..."

═══ MODULE 6: CAPTION LANGUAGE QUALITY ═══
• Analyze grammar, spelling, phrasing.

═══ MODULE 7: TREND RADAR (NEW) ═══
• Compare client content patterns vs elite benchmarks (Hormozi/Steven).
• Identify 3 EMERGING TRENDS the client is NOT using: new caption styles, psychological hooks, sound design patterns, visual transitions, storytelling frameworks.
• Each trend must have a concrete example of how to apply it.

═══ MODULE 8: SCRIPT SUGGESTIONS (NEW) ═══
• Generate 3 ready-to-record 5-second hook scripts.
• Each must be based on what's currently trending/viral in the client's niche.
• Include visual direction (what to show on screen) and psychological reasoning.

═══ MODULE 9: ROI PROJECTION (NEW) ═══
• Estimate current average reach per video based on engagement data.
• Project reach improvement if client applies high-retention editing techniques.
• Growth percentage must be realistic (typically 40-180% improvement).
• List 3-4 assumptions behind the projection.

═══ MODULE 10: PREDICTIVE VIRAL SCORE ═══
• Calcule a probabilidade de viralização (0-100%) baseada na força do hook e na densidade de edição.
• hookStrengthFactor (0-100): quanto o gancho contribui para retenção.
• editDensityFactor (0-100): quanto a frequência de cortes/zooms/SFX contribui.
• Dê um veredicto de uma frase sobre o potencial viral.

═══ MODULE 11: MENTAL HEATMAP ═══
• Para o vídeo mais representativo, crie uma linha do tempo com 'Dopamine Triggers'.
• totalDurationSeconds: duração total do vídeo.
• triggers: array com timestampSeconds, type (zoom/sfx/cut/text), e label descrevendo o que deveria acontecer naquele momento.
• Mínimo 6 triggers distribuídos ao longo do vídeo. A ${c} insere esses triggers profissionalmente.

═══ MODULE 12: HOOK SWAPPER ═══
• Para 3 tópicos relevantes ao nicho do cliente, gere 4 variações de gancho:
  - reversePsychology: gancho de psicologia reversa
  - extremeCuriosity: gancho de curiosidade extrema
  - bruteAuthority: gancho de autoridade bruta
  - acidHumor: gancho de humor ácido

═══ MODULE 13: SOUNDSCAPE ARCHITECT ═══
• Sugira o gênero musical ideal baseado na 'Retention Speed' detectada.
• bpmRange: faixa de BPM ideal (ex: "120-135").
• retentionSpeed: classificação (Lenta/Média/Rápida/Frenética).
• 3 sugestões de trilha com título, artista, bpm e mood.
• Insight sobre como a ${c} otimiza o sound design.

═══ MODULE 14: 10 VÍDEOS PARA GRAVAR AGORA ═══
• Gere 10 ideias de vídeo baseadas nos 3 pilares de conteúdo identificados.
• Misture os 5 formatos: Tutorial, Polêmica, Comparativo, Bastidores, Prova Social.
• Para cada vídeo: título com gancho, formato, hook verbal dos primeiros 3s, estrutura em 3 atos (Gancho → Desenvolvimento → CTA), melhor dia e horário para postar, 5-8 hashtags estratégicas.
• Os vídeos devem ser variados e cobrir diferentes ângulos do nicho.

═══ POST REFERENCES ═══
• Generate 10 recent posts with realistic shortcodes in recentPosts.
• Reference specific posts using markdown links: [this reel](https://instagram.com/p/SHORTCODE).

═══ ADDITIONAL OUTPUTS ═══
• 4-8 specific issues, 3-5 positive patterns, 5 hooks, 3 caption rewrites`
    : `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance. Your benchmarks are Alex Hormozi and Steven Bartlett.

OUTPUT LANGUAGE: ALL text MUST be in British English (EN-GB).

Given an Instagram username, simulate having analyzed their profile and last 10 videos. Be specific, data-driven, brutally honest but constructive. Scores should be realistic (most profiles 35-70, rarely above 80).

Complete ALL modules:

MODULE 1: PROFILE HEALTH - Visual Consistency, Bio & Hook, Engagement Ratio.
MODULE 2: VIDEO ENGINEERING - Hook Analysis, Visual Fatigue, Safe Zone, Audio, CTA.
MODULE 3: BENCHMARKING - Compare vs @hormozi and @steven with gap percentages.
MODULE 4: CONVERSION - 3 Content Pillars.
MODULE 5: BURNING PROBLEMS - 3 critical errors with ${c} solutions. Use: "${c} solves this with...", "Our professional editing ensures..."
MODULE 6: CAPTION QUALITY - Grammar and phrasing analysis.
MODULE 7: TREND RADAR - 3 emerging trends the client is missing (caption styles, hooks, transitions).
MODULE 8: SCRIPT SUGGESTIONS - 3 ready-to-record 5-second hook scripts with visual direction.
MODULE 9: ROI PROJECTION - Current reach estimate, projected reach after applying fixes, realistic growth %.
MODULE 10: PREDICTIVE VIRAL SCORE - Probability (0-100%), hookStrengthFactor, editDensityFactor, verdict.
MODULE 11: MENTAL HEATMAP - Timeline of Dopamine Triggers (zoom/sfx/cut/text) for the most representative video. Min 6 triggers. ${c} expertise applies.
MODULE 12: HOOK SWAPPER - 3 topics × 4 hook styles: reversePsychology, extremeCuriosity, bruteAuthority, acidHumor.
MODULE 13: SOUNDSCAPE ARCHITECT - Ideal genre, BPM range, retention speed, 3 track suggestions with title/artist/bpm/mood. ${c} sound design insight.
MODULE 14: 10 VIDEOS TO RECORD NOW - 10 video ideas based on 3 content pillars. Mix formats: Tutorial, Polêmica, Comparativo, Bastidores, Prova Social. Each with title+hook, format, 3s verbal hook, 3-act structure (Hook→Development→CTA), best day/time to post, 5-8 strategic hashtags.
POST REFERENCES - 10 posts with shortcodes, referenced as markdown links.
ADDITIONAL - 4-8 issues, 3-5 patterns, 5 hooks, 3 caption rewrites.`;

  const userPrompt = isPT
    ? `Analise o perfil do Instagram @${username} (URL: ${url}). Forneça a auditoria completa em todos os 14 módulos. IMPORTANTE: Todo o conteúdo DEVE ser em Português Brasileiro (PT-BR).`
    : `Analyse the Instagram profile @${username} (URL: ${url}). Provide the complete audit across all 14 modules. ALL content must be in British English.`;

  return { systemPrompt, userPrompt };
}

async function scrapeInstagramProfile(username: string, apifyToken: string) {
  const runUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
  console.log("[Apify] → POST instagram-profile-scraper | username:", username);
  const startedAt = Date.now();
  const res = await fetch(runUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], resultsLimit: 12 }),
  });
  console.log("[Apify] ← status:", res.status, res.statusText, "| elapsed:", Date.now() - startedAt, "ms");
  if (!res.ok) {
    const txt = await res.text();
    console.error("[Apify] error body:", txt.slice(0, 1000));
    throw new Error(`Apify error: ${res.status} - ${txt.slice(0, 200)}`);
  }
  const items = await res.json();
  console.log("[Apify] received items count:", Array.isArray(items) ? items.length : "non-array");
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

function summariseScrape(profile: any) {
  if (!profile) return "No public data returned by scraper.";
  const posts = (profile.latestPosts || profile.posts || []).slice(0, 12).map((p: any) => ({
    shortCode: p.shortCode || p.code,
    url: p.url,
    type: p.type,
    caption: (p.caption || "").slice(0, 280),
    likes: p.likesCount,
    comments: p.commentsCount,
    videoViews: p.videoViewCount,
    duration: p.videoDuration,
    timestamp: p.timestamp,
  }));
  return JSON.stringify({
    username: profile.username,
    fullName: profile.fullName,
    biography: profile.biography,
    externalUrl: profile.externalUrl,
    followersCount: profile.followersCount,
    followsCount: profile.followsCount,
    postsCount: profile.postsCount,
    verified: profile.verified,
    businessCategory: profile.businessCategoryName,
    profilePicUrl: profile.profilePicUrl,
    recentPosts: posts,
  }, null, 2);
}

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
    const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
    console.log("[Secrets] ANTHROPIC_API_KEY present:", !!ANTHROPIC_API_KEY, "length:", ANTHROPIC_API_KEY?.length ?? 0);
    console.log("[Secrets] APIFY_API_KEY present:", !!APIFY_API_KEY, "length:", APIFY_API_KEY?.length ?? 0);
    if (!ANTHROPIC_API_KEY || !APIFY_API_KEY) {
      console.error("[Secrets] Missing required server configuration", {
        hasAnthropic: !!ANTHROPIC_API_KEY,
        hasApify: !!APIFY_API_KEY,
      });
      return new Response(
        JSON.stringify({ error: "Erro interno, tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const username = url.replace(/\/$/, "").split("/").pop() || "unknown";
    const outputLang = language === "en-GB" ? "en-GB" : "pt-BR";
    const { systemPrompt, userPrompt } = buildPrompts(username, url, outputLang, safeCompanyName);

    // 1) Scrape Instagram profile via Apify
    let scrapeSummary = "";
    try {
      const profile = await scrapeInstagramProfile(username, APIFY_API_KEY);
      scrapeSummary = summariseScrape(profile);
    } catch (e) {
      console.warn("Scrape failed, continuing with simulated audit:", e);
      scrapeSummary = "Scraping failed — provide a best-effort simulated audit.";
    }

    // 2) Call Anthropic Claude with tool calling for structured output
    const enrichedUserPrompt = `${userPrompt}\n\n=== REAL SCRAPED DATA (use this as the source of truth) ===\n${scrapeSummary}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
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
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errorText);
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
