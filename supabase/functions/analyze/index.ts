import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_SCHEMA = {
  name: "instagram_analysis",
  description:
    "A structured Instagram profile analysis with scores, issues, patterns, hooks and rewritten captions",
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
      issues: {
        type: "array",
        items: { type: "string" },
        description: "4-8 specific content issues detected, with concrete details and numbers",
      },
      patterns: {
        type: "array",
        items: { type: "string" },
        description: "3-5 positive content patterns detected, with data-backed observations",
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

    const systemPrompt = `You are an expert Instagram content strategist and growth consultant. You analyze Instagram profiles and provide detailed, actionable feedback.

Given an Instagram username, simulate having analyzed their last 9 posts and provide a comprehensive diagnostic report. Be specific, data-driven, and brutally honest. Use real-world social media best practices.

The analysis should feel personalized to the username provided — reference the type of content they might create based on their username/niche. Make scores realistic (most profiles score 40-75, rarely above 85). Issues should be specific with numbers. Patterns should include engagement multipliers. Hooks should be scroll-stopping. Caption rewrites should be dramatically better than originals.`;

    const userPrompt = `Analyze the Instagram profile @${username} (URL: ${url}). Provide a complete content diagnostic with scores, issues, patterns, improved hooks, and rewritten captions. Make it feel like a real analysis based on their niche.`;

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
