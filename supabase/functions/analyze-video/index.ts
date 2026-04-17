import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
          score: { type: "number", description: "0-100 score for hook visual" },
          textAppearsIn05s: { type: "boolean", description: "Does text appear in first 0.5s?" },
          inSafeZone: { type: "boolean", description: "Is content within Instagram safe zone?" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "textAppearsIn05s", "inSafeZone", "issues", "insight"],
        additionalProperties: false,
      },
      pacing: {
        type: "object",
        properties: {
          score: { type: "number", description: "0-100 pacing score" },
          avgSecondsBetweenCuts: { type: "number" },
          hasSufficientVariety: { type: "boolean", description: "Cuts/visual changes every 1.8-2s?" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "avgSecondsBetweenCuts", "hasSufficientVariety", "issues", "insight"],
        additionalProperties: false,
      },
      audioQuality: {
        type: "object",
        properties: {
          score: { type: "number", description: "0-100 audio quality score" },
          isClear: { type: "boolean" },
          hasCompetingNoise: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "isClear", "hasCompetingNoise", "issues", "insight"],
        additionalProperties: false,
      },
      verdict: {
        type: "string",
        enum: ["PRONTO_PARA_POSTAR", "PRECISA_DE_AJUSTES"],
        description: "Final verdict: ready to post or needs edits",
      },
      verdictReason: { type: "string", description: "Brief explanation of the verdict" },
      adjustments: {
        type: "array",
        items: { type: "string" },
        description: "Specific adjustments needed (empty if ready to post)",
      },
      transcription: { type: "string", description: "Full transcription of spoken content" },
      suggestedCaption: { type: "string", description: "Optimized Instagram caption based on transcription and niche" },
      captionHashtags: {
        type: "array",
        items: { type: "string" },
        description: "5-10 relevant hashtags",
      },
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

  try {
    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const language = (formData.get("language") as string) || "pt-BR";
    const companyName = (formData.get("companyName") as string) || "Viewsup Insights";
    const niche = (formData.get("niche") as string) || "";

    if (!videoFile) {
      return new Response(JSON.stringify({ error: "No video file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (videoFile.size > maxSize) {
      return new Response(JSON.stringify({ error: "Video must be under 20MB" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoBytes = await videoFile.arrayBuffer();
    const base64Video = btoa(
      new Uint8Array(videoBytes).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const mimeType = videoFile.type || "video/mp4";
    const isPT = language === "pt-BR";
    const c = companyName;

    const systemPrompt = isPT
      ? `Você é um Especialista Sênior em Retenção de Vídeo para Instagram da ${c}. Analise este vídeo como se fosse ser postado AGORA no Instagram Reels.

IDIOMA: TODO o texto DEVE ser em Português Brasileiro (PT-BR).

Analise com precisão:

1. HOOK VISUAL (primeiros 0.5s):
   - Há texto ou elemento visual chamativo nos primeiros 0.5s?
   - O conteúdo está dentro da Safe Zone do Instagram (não cortado pelas bordas)?
   - Score de 0-100.

2. PACING (Ritmo):
   - Há cortes ou mudanças visuais a cada 1.8-2 segundos?
   - O vídeo mantém energia visual constante?
   - Score de 0-100.

3. QUALIDADE DO ÁUDIO:
   - O áudio está claro e sem ruídos?
   - A música de fundo (se houver) compete com a voz?
   - Score de 0-100.

4. VEREDITO:
   - Se TODOS os scores >= 65: "PRONTO_PARA_POSTAR"
   - Caso contrário: "PRECISA_DE_AJUSTES"
   - Liste exatamente o que mudar.

5. TRANSCRIÇÃO:
   - Transcreva TUDO que foi dito no vídeo.
   - Sugira uma legenda otimizada para Instagram com base no nicho${niche ? ` (${niche})` : ""}.
   - Sugira 5-10 hashtags relevantes.

A ${c} oferece edição profissional para otimizar todos esses aspectos.`
      : `You are a Senior Video Retention Specialist for Instagram from ${c}. Analyze this video as if it's about to be posted NOW on Instagram Reels.

LANGUAGE: ALL text MUST be in English.

Analyze precisely:

1. VISUAL HOOK (first 0.5s):
   - Is there text or an eye-catching visual in the first 0.5s?
   - Is content within Instagram's Safe Zone?
   - Score 0-100.

2. PACING:
   - Are there cuts or visual changes every 1.8-2 seconds?
   - Does the video maintain consistent visual energy?
   - Score 0-100.

3. AUDIO QUALITY:
   - Is audio clear and noise-free?
   - Does background music compete with voice?
   - Score 0-100.

4. VERDICT:
   - If ALL scores >= 65: "PRONTO_PARA_POSTAR"
   - Otherwise: "PRECISA_DE_AJUSTES"
   - List exactly what to change.

5. TRANSCRIPTION:
   - Transcribe ALL spoken content.
   - Suggest an optimized Instagram caption for the niche${niche ? ` (${niche})` : ""}.
   - Suggest 5-10 relevant hashtags.

${c} offers professional editing to optimize all these aspects.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Video}`,
                },
              },
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", errText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      throw new Error("AI did not return structured analysis");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-video error:", err);
    return new Response(JSON.stringify({ error: err.message || "Video analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
