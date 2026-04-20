import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VIDEO_ANALYSIS_SCHEMA = {
  name: "video_preflight_analysis",
  description: "Pre-flight video analysis for Instagram retention optimization",
  parameters: {
    type: "object",
    properties: {
      hookVisual: {
        type: "object",
        properties: {
          score: { type: "number" },
          textAppearsIn05s: { type: "boolean" },
          inSafeZone: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "textAppearsIn05s", "inSafeZone", "issues", "insight"],
        additionalProperties: false,
      },
      pacing: {
        type: "object",
        properties: {
          score: { type: "number" },
          avgSecondsBetweenCuts: { type: "number" },
          hasSufficientVariety: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "avgSecondsBetweenCuts", "hasSufficientVariety", "issues", "insight"],
        additionalProperties: false,
      },
      audioQuality: {
        type: "object",
        properties: {
          score: { type: "number" },
          isClear: { type: "boolean" },
          hasCompetingNoise: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "isClear", "hasCompetingNoise", "issues", "insight"],
        additionalProperties: false,
      },
      verdict: { type: "string", enum: ["PRONTO_PARA_POSTAR", "PRECISA_DE_AJUSTES"] },
      verdictReason: { type: "string" },
      adjustments: { type: "array", items: { type: "string" } },
      transcription: { type: "string" },
      suggestedCaption: { type: "string" },
      captionHashtags: { type: "array", items: { type: "string" } },
    },
    required: [
      "hookVisual", "pacing", "audioQuality",
      "verdict", "verdictReason", "adjustments",
      "transcription", "suggestedCaption", "captionHashtags",
    ],
    additionalProperties: false,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  try {
    console.log("[analyze-video] request received");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[analyze-video] missing auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authedSupabase.auth.getUser();
    if (authError || !authData?.user) {
      console.warn("[analyze-video] auth failed", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;
    console.log("[analyze-video] authenticated user", userId);

    const body = await req.json().catch(() => null);
    if (!body?.storagePath) {
      return new Response(JSON.stringify({ error: "Missing storagePath" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storagePath: string = body.storagePath;
    const language: string = body.language || "pt-BR";
    const companyName: string = body.companyName || "Viewsup Insights";
    const niche: string = body.niche || "";
    const mimeType: string = body.mimeType || "video/mp4";

    // Security: ensure path belongs to the user (we enforce uploads under "<userId>/...")
    if (!storagePath.startsWith(`${userId}/`)) {
      console.warn("[analyze-video] path does not belong to user", { userId, storagePath });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("[analyze-video] downloading from storage:", storagePath);
    const { data: fileData, error: dlError } = await adminSupabase.storage
      .from("video-uploads")
      .download(storagePath);

    if (dlError || !fileData) {
      console.error("[analyze-video] download failed:", dlError?.message);
      return new Response(JSON.stringify({ error: "Could not read uploaded video" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sizeMB = fileData.size / (1024 * 1024);
    console.log(`[analyze-video] file size: ${sizeMB.toFixed(1)}MB`);

    if (fileData.size > 300 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Video must be under 300MB" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert in chunks to avoid memory spikes from .reduce on huge arrays
    const buf = new Uint8Array(await fileData.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const base64Video = btoa(binary);
    console.log(`[analyze-video] base64 ready, len=${base64Video.length}`);

    const isPT = language === "pt-BR";
    const c = companyName;

    const systemPrompt = isPT
      ? `Você é um Especialista Sênior em Retenção de Vídeo para Instagram da ${c}. Analise este vídeo como se fosse ser postado AGORA no Instagram Reels.

IDIOMA: TODO o texto DEVE ser em Português Brasileiro (PT-BR).

1. HOOK VISUAL (primeiros 0.5s) — texto/elemento chamativo, Safe Zone. Score 0-100.
2. PACING — cortes a cada 1.8-2s, energia visual. Score 0-100.
3. ÁUDIO — clareza, ruído, competição com voz. Score 0-100.
4. VEREDITO — Se TODOS os scores >= 65: "PRONTO_PARA_POSTAR". Senão "PRECISA_DE_AJUSTES".
5. TRANSCRIÇÃO + legenda otimizada para o nicho${niche ? ` (${niche})` : ""} + 5-10 hashtags.

A ${c} oferece edição profissional para otimizar todos esses aspectos.`
      : `You are a Senior Video Retention Specialist for Instagram from ${c}. Analyze this video as if it's about to be posted NOW on Instagram Reels.

LANGUAGE: ALL text MUST be in English.

1. VISUAL HOOK (first 0.5s) — text/eye-catching visual, Safe Zone. Score 0-100.
2. PACING — cuts every 1.8-2s, visual energy. Score 0-100.
3. AUDIO — clarity, noise, music vs voice. Score 0-100.
4. VERDICT — If ALL scores >= 65: "PRONTO_PARA_POSTAR". Else "PRECISA_DE_AJUSTES".
5. TRANSCRIPTION + optimized caption for niche${niche ? ` (${niche})` : ""} + 5-10 hashtags.

${c} offers professional editing to optimize all these aspects.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-video] missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "Erro interno, tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[analyze-video] calling AI gateway...");
    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Video}` } },
              {
                type: "text",
                text: isPT
                  ? "Analise este vídeo para pré-voo de Instagram Reels. Retorne a análise completa."
                  : "Analyze this video for Instagram Reels pre-flight. Return the full analysis.",
              },
            ],
          },
        ],
        tools: [{ type: "function", function: VIDEO_ANALYSIS_SCHEMA }],
        tool_choice: { type: "function", function: { name: "video_preflight_analysis" } },
        temperature: 0.4,
      }),
    });

    console.log("[analyze-video] AI gateway responded", aiResponse.status);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[analyze-video] AI Gateway error:", errText.slice(0, 500));
      return new Response(JSON.stringify({ error: `AI analysis failed (${aiResponse.status})` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("[analyze-video] No tool call in response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return structured analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log(`[analyze-video] success in ${Date.now() - t0}ms`);

    // Best-effort cleanup of the uploaded file
    adminSupabase.storage.from("video-uploads").remove([storagePath])
      .then(({ error }) => {
        if (error) console.warn("[analyze-video] cleanup failed:", error.message);
      });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[analyze-video] fatal error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Erro interno, tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
