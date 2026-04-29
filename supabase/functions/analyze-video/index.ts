// Worker for video pre-flight analysis (Retention Lab).
// Picks pending jobs from public.video_jobs, downloads metadata from storage,
// sends extracted frames (when provided by the client) or metadata-only context
// to Claude, then saves the result back. Designed to be invoked by pg_cron every
// minute or directly by the frontend (fire-and-forget).
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
        required: [
          "score",
          "textAppearsIn05s",
          "inSafeZone",
          "issues",
          "insight",
        ],
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
        required: [
          "score",
          "avgSecondsBetweenCuts",
          "hasSufficientVariety",
          "issues",
          "insight",
        ],
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
        required: [
          "score",
          "isClear",
          "hasCompetingNoise",
          "issues",
          "insight",
        ],
        additionalProperties: false,
      },
      verdict: {
        type: "string",
        enum: ["PRONTO_PARA_POSTAR", "PRECISA_DE_AJUSTES"],
      },
      verdictReason: { type: "string" },
      adjustments: { type: "array", items: { type: "string" } },
      transcription: { type: "string" },
      suggestedCaption: { type: "string" },
      captionHashtags: { type: "array", items: { type: "string" } },
    },
    required: [
      "hookVisual",
      "pacing",
      "audioQuality",
      "verdict",
      "verdictReason",
      "adjustments",
      "transcription",
      "suggestedCaption",
      "captionHashtags",
    ],
    additionalProperties: false,
  },
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

type FrameImage = {
  data: string;
  media_type?: "image/jpeg" | "image/png" | "image/webp";
  timestamp?: number;
};

type VideoContext = {
  durationSeconds?: number;
  contentDescription?: string;
  frameImages?: FrameImage[];
};

async function processJob(jobId: string, context: VideoContext = {}): Promise<void> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Atomic claim: only mark processing if still pending
  const { data: claimed, error: claimErr } = await admin
    .from("video_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "pending")
    .select()
    .single();

  if (claimErr || !claimed) {
    console.log(
      `[analyze-video] job ${jobId} not claimable`,
      claimErr?.message,
    );
    return;
  }

  console.log(
    `[analyze-video] processing job ${jobId} for user ${claimed.user_id}`,
  );

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    const { data: fileData, error: dlError } = await admin.storage
      .from("video-uploads")
      .download(claimed.storage_path);

    if (dlError || !fileData) {
      throw new Error(`Download failed: ${dlError?.message}`);
    }

    const sizeMB = fileData.size / (1024 * 1024);
    console.log(`[analyze-video] file size: ${sizeMB.toFixed(1)}MB`);

    const isPT = (claimed.language || "pt-BR") === "pt-BR";
    const c = claimed.company_name || "Viewsup Insights";
    const mimeType = claimed.mime_type || "video/mp4";
    const safeFrames = (context.frameImages || [])
      .filter((frame) => frame?.data && frame.data.length < 1_200_000)
      .slice(0, 6);
    console.log(
      `[analyze-video] context for ${jobId}: frames=${safeFrames.length}, duration=${context.durationSeconds ?? "unknown"}, description=${context.contentDescription ? "yes" : "no"}`,
    );

    const systemPrompt = isPT
      ? `Você é um Especialista Sênior em Retenção de Vídeo para Instagram da ${c}. Analise este vídeo como se fosse ser postado AGORA no Instagram Reels.

IDIOMA: TODO o texto DEVE ser em Português Brasileiro (PT-BR).

1. HOOK VISUAL (primeiros 0.5s) — texto/elemento chamativo, Safe Zone. Score 0-100.
2. PACING — cortes a cada 1.8-2s, energia visual. Score 0-100.
3. ÁUDIO — clareza, ruído, competição com voz. Score 0-100.
4. VEREDITO — Se TODOS os scores >= 65: "PRONTO_PARA_POSTAR". Senão "PRECISA_DE_AJUSTES".
5. TRANSCRIÇÃO + legenda otimizada + 5-10 hashtags.

A ${c} oferece edição profissional para otimizar todos esses aspectos.

IMPORTANTE: Claude não recebeu o vídeo bruto. Use os frames extraídos quando existirem e os metadados/descrição para inferir hook, ritmo, qualidade visual e áudio. Se não houver evidência suficiente para áudio ou transcrição, seja transparente e use "Não inferível pelos frames/metadados".`
      : `You are a Senior Video Retention Specialist for Instagram from ${c}. Analyze this video as if it's about to be posted NOW on Instagram Reels.

LANGUAGE: ALL text MUST be in English.

1. VISUAL HOOK (first 0.5s) — text/eye-catching visual, Safe Zone. Score 0-100.
2. PACING — cuts every 1.8-2s, visual energy. Score 0-100.
3. AUDIO — clarity, noise, music vs voice. Score 0-100.
4. VERDICT — If ALL scores >= 65: "PRONTO_PARA_POSTAR". Else "PRECISA_DE_AJUSTES".
5. TRANSCRIPTION + optimized caption + 5-10 hashtags.

${c} offers professional editing to optimize all these aspects.

IMPORTANT: Claude did not receive the raw video. Use extracted frames when available plus metadata/description to infer hook, pacing, visual quality and audio. If there is not enough evidence for audio or transcription, be transparent and use "Not inferable from frames/metadata".`;

    const metadataText = isPT
      ? `Metadados do vídeo:\n- Nome: ${claimed.file_name}\n- Tipo: ${mimeType}\n- Tamanho: ${sizeMB.toFixed(1)}MB\n- Duração: ${context.durationSeconds ? `${context.durationSeconds.toFixed(1)}s` : "não informada"}\n- Descrição fornecida pelo usuário: ${context.contentDescription?.trim() || "não informada"}\n- Frames extraídos enviados: ${safeFrames.length}\n\nAnalise o hook visual, ritmo, qualidade visual e áudio com base nos frames/metadados. Quando a análise depender de áudio não disponível, explicite a limitação e use a descrição do usuário como complemento.`
      : `Video metadata:\n- Name: ${claimed.file_name}\n- Type: ${mimeType}\n- Size: ${sizeMB.toFixed(1)}MB\n- Duration: ${context.durationSeconds ? `${context.durationSeconds.toFixed(1)}s` : "not provided"}\n- User-provided description: ${context.contentDescription?.trim() || "not provided"}\n- Extracted frames sent: ${safeFrames.length}\n\nAnalyse the visual hook, pacing, visual quality and audio from frames/metadata. When audio is not available, state the limitation and use the user's description as supporting context.`;

    const imageBlocks = safeFrames.map((frame) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: frame.media_type || "image/jpeg",
        data: frame.data.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, ""),
      },
    }));

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              ...imageBlocks,
              {
                type: "text",
                text: isPT
                  ? `${metadataText}\n\nRetorne a análise completa de pré-voo para Instagram Reels.`
                  : `${metadataText}\n\nReturn the full Instagram Reels pre-flight analysis.`,
              },
            ],
          },
        ],
        tools: [{
          name: VIDEO_ANALYSIS_SCHEMA.name,
          description: VIDEO_ANALYSIS_SCHEMA.description,
          input_schema: VIDEO_ANALYSIS_SCHEMA.parameters,
        }],
        tool_choice: { type: "tool", name: VIDEO_ANALYSIS_SCHEMA.name },
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(
        `Anthropic API ${aiResponse.status}: ${errText.slice(0, 500)}`,
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.content?.find((
      block: { type?: string; name?: string },
    ) =>
      block.type === "tool_use" && block.name === VIDEO_ANALYSIS_SCHEMA.name
    );
    if (!toolCall?.input) {
      throw new Error("AI did not return structured analysis");
    }

    const analysis = toolCall.input;

    await admin.from("video_jobs").update({
      status: "completed",
      result_data: analysis,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    console.log(`[analyze-video] job ${jobId} completed`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[analyze-video] job ${jobId} failed:`, msg);
    await admin.from("video_jobs").update({
      status: "failed",
      error_message: msg.slice(0, 500),
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

async function pickAndProcessPending(limit = 3): Promise<number> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: pending, error } = await admin
    .from("video_jobs")
    .select("id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[analyze-video] failed to fetch pending:", error.message);
    return 0;
  }
  if (!pending || pending.length === 0) return 0;

  // Process sequentially to keep memory low (videos can be big)
  for (const job of pending) {
    await processJob(job.id);
  }
  return pending.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Mode 1: explicit jobId (called right after enqueue from frontend)
    if (body?.jobId) {
      // Run in background so HTTP response is immediate
      // Deno's EdgeRuntime supports waitUntil for background tasks
      // deno-lint-ignore no-explicit-any
      const rt = (globalThis as any).EdgeRuntime;
      const work = processJob(body.jobId);
      if (rt?.waitUntil) rt.waitUntil(work);
      else work.catch(() => {});
      return new Response(
        JSON.stringify({ accepted: true, jobId: body.jobId }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Mode 2: cron worker — pick pending jobs
    const processed = await pickAndProcessPending(3);
    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze-video] fatal:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
