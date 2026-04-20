import { useState, useCallback, useRef } from "react";
import {
  Upload, CheckCircle2, AlertTriangle, Video, Volume2, Scissors,
  Eye, FileText, Sparkles, Loader2, Copy, Hash,
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);

  const handleFile = useCallback((file: File) => {
    const validTypes = ["video/mp4", "video/quicktime", "video/mov"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov)$/i)) {
      toast({ title: t("retLabError"), description: t("retLabInvalidFormat"), variant: "destructive" });
      return;
    }
    if (file.size > 300 * 1024 * 1024) {
      toast({ title: t("retLabError"), description: t("retLabTooLarge"), variant: "destructive" });
      return;
    }
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setAnalysis(null);
  }, [toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("language", lang);
      formData.append("companyName", companyName);

      const { data, error } = await supabase.functions.invoke("analyze-video", {
        body: formData,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setAnalysis(data as VideoAnalysis);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast({ title: t("retLabError"), description: msg, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setAnalysis(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  };

  const copyCaption = () => {
    if (!analysis) return;
    const text = `${analysis.suggestedCaption}\n\n${analysis.captionHashtags.map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "✅", description: t("retLabCopied") });
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      {!videoFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
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
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload className={`h-12 w-12 mx-auto mb-4 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-lg font-semibold text-foreground mb-1">{t("retLabUploadTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("retLabUploadDesc")}</p>
          <p className="text-xs text-muted-foreground mt-2">MP4 / MOV • Max 300MB</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Video Preview */}
          <div className="rounded-xl overflow-hidden bg-card border border-border">
            <video src={videoUrl!} controls className="w-full max-h-[400px] object-contain bg-black" />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                <span>{videoFile.name}</span>
                <span className="text-xs">({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>{t("retLabChange")}</Button>
                {!analysis && (
                  <Button onClick={handleAnalyze} disabled={analyzing} className="gradient-bg text-primary-foreground">
                    {analyzing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("retLabAnalyzing")}</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />{t("retLabAnalyzeBtn")}</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
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

                {/* Hook Visual */}
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

                  {/* Pacing */}
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

                  {/* Audio */}
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
                  <Button variant="ghost" size="sm" onClick={copyCaption} className="text-xs">
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

              {/* Analyze Again */}
              <div className="text-center">
                <Button variant="outline" onClick={handleReset}>{t("retLabNewVideo")}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetentionLab;
