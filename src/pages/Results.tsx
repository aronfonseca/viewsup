import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, AlertTriangle, TrendingUp, Lightbulb, RefreshCw,
  Timer, Eye, Volume2, MousePointerClick, Trophy, Languages, Palette,
  Link2, Users, Shield, Flame, Target, FileText, Radar, Video, Download,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ScoreRing from "@/components/ScoreRing";
import DimensionBar from "@/components/DimensionBar";
import { analyzeProfile, type ProfileAnalysis } from "@/lib/mockAnalysis";
import { useI18n } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";

/* ── Rich Text (markdown links) ── */
const RichText = ({ text }: { text: string }) => {
  const parts = useMemo(() => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const result: (string | { label: string; url: string })[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
      result.push({ label: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) result.push(text.slice(lastIndex));
    return result;
  }, [text]);

  return (
    <span>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            {p.label}
          </a>
        )
      )}
    </span>
  );
};

/* ── Reusable Card ── */
const AdvancedCard = ({ icon: Icon, title, score, stats, issues, insight, iconColor }: {
  icon: React.ElementType;
  title: string;
  score?: number;
  stats?: { label: string; value: string | number | boolean }[];
  issues: string[];
  insight: string;
  iconColor: string;
}) => (
  <div className="p-6 rounded-xl bg-card border border-border card-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      {score !== undefined && (
        <span className={`text-2xl font-bold ${score >= 70 ? "text-success" : score >= 45 ? "text-warning" : "text-destructive"}`}>
          {score}
        </span>
      )}
    </div>
    {stats && stats.length > 0 && (
      <div className="flex flex-wrap gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="px-3 py-1.5 rounded-lg bg-secondary text-xs">
            <span className="text-muted-foreground">{s.label}: </span>
            <span className="font-semibold text-foreground">
              {typeof s.value === "boolean" ? (s.value ? "✅" : "❌") : s.value}
            </span>
          </div>
        ))}
      </div>
    )}
    <ul className="space-y-2 mb-4">
      {issues.map((issue, i) => (
        <li key={i} className="flex gap-3 text-sm text-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
          <RichText text={issue} />
        </li>
      ))}
    </ul>
    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
      <p className="text-sm text-foreground italic"><RichText text={insight} /></p>
    </div>
  </div>
);

const healthColor = (label: string) => {
  if (label === "Healthy") return "text-success";
  if (label === "Average") return "text-warning";
  return "text-destructive";
};

/* ── ROI Gauge ── */
const RoiGauge = ({ current, projected, growthPercent, assumptions, t }: {
  current: number; projected: number; growthPercent: number; assumptions: string[];
  t: (key: any) => string;
}) => {
  const percentage = Math.min(growthPercent, 200);
  const barWidth = Math.min((percentage / 200) * 100, 100);

  return (
    <div className="p-6 rounded-xl bg-card border border-border card-shadow">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-success" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("roiProjection")}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-6">{t("roiDesc")}</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-secondary">
          <p className="text-xs text-muted-foreground mb-1">{t("currentReach")}</p>
          <p className="text-2xl font-bold text-foreground">{current.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
          <p className="text-xs text-muted-foreground mb-1">{t("projectedReach")}</p>
          <p className="text-2xl font-bold text-success">{projected.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 rounded-lg gradient-bg">
          <p className="text-xs text-primary-foreground/70 mb-1">{t("growthPercent")}</p>
          <p className="text-2xl font-bold text-primary-foreground">+{growthPercent}%</p>
        </div>
      </div>

      {/* Growth bar */}
      <div className="mb-4">
        <div className="h-4 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full gradient-bg transition-all duration-1000"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span>+{growthPercent}%</span>
          <span>+200%</span>
        </div>
      </div>

      {assumptions.length > 0 && (
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Assumptions:</p>
          <ul className="space-y-1">
            {assumptions.map((a, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span>•</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const reportRef = useRef<HTMLDivElement>(null);
  const url = searchParams.get("url") || "";
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "trends">("analysis");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!url) { navigate("/"); return; }
    setLoading(true);
    setError(null);
    analyzeProfile(url, lang)
      .then((data) => { setAnalysis(data); setLoading(false); })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : t("analysisFailed");
        setError(msg);
        setLoading(false);
        toast({ title: t("errorTitle"), description: msg, variant: "destructive" });
      });
  }, [url, navigate, lang]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#0a0f1e",
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`virallens-${analysis?.username || "report"}.pdf`);
      toast({ title: "PDF", description: lang === "pt-BR" ? "Relatório exportado com sucesso!" : "Report exported successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full gradient-bg animate-spin opacity-30" />
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{t("analyzing")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("analyzingDesc")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-foreground mb-2">{t("analysisFailed")}</p>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="gradient-bg text-primary-foreground">{t("tryAgain")}</Button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("newAnalysis")}
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t("analysisFor")}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">@{analysis.username}</h1>
          </div>
          <Button onClick={handleExportPDF} disabled={exporting} className="gradient-bg text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "..." : t("savePDF")}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "analysis" ? "gradient-bg text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tabAnalysis")}
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "trends" ? "gradient-bg text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Radar className="h-4 w-4" />
            {t("tabTrendRadar")}
          </button>
        </div>

        <div ref={reportRef}>
          {activeTab === "analysis" ? (
            <>
              {/* Score + Dimensions */}
              <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-10">
                <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-card border border-border card-shadow">
                  <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{t("overallScore")}</p>
                  <ScoreRing score={analysis.overallScore} />
                </div>
                <div className="p-6 rounded-xl bg-card border border-border card-shadow space-y-5">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("dimensions")}</h2>
                  {analysis.dimensions.map((d) => <DimensionBar key={d.name} dim={d} />)}
                </div>
              </div>

              {/* ROI Projection */}
              {analysis.roiProjection && (
                <div className="mb-10">
                  <RoiGauge
                    current={analysis.roiProjection.currentEstimatedReach}
                    projected={analysis.roiProjection.projectedReach}
                    growthPercent={analysis.roiProjection.growthPercent}
                    assumptions={analysis.roiProjection.assumptions}
                    t={t}
                  />
                </div>
              )}

              {/* Profile Health */}
              {analysis.profileHealth && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">{t("profileHealth")}</h2>
                  <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <AdvancedCard
                      icon={Palette} title={t("visualConsistency")}
                      score={analysis.profileHealth.visualConsistency.score}
                      stats={[
                        { label: t("colorPattern"), value: analysis.profileHealth.visualConsistency.hasColorPattern },
                        { label: t("fontPattern"), value: analysis.profileHealth.visualConsistency.hasFontPattern },
                        { label: t("faceVisible"), value: analysis.profileHealth.visualConsistency.hostFaceVisible },
                      ]}
                      issues={analysis.profileHealth.visualConsistency.issues}
                      insight={analysis.profileHealth.visualConsistency.insight}
                      iconColor="text-accent"
                    />
                    <AdvancedCard
                      icon={Link2} title={t("bioHook")}
                      stats={[
                        { label: t("usp"), value: analysis.profileHealth.bioHook.hasUSP },
                        { label: t("visibleLink"), value: analysis.profileHealth.bioHook.hasVisibleLink },
                      ]}
                      issues={analysis.profileHealth.bioHook.issues}
                      insight={analysis.profileHealth.bioHook.insight}
                      iconColor="text-primary"
                    />
                    <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-warning" />
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("engagement")}</h2>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`text-3xl font-bold ${healthColor(analysis.profileHealth.engagementRatio.healthLabel)}`}>
                          {analysis.profileHealth.engagementRatio.ratio}%
                        </span>
                        <span className={`text-sm font-medium ${healthColor(analysis.profileHealth.engagementRatio.healthLabel)}`}>
                          {analysis.profileHealth.engagementRatio.healthLabel}
                        </span>
                      </div>
                      <div className="flex gap-3 mb-4">
                        <div className="px-3 py-1.5 rounded-lg bg-secondary text-xs">
                          <span className="text-muted-foreground">{t("avgLikes")}: </span>
                          <span className="font-semibold text-foreground">{analysis.profileHealth.engagementRatio.avgLikes}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-secondary text-xs">
                          <span className="text-muted-foreground">{t("avgComments")}: </span>
                          <span className="font-semibold text-foreground">{analysis.profileHealth.engagementRatio.avgComments}</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {analysis.profileHealth.engagementRatio.issues.map((issue, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                            <RichText text={issue} />
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-foreground italic"><RichText text={analysis.profileHealth.engagementRatio.insight} /></p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Video Engineering */}
              <h2 className="text-lg font-bold text-foreground mb-4">{t("videoEngineering")}</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                {analysis.hookRetention && (
                  <AdvancedCard icon={Timer} title={t("hookRetention")} score={analysis.hookRetention.score}
                    stats={[
                      { label: t("audienceLost"), value: `${analysis.hookRetention.audienceLostPercent}%` },
                      { label: t("visualHook"), value: analysis.hookRetention.hasVisualHook },
                      { label: t("verbalHook"), value: analysis.hookRetention.hasVerbalHook },
                    ]}
                    issues={analysis.hookRetention.issues} insight={analysis.hookRetention.insight} iconColor="text-warning" />
                )}
                {analysis.visualFatigue && (
                  <AdvancedCard icon={Eye} title={t("visualFatigue")} score={analysis.visualFatigue.score}
                    stats={[
                      { label: t("avgCuts"), value: `${analysis.visualFatigue.avgSecondsBetweenCuts}s` },
                      { label: t("staticSegments"), value: analysis.visualFatigue.staticSegments },
                    ]}
                    issues={analysis.visualFatigue.issues} insight={analysis.visualFatigue.insight} iconColor="text-primary" />
                )}
                {analysis.safeZoneAudit && (
                  <AdvancedCard icon={Shield} title={t("safeZone")} score={analysis.safeZoneAudit.score}
                    stats={[
                      { label: t("captionsOut"), value: analysis.safeZoneAudit.captionsOutOfZone },
                      { label: t("ctasHidden"), value: analysis.safeZoneAudit.ctasHidden },
                    ]}
                    issues={analysis.safeZoneAudit.issues} insight={analysis.safeZoneAudit.insight} iconColor="text-accent" />
                )}
                {analysis.audioClarity && (
                  <AdvancedCard icon={Volume2} title={t("audioClarity")} score={analysis.audioClarity.score}
                    stats={[
                      { label: t("bgMusic"), value: analysis.audioClarity.hasBackgroundMusic },
                      { label: t("soundEffects"), value: analysis.audioClarity.hasSoundEffects },
                    ]}
                    issues={analysis.audioClarity.issues} insight={analysis.audioClarity.insight} iconColor="text-success" />
                )}
                {analysis.ctaStrength && (
                  <AdvancedCard icon={MousePointerClick} title={t("ctaStrength")} score={analysis.ctaStrength.score}
                    stats={[{ label: t("ctasPerVideo"), value: analysis.ctaStrength.avgCtasPerVideo }]}
                    issues={analysis.ctaStrength.issues} insight={analysis.ctaStrength.insight} iconColor="text-destructive" />
                )}
                {analysis.captionLanguageQuality && (
                  <AdvancedCard icon={Languages} title={t("captionQuality")} score={analysis.captionLanguageQuality.score}
                    stats={[{ label: t("grammarErrors"), value: analysis.captionLanguageQuality.grammarErrors }]}
                    issues={analysis.captionLanguageQuality.issues} insight={analysis.captionLanguageQuality.insight} iconColor="text-primary" />
                )}
              </div>

              {/* Benchmarking */}
              {analysis.benchmarkComparison && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">{t("benchmarkTitle")}</h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <AdvancedCard icon={Trophy} title={t("vsHormozi")}
                      stats={[
                        { label: t("editGap"), value: `${analysis.benchmarkComparison.hormoziGap.editDensityGap}%` },
                        { label: t("hookGap"), value: `${analysis.benchmarkComparison.hormoziGap.hookAggressivenessGap}%` },
                        { label: t("cutGap"), value: `${analysis.benchmarkComparison.hormoziGap.cutFrequencyGap}%` },
                      ]}
                      issues={analysis.benchmarkComparison.hormoziGap.issues}
                      insight={analysis.benchmarkComparison.hormoziGap.insight}
                      iconColor="text-warning" />
                    <AdvancedCard icon={Trophy} title={t("vsSteven")}
                      stats={[
                        { label: t("storytellingGap"), value: `${analysis.benchmarkComparison.stevenGap.storytellingGap}%` },
                        { label: t("productionGap"), value: `${analysis.benchmarkComparison.stevenGap.productionQualityGap}%` },
                        { label: t("emotionGap"), value: `${analysis.benchmarkComparison.stevenGap.emotionalDepthGap}%` },
                      ]}
                      issues={analysis.benchmarkComparison.stevenGap.issues}
                      insight={analysis.benchmarkComparison.stevenGap.insight}
                      iconColor="text-primary" />
                  </div>
                  <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("missingElements")}</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {analysis.benchmarkComparison.top3MissingElements.map((el, i) => (
                        <div key={i} className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-foreground">
                          <span className="font-bold text-destructive mr-2">#{i + 1}</span>
                          <RichText text={el} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Burning Problems */}
              {analysis.burningProblems && analysis.burningProblems.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">{t("burningProblems")}</h2>
                  <div className="space-y-6 mb-10">
                    {analysis.burningProblems.map((bp, i) => (
                      <div key={i} className="p-6 rounded-xl bg-card border border-border card-shadow">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                            <Flame className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{bp.problem}</h3>
                            <p className="text-sm text-muted-foreground mt-1"><RichText text={bp.impact} /></p>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-success" />
                            <span className="text-xs font-semibold text-success uppercase tracking-wider">{t("fonsecaSolution")}</span>
                          </div>
                          <p className="text-sm text-foreground"><RichText text={bp.solution} /></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Script Suggestions */}
              {analysis.scriptSuggestions && analysis.scriptSuggestions.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-2">{t("scriptSuggestions")}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("scriptSuggestionsDesc")}</p>
                  <div className="grid sm:grid-cols-3 gap-4 mb-10">
                    {analysis.scriptSuggestions.map((s, i) => (
                      <div key={i} className="p-5 rounded-xl bg-card border border-border card-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <Video className="h-4 w-4 text-warning" />
                          <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-3">
                          <p className="text-sm text-foreground font-medium">"{s.hook}"</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">🎥 {s.visualDirection}</p>
                        <p className="text-xs text-muted-foreground italic">💡 {s.whyItWorks}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Content Pillars */}
              {analysis.contentPillars && analysis.contentPillars.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">{t("contentPillars")}</h2>
                  <div className="grid sm:grid-cols-3 gap-4 mb-10">
                    {analysis.contentPillars.map((cp, i) => (
                      <div key={i} className="p-5 rounded-xl bg-card border border-border card-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-foreground text-sm">{cp.theme}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{cp.reasoning}</p>
                        <div className="p-3 rounded-lg bg-secondary text-xs">
                          <span className="text-muted-foreground">Hook: </span>
                          <span className="text-foreground font-medium">{cp.exampleHook}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Issues + Patterns */}
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("detectedIssues")}</h2>
                  </div>
                  <ul className="space-y-3">
                    {analysis.issues.map((issue, i) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                        <RichText text={issue} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("positivePatterns")}</h2>
                  </div>
                  <ul className="space-y-3">
                    {analysis.patterns.map((p, i) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                        <RichText text={p} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Hooks */}
              <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("aiHooks")}</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysis.improvedHooks.map((hook, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary border border-border text-sm text-foreground">{hook}</div>
                  ))}
                </div>
              </div>

              {/* Rewritten Captions */}
              <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                <div className="flex items-center gap-2 mb-6">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("rewrittenCaptions")}</h2>
                </div>
                <div className="space-y-6">
                  {analysis.rewrittenCaptions.map((c, i) => (
                    <div key={i} className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs text-destructive font-medium mb-2 uppercase">{t("original")}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{c.original}</p>
                      </div>
                      <div className="p-4 rounded-lg gradient-border bg-card">
                        <p className="text-xs text-primary font-medium mb-2 uppercase">{t("rewrittenAI")}</p>
                        <p className="text-sm text-foreground whitespace-pre-line">{c.rewritten}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ══ TREND RADAR TAB ══ */
            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">{t("trendRadar")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("trendRadarDesc")}</p>

              {analysis.trendRadar && analysis.trendRadar.length > 0 ? (
                <div className="space-y-6">
                  {analysis.trendRadar.map((trend, i) => (
                    <div key={i} className="p-6 rounded-xl bg-card border border-border card-shadow">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                          <Radar className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{trend.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{trend.description}</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                            {lang === "pt-BR" ? "Exemplo de Aplicação" : "Application Example"}
                          </p>
                          <p className="text-sm text-foreground">{trend.example}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                          <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">
                            {lang === "pt-BR" ? "Relevância para Seu Nicho" : "Relevance to Your Niche"}
                          </p>
                          <p className="text-sm text-foreground">{trend.relevance}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 rounded-xl bg-card border border-border card-shadow text-center">
                  <Radar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    {lang === "pt-BR" ? "Nenhuma tendência disponível. Execute a análise novamente." : "No trends available. Run the analysis again."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
