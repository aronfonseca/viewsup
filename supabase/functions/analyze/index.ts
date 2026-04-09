import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_SCHEMA = {
  name: "instagram_analysis",
  description:
    "Full Instagram audit: profile health, video engineering, benchmarking, conversion strategy, burning problems, and Fonseca Films solution",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["pt-BR", "en-GB"],
        description: "Language used for all output text",
      },
      overallScore: {
        type: "number",
        description: "Overall performance score 0–100",
      },
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
        description: "5 dimensions: Hook Strength, Visual Clarity, Engagement Trigger, Content Structure, Emotional Pull",
      },
      // ── Module 2: Profile Health ──
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
              hasUSP: { type: "boolean", description: "Does the bio have a clear Unique Selling Proposition?" },
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
              ratio: { type: "number", description: "Engagement-to-follower ratio as percentage" },
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
      // ── Module 3: Video Engineering ──
      hookRetention: {
        type: "object",
        properties: {
          score: { type: "number" },
          audienceLostPercent: { type: "number" },
          hasVisualHook: { type: "boolean", description: "Dynamic text hook in first frame?" },
          hasVerbalHook: { type: "boolean", description: "Strong verbal hook in first 3s?" },
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
          captionsOutOfZone: { type: "number", description: "Number of videos with captions outside safe zone" },
          ctasHidden: { type: "number", description: "Number of videos with CTAs hidden by UI elements" },
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
      // ── Module 4: Benchmarking ──
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
          top3MissingElements: {
            type: "array",
            items: { type: "string" },
            description: "3 key elements missing to reach elite level",
          },
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
      // ── Module 5: Conversion Strategy ──
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
        description: "3 content pillar suggestions based on what performed best",
      },
      // ── Module 6: Burning Problems + Fonseca Films Solution ──
      burningProblems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            problem: { type: "string", description: "The error costing money NOW" },
            impact: { type: "string", description: "Business impact of this problem" },
            solution: { type: "string", description: "How Fonseca Films (strategy + editing) solves this" },
          },
          required: ["problem", "impact", "solution"],
          additionalProperties: false,
        },
        description: "Exactly 3 burning problems with Fonseca Films solutions",
      },
      // ── Posts & Insights ──
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
        description: "10 simulated recent posts with realistic shortcodes",
      },
      issues: { type: "array", items: { type: "string" } },
      patterns: { type: "array", items: { type: "string" } },
      improvedHooks: { type: "array", items: { type: "string" }, description: "5 scroll-stopping hooks" },
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
        description: "3 before/after caption rewrites",
      },
    },
    required: [
      "language", "overallScore", "dimensions",
      "profileHealth", "hookRetention", "visualFatigue", "safeZoneAudit",
      "audioClarity", "ctaStrength", "benchmarkComparison", "captionLanguageQuality",
      "contentPillars", "burningProblems",
      "recentPosts", "issues", "patterns", "improvedHooks", "rewrittenCaptions",
    ],
    additionalProperties: false,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, browserLanguage } = await req.json();

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

    // Force PT-BR always
    const outputLang = "pt-BR";

    const systemPrompt = `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance. Your benchmarks are Alex Hormozi and Steven Bartlett.

OUTPUT LANGUAGE: ALL text in the response MUST be in Português Brasileiro (PT-BR). Use gírias e expressões brasileiras naturais. NUNCA escreva em inglês. Todos os insights, issues, patterns, hooks, legendas, problemas e soluções DEVEM estar em português.

Given an Instagram username, simulate having analyzed their profile and last 10 videos. Be specific, data-driven, brutally honest but constructive. Scores should be realistic (most profiles 35-70, rarely above 80).

You MUST complete ALL of these modules:

═══ MODULE 1: PROFILE HEALTH ═══
• Visual Consistency: Analyze the last 12 thumbnails. Check for color patterns, font consistency, whether the host's face is clearly visible to build authority.
• Bio & Hook: Evaluate if the bio has a clear USP (Unique Selling Proposition) and visible link.
• Engagement-to-Follower Ratio: Calculate audience health by comparing followers vs avg likes/comments on last 10 posts.

═══ MODULE 2: VIDEO ENGINEERING ═══
• Hook Analysis: First 3 seconds — is there a visual hook (dynamic text)? A strong verbal hook? Does the client start in silence?
• Visual Fatigue: Count estimated cut frequency and graphic elements (B-roll, zooms, stickers). Flag any take lasting 3+ seconds without visual movement as "Low Retention".
• Safe Zone Audit: Check if captions and CTAs are within Instagram's Safe Zone (not hidden by username overlay or side buttons).
• Audio Clarity & Sound Design: Check for muffled audio, missing background music, or music competing with voice.
• CTA Strength: Check video endings — abrupt? Multiple conflicting CTAs?

═══ MODULE 3: BENCHMARKING ═══
Compare against TWO elite creators with specific gap percentages:
• @hormozi (Alex Hormozi) — https://www.instagram.com/hormozi/reels/ — GOLD STANDARD for Hook Retention. Aggressive hard hooks, bold text in first frame, pattern interrupts every 2-3s, rapid cuts. Compare hook aggressiveness, cut frequency, edit density.
• @steven (Steven Bartlett) — https://www.instagram.com/steven/ — GOLD STANDARD for Storytelling. Cinematic B-roll, emotional arcs, vulnerability hooks, premium sound. Compare storytelling depth, production quality, emotional engagement.
• Gap Analysis: List the 3 elements missing to reach elite level (e.g., missing dynamic captions, noisy audio, no polemic hooks).

═══ MODULE 4: CONVERSION STRATEGY ═══
• Content Pillars: Suggest 3 script themes based on what performed best on the profile.
• CTA Strength is already covered above.

═══ MODULE 5: BURNING PROBLEMS + FONSECA FILMS SOLUTION ═══
• Identify the 3 errors costing the client money RIGHT NOW.
• For each, explain the business impact and how Fonseca Films (professional strategy + editing) would fix it.
• Use language like: "A Fonseca Films resolve isso com...", "Nossa edição profissional garante..."

═══ MODULE 6: CAPTION LANGUAGE QUALITY ═══
• Analyze grammar, spelling, and phrasing quality of captions.

═══ POST REFERENCES (CRITICAL) ═══
• Generate 10 recent posts with realistic Instagram shortcodes (11 alphanumeric chars) in recentPosts.
• In ALL issues, insights, and analysis text, reference specific posts using markdown links: [this reel](https://instagram.com/p/SHORTCODE).
• Every issue must cite at least one specific post.

═══ ADDITIONAL OUTPUTS ═══
• 4-8 specific detected issues (with post links)
• 3-5 positive patterns (with post links)
• 5 scroll-stopping hooks for future content
• 3 before/after caption rewrites`;

    const userPrompt = `Analise o perfil do Instagram @${username} (URL: ${url}). Forneça a auditoria completa em todos os 6 módulos. IMPORTANTE: Todo o conteúdo DEVE ser em Português Brasileiro (PT-BR).`;

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
