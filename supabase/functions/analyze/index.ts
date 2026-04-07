import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_SCHEMA = {
  name: "instagram_analysis",
  description:
    "A structured Instagram profile analysis with scores, issues, patterns, hooks, rewritten captions, and advanced video diagnostics",
  parameters: {
    type: "object",
    properties: {
      overallScore: {
        type: "number",
        description: "Overall content quality score from 0 to 100",
      },
      dimensions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            score: { type: "number" },
            label: {
              type: "string",
              enum: ["Very Weak", "Weak", "Below Average", "Average", "Good", "Strong", "Excellent"],
            },
            icon: {
              type: "string",
              enum: ["Zap", "Eye", "MessageCircle", "LayoutGrid", "Heart"],
            },
          },
          required: ["name", "score", "label", "icon"],
          additionalProperties: false,
        },
        description:
          "Exactly 5 dimensions: Hook Strength (icon: Zap), Visual Clarity (icon: Eye), Engagement Trigger (icon: MessageCircle), Content Structure (icon: LayoutGrid), Emotional Pull (icon: Heart)",
      },
      hookRetention: {
        type: "object",
        properties: {
          score: { type: "number", description: "Hook retention score 0-100" },
          audienceLostPercent: { type: "number", description: "Estimated % of audience lost in first 3 seconds" },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific hook retention problems found",
          },
          insight: { type: "string", description: "Actionable insight about Hard Hooks visuais" },
        },
        required: ["score", "audienceLostPercent", "issues", "insight"],
        additionalProperties: false,
      },
      visualFatigue: {
        type: "object",
        properties: {
          score: { type: "number", description: "Visual dynamism score 0-100" },
          avgSecondsBetweenCuts: { type: "number", description: "Average seconds between visual changes" },
          staticSegments: { type: "number", description: "Number of segments with 5+ seconds of no visual change" },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific visual fatigue problems",
          },
          insight: { type: "string", description: "Actionable insight about Dynamic Zooms and visual stimulation" },
        },
        required: ["score", "avgSecondsBetweenCuts", "staticSegments", "issues", "insight"],
        additionalProperties: false,
      },
      audioClarity: {
        type: "object",
        properties: {
          score: { type: "number", description: "Audio quality and sound design score 0-100" },
          hasBackgroundMusic: { type: "boolean" },
          hasSoundEffects: { type: "boolean" },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "3-5 audio quality problems detected",
          },
          insight: { type: "string", description: "Actionable insight about professional sound design" },
        },
        required: ["score", "hasBackgroundMusic", "hasSoundEffects", "issues", "insight"],
        additionalProperties: false,
      },
      ctaStrength: {
        type: "object",
        properties: {
          score: { type: "number", description: "CTA effectiveness score 0-100" },
          avgCtasPerVideo: { type: "number", description: "Average number of CTAs per video" },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "3-5 CTA problems detected",
          },
          insight: { type: "string", description: "Actionable insight about single Conversion Goal strategy" },
        },
        required: ["score", "avgCtasPerVideo", "issues", "insight"],
        additionalProperties: false,
      },
      benchmarkComparison: {
        type: "object",
        properties: {
          comparedTo: { type: "string", description: "Name of elite creator compared against (e.g. Steven Bartlett, Alex Hormozi)" },
          editDensityGap: { type: "number", description: "Percentage gap in editing density vs elite" },
          captionWordCountAvg: { type: "number", description: "Average words per caption for this profile" },
          eliteCaptionWordCountAvg: { type: "number", description: "Average words per caption for elite" },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific gaps compared to elite creators",
          },
          insight: { type: "string", description: "Motivational insight comparing to elite level" },
        },
        required: ["comparedTo", "editDensityGap", "captionWordCountAvg", "eliteCaptionWordCountAvg", "issues", "insight"],
        additionalProperties: false,
      },
      captionLanguageQuality: {
        type: "object",
        properties: {
          score: { type: "number", description: "English caption quality score 0-100" },
          grammarErrors: { type: "number", description: "Number of grammar/spelling errors found" },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific language quality issues",
          },
          insight: { type: "string", description: "Insight about caption language improvement" },
        },
        required: ["score", "grammarErrors", "issues", "insight"],
        additionalProperties: false,
      },
      recentPosts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            postUrl: { type: "string", description: "Full Instagram post URL, e.g. https://instagram.com/p/ABC123" },
            shortCode: { type: "string", description: "The post shortcode (e.g. ABC123)" },
            description: { type: "string", description: "Brief description of the post content" },
          },
          required: ["postUrl", "shortCode", "description"],
          additionalProperties: false,
        },
        description: "10 simulated recent posts with realistic Instagram shortcodes. Generate realistic-looking shortcodes (11 alphanumeric chars).",
      },
      issues: {
        type: "array",
        items: { type: "string" },
        description: "4-8 specific content issues detected. ALWAYS reference specific posts by their URL in markdown link format, e.g. [this post](https://instagram.com/p/ABC123). Use the shortcodes from recentPosts.",
      },
      patterns: {
        type: "array",
        items: { type: "string" },
        description: "3-5 positive content patterns detected. ALWAYS reference specific posts by their URL in markdown link format. Use the shortcodes from recentPosts.",
      },
      improvedHooks: {
        type: "array",
        items: { type: "string" },
        description: "Exactly 5 compelling, scroll-stopping opening hooks for future posts",
      },
      rewrittenCaptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string", description: "A realistic weak original caption" },
            rewritten: {
              type: "string",
              description:
                "A dramatically improved version with hooks, structure, CTAs, and emotional engagement. Use newlines for formatting.",
            },
          },
          required: ["original", "rewritten"],
          additionalProperties: false,
        },
        description: "Exactly 3 before/after caption rewrites",
      },
    },
    required: [
      "overallScore",
      "dimensions",
      "hookRetention",
      "visualFatigue",
      "audioClarity",
      "ctaStrength",
      "benchmarkComparison",
      "captionLanguageQuality",
      "recentPosts",
      "issues",
      "patterns",
      "improvedHooks",
      "rewrittenCaptions",
    ],
    additionalProperties: false,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

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

    const systemPrompt = `You are an expert Instagram/Reels content strategist, video editor, and growth consultant. You analyze Instagram profiles and provide detailed, actionable feedback.

Given an Instagram username, simulate having analyzed their last 10 videos/reels and provide a comprehensive diagnostic report. Be specific, data-driven, and brutally honest. Use real-world social media best practices.

The analysis should feel personalized to the username provided — reference the type of content they might create based on their username/niche. Make scores realistic (most profiles score 40-75, rarely above 85).

You MUST analyze these 6 advanced dimensions in detail:

1. **Hook Retention (Gancho)** — Analyze the first 3 seconds of videos. Look for: silence at the start, delayed topic introduction, small/missing opening text. Estimate audience lost percentage. Recommend Hard Hooks visuais.

2. **Visual Fatigue (Fadiga Visual)** — Analyze time between cuts and angle changes. Look for segments with 5+ seconds of no visual change (cut, zoom, sticker). Reference the 4-second brain rest threshold. Recommend Dynamic Zooms.

3. **Audio Clarity & Sound Design Index** — Analyze audio quality and presence of background music/SFX. Look for: muffled audio, missing background music, music competing with voice. Reference the 30% conversion drop stat.

4. **CTA Strength (Chamada para Ação)** — Analyze how videos end. Look for: abrupt endings, multiple conflicting CTAs ("like, comment, share, click the link"). Recommend single Conversion Goal per video.

5. **Benchmark Comparison** — Compare the profile against elite creators (Steven Bartlett, Alex Hormozi, etc). Analyze editing density gap, words per caption, B-roll usage. Show the technical difference.

6. **Caption Language Quality** — Analyze the English quality of captions. Look for grammar errors, spelling mistakes, awkward phrasing. Provide specific corrections.

Issues should be specific with numbers. Patterns should include engagement multipliers. Hooks should be scroll-stopping. Caption rewrites should be dramatically better than originals.`;

    const userPrompt = `Analyze the Instagram profile @${username} (URL: ${url}). Provide a complete content diagnostic with all scores, advanced video analysis (hook retention, visual fatigue, audio clarity, CTA strength, benchmark comparison, caption language quality), issues, patterns, improved hooks, and rewritten captions. Make it feel like a real analysis based on their niche.`;

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
          tools: [
            {
              type: "function",
              function: ANALYSIS_SCHEMA,
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "instagram_analysis" },
          },
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
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
      JSON.stringify({
        url,
        username,
        ...analysis,
      }),
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
