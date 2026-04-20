import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, CheckCircle2, AlertTriangle, Video, Volume2, Scissors,
  Eye, FileText, Sparkles, Loader2, Copy, Hash, Clock, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoAnalysis {
  hookVisual: { score: number; textAppearsIn05s: boolean; inSafeZone: boolean; issues: string[]; insight: string };
  pacing: { score: number; avgSecondsBetweenCuts: number; hasSufficientVariety: boolean; issues: string[]; insight: string };
  audioQuality: { score: number; isClear: boolean; hasCompetingNoise: boolean; issues: string[]; insight: string };
  verdict: "PRONTO_PARA_POSTAR" | "PRECISA_DE_AJUSTES";
  verdictReason: string;
  adjustments: string[];
  transcription: string;
  suggestedCaption: string;
  captionHashtags: string[];
}

interface VideoJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  file_name: string;
  file_size: number | null;
  result_data: VideoAnalysis | null;
  error_message: string | null;
  created_at: string;
}

const ScoreCircle = ({ score, label }: { score: number; label: string }) => {
  const color = score >= 70 ? "hsl(var(--success))" : score >= 45 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 264} 264`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{score}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1 text-center">{label}</span>
    </div>
  );
};

const RetentionLab = () => {
  const { t, lang, companyName } = useI18n();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<VideoJob | null>(null);
  const [history, setHistory] = useState<VideoJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Load existing jobs (history + resume any in-progress one)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data } = await supabase
        .from("video_jobs")
        .select("id, status, file_name, file_size, result_data, error_message, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!mounted || !data) return;
      const jobs = data as unknown as VideoJob[];
      setHistory(jobs);
      const inProgress = jobs.find((j) => j.status === "pending" || j.status === "processing");
      if (inProgress) setActiveJob(inProgress);
      setHistoryLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Poll active job every 5s + realtime fallback
  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("video_jobs")
        .select("id, status, file_name, file_size, result_data, error_message, created_at")
        .eq("id", activeJob.id)
        .single();
      if (data) {
        const job = data as unknown as VideoJob;
        setActiveJob(job);
        setHistory((prev) => prev.map((h) => (h.id === job.id ? job : h)));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeJob]);

  const handleFile = useCallback(async (file: File) => {
    const validTypes = ["video/mp4", "video/quicktime", "video/mov"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov)$/i)) {
      toast({ title: t("retLabError"), description: t("retLabInvalidFormat"), variant: "destructive" });
      return;
    }
    if (file.size > 300 * 1024 * 1024) {
      toast({ title: t("retLabError"), description: t("retLabTooLarge"), variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const storagePath = `${userData.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("video-uploads")
        .upload(storagePath, file, {
          contentType: file.type || "video/mp4",
          upsert: false,
        });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      const { data: jobData, error: jobErr } = await supabase
        .from("video_jobs")
        .insert({
          user_id: userData.user.id,
          storage_path: storagePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || "video/mp4",
          language: lang,
          company_name: companyName,
          status: "pending",
        })
        .select("id, status, file_name, file_size, result_data, error_message, created_at")
        .single();

      if (jobErr || !jobData) throw new Error(jobErr?.message || "Failed to create job");

      const job = jobData as unknown as VideoJob;
      setActiveJob(job);
      setHistory((prev) => [job, ...prev]);

      // Fire-and-forget kick to start processing immediately (cron is fallback)
      supabase.functions.invoke("analyze-video", { body: { jobId: job.id } }).catch(() => {});

      toast({ title: t("retLabUploadedTitle"), description: t("retLabUploadedDesc") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: t("retLabError"), description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [toast, t, lang, companyName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const startNewAnalysis = () => {
    setActiveJob(null);
  };

  const copyCaption = (analysis: VideoAnalysis) => {
    const text = `${analysis.suggestedCaption}\n\n${analysis.captionHashtags.map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "✅", description: t("retLabCopied") });
  };

  const renderAnalysis = (analysis: VideoAnalysis) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Verdict Banner */}
      <div className={`p-6 rounded-xl border-2 ${
        analysis.verdict === "PRONTO_PARA_POSTAR"
          ? "bg-success/10 border-success/30"
          : "bg-destructive/10 border-destructive/30"
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {analysis.verdict === "PRONTO_PARA_POSTAR" ? (
            <CheckCircle2 className="h-8 w-8 text-success" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-destructive" />
          )}
          <h2 className={`text-xl font-bold ${
            analysis.verdict === "PRONTO_PARA_POSTAR" ? "text-success" : "text-destructive"
          }`}>
            {analysis.verdict === "PRONTO_PARA_POSTAR" ? t("retLabReadyToPost") : t("retLabNeedsEdits")}
          </h2>
        </div>
        <p className="text-sm text-foreground">{analysis.verdictReason}</p>
        {analysis.adjustments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {analysis.adjustments.map((adj, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                {adj}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Scores */}
      <div className="p-6 rounded-xl bg-card border border-border card-shadow">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          {t("retLabPreFlightScores")}
        </h3>
        <div className="flex justify-around mb-8">
          <ScoreCircle score={analysis.hookVisual.score} label={t("retLabHookVisual")} />
          <ScoreCircle score={analysis.pacing.score} label={t("retLabPacing")} />
          <ScoreCircle score={analysis.audioQuality.score} label={t("retLabAudioQuality")} />
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">{t("retLabHookVisual")}</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded bg-secondary">
                {t("retLabTextIn05s")}: {analysis.hookVisual.textAppearsIn05s ? "✅" : "❌"}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-secondary">
                Safe Zone: {analysis.hookVisual.inSafeZone ? "✅" : "❌"}
              </span>
            </div>
            {analysis.hookVisual.issues.length > 0 && (
              <ul className="space-y-1 mb-2">
                {analysis.hookVisual.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-destructive">•</span> {issue}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-foreground italic p-2 rounded bg-primary/10">{analysis.hookVisual.insight}</p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Scissors className="h-4 w-4 text-warning" />
              <h4 className="text-sm font-semibold text-foreground">{t("retLabPacing")}</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded bg-secondary">
                {t("retLabAvgCuts")}: {analysis.pacing.avgSecondsBetweenCuts}s
              </span>
              <span className="text-xs px-2 py-1 rounded bg-secondary">
                {t("retLabVariety")}: {analysis.pacing.hasSufficientVariety ? "✅" : "❌"}
              </span>
            </div>
            {analysis.pacing.issues.length > 0 && (
              <ul className="space-y-1 mb-2">
                {analysis.pacing.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-destructive">•</span> {issue}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-foreground italic p-2 rounded bg-primary/10">{analysis.pacing.insight}</p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-success" />
              <h4 className="text-sm font-semibold text-foreground">{t("retLabAudioQuality")}</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded bg-secondary">
                {t("retLabClearAudio")}: {analysis.audioQuality.isClear ? "✅" : "❌"}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-secondary">
                {t("retLabCompetingNoise")}: {analysis.audioQuality.hasCompetingNoise ? "⚠️" : "✅"}
              </span>
            </div>
            {analysis.audioQuality.issues.length > 0 && (
              <ul className="space-y-1 mb-2">
                {analysis.audioQuality.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-destructive">•</span> {issue}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-foreground italic p-2 rounded bg-primary/10">{analysis.audioQuality.insight}</p>
          </div>
        </div>
      </div>

      {/* Transcription & Caption */}
      <div className="p-6 rounded-xl bg-card border border-border card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("retLabTranscription")}
          </h3>
        </div>
        <div className="p-4 rounded-lg bg-secondary/50 border border-border mb-6">
          <p className="text-sm text-foreground whitespace-pre-wrap">{analysis.transcription}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">{t("retLabSuggestedCaption")}</h4>
          <Button variant="ghost" size="sm" onClick={() => copyCaption(analysis)} className="text-xs">
            <Copy className="h-3 w-3 mr-1" /> {t("retLabCopy")}
          </Button>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
          <p className="text-sm text-foreground">{analysis.suggestedCaption}</p>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Hashtags</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.captionHashtags.map((tag, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground font-medium">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={startNewAnalysis}>
          <RotateCcw className="h-4 w-4 mr-2" /> {t("retLabNewVideo")}
        </Button>
      </div>
    </div>
  );

  const renderProcessingState = (job: VideoJob) => (
    <div className="p-12 rounded-xl bg-card border border-border card-shadow text-center space-y-4 animate-in fade-in">
      <div className="relative h-20 w-20 mx-auto">
        <div className="absolute inset-0 rounded-full gradient-bg animate-pulse opacity-30" />
        <Loader2 className="absolute inset-0 h-20 w-20 text-primary animate-spin" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {job.status === "pending" ? t("retLabQueued") : t("retLabProcessing")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("retLabProcessingDesc")}</p>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Video className="h-3 w-3" />
        <span>{job.file_name}</span>
        {job.file_size && <span>· {(job.file_size / 1024 / 1024).toFixed(1)} MB</span>}
      </div>
      <p className="text-xs text-muted-foreground italic">{t("retLabBackgroundHint")}</p>
    </div>
  );

  const renderFailedState = (job: VideoJob) => (
    <div className="p-8 rounded-xl border-2 border-destructive/30 bg-destructive/10 text-center space-y-4">
      <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
      <div>
        <h3 className="text-lg font-bold text-destructive mb-1">{t("retLabFailedTitle")}</h3>
        <p className="text-sm text-foreground">{job.error_message || t("retLabFailedDesc")}</p>
      </div>
      <Button variant="outline" onClick={startNewAnalysis}>
        <RotateCcw className="h-4 w-4 mr-2" /> {t("retLabTryAgain")}
      </Button>
    </div>
  );

  // ─── render ─────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {!activeJob ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              uploading ? "opacity-60 cursor-wait" : "cursor-pointer"
            } ${
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-secondary/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {uploading ? (
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
            ) : (
              <Upload className={`h-12 w-12 mx-auto mb-4 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
            )}
            <p className="text-lg font-semibold text-foreground mb-1">
              {uploading ? t("retLabUploading") : t("retLabUploadTitle")}
            </p>
            <p className="text-sm text-muted-foreground">{t("retLabUploadDesc")}</p>
            <p className="text-xs text-muted-foreground mt-2">MP4 / MOV • Max 300MB</p>
          </div>

          {/* History */}
          {!historyLoading && history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("retLabHistory")}
              </h3>
              <div className="space-y-2">
                {history.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setActiveJob(job)}
                    className="w-full p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{job.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-2 ${
                      job.status === "completed" ? "bg-success/15 text-success" :
                      job.status === "failed" ? "bg-destructive/15 text-destructive" :
                      "bg-warning/15 text-warning"
                    }`}>
                      {job.status === "completed" ? t("retLabStatusCompleted") :
                       job.status === "failed" ? t("retLabStatusFailed") :
                       job.status === "processing" ? t("retLabStatusProcessing") :
                       t("retLabStatusPending")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : activeJob.status === "completed" && activeJob.result_data ? (
        renderAnalysis(activeJob.result_data)
      ) : activeJob.status === "failed" ? (
        renderFailedState(activeJob)
      ) : (
        renderProcessingState(activeJob)
      )}
    </div>
  );
};

export default RetentionLab;
