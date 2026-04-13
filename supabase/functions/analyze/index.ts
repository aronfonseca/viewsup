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
  const c = company || "ViralLens Insights";
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, language, companyName } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "A valid Instagram profile URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const username = url.replace(/\/$/, "").split("/").pop() || "unknown";
    const outputLang = language === "en-GB" ? "en-GB" : "pt-BR";
    const { systemPrompt, userPrompt } = buildPrompts(username, url, outputLang, companyName || "ViralLens Insights");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{ type: "function", function: ANALYSIS_SCHEMA }],
          tool_choice: { type: "function", function: { name: "instagram_analysis" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured analysis");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ url, username, ...analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
