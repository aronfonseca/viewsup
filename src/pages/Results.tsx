import { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, AlertTriangle, TrendingUp, Lightbulb, RefreshCw,
  Timer, Eye, Volume2, MousePointerClick, Trophy, Languages, Palette,
  Link2, Users, Shield, Flame, Target, FileText, Radar, Video, Download,
  BarChart3, Crosshair, Brain, Music, Zap, FlaskConical, Clock, Hash, Clapperboard,
} from "lucide-react";
const RetentionLab = lazy(() => import("@/components/RetentionLab"));
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ScoreRing from "@/components/ScoreRing";
import DimensionBar from "@/components/DimensionBar";
import { analyzeProfile, type ProfileAnalysis } from "@/lib/mockAnalysis";
import { useI18n } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyBranding } from "@/hooks/useAgencyBranding";
import { PageHelmet } from "@/components/PageHelmet";
import { hexToHslString } from "@/lib/colorUtils";

/* ── Rich Text (markdown links + Instagram shortcodes in backticks) ── */
const RichText = ({ text }: { text: string }) => {
  const { lang } = useI18n();
  const postLabel = lang === "pt-BR" ? "ver post" : "view post";
  const parts = useMemo(() => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([A-Za-z0-9_-]{6,20})`/g;
    const result: (string | { label: string; url: string })[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
      if (match[2]) {
        result.push({ label: match[1], url: match[2] });
      } else if (match[3]) {
        result.push({ label: postLabel, url: `https://www.instagram.com/p/${match[3]}/` });
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) result.push(text.slice(lastIndex));
    return result;
  }, [text, postLabel]);

  return (
    <span>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-primary underline underline-offset-2 transition-all hover:bg-accent hover:text-accent-foreground hover:no-underline"
          >
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

const toArray = (val: any): any[] => Array.isArray(val) ? val : val ? [val] : [];

const sanitizeAnalysis = (raw: any): ProfileAnalysis => {
  if (!raw || typeof raw !== "object") return raw;
  const fields = [
    "rewrittenCaptions", "videoIdeas", "trendRadar", "scriptSuggestions",
    "hookStyles", "issues", "patterns", "improvedHooks", "contentPillars",
    "burningProblems", "dimensions", "recentPosts",
  ];
  const out: any = { ...raw };
  for (const f of fields) out[f] = toArray(out[f]);
  return out as ProfileAnalysis;
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, lang, companyName, setCompanyName } = useI18n();
  const { branding } = useAgencyBranding();
  const reportRef = useRef<HTMLDivElement>(null);
  const url = searchParams.get("url") || "";
  const reportId = searchParams.get("reportId") || "";
  const force = searchParams.get("force") === "1";
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobStatus, setJobStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "trends" | "retention-lab">("analysis");
  const [exporting, setExporting] = useState(false);
  const [activeHookStyle, setActiveHookStyle] = useState<"reversePsychology" | "extremeCuriosity" | "bruteAuthority" | "acidHumor">("reversePsychology");
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyDraft, setCompanyDraft] = useState(companyName);
  const trendRadar = useMemo(() => {
    const source = analysis as any;
    const value = source?.trendRadar
      ?? source?.analysis_data?.trendRadar
      ?? source?.analysisData?.trendRadar
      ?? source?.result_data?.trendRadar;
    return Array.isArray(value) ? value : [];
  }, [analysis]);

  useEffect(() => {
    if (!url && !reportId) { navigate("/"); return; }
    setLoading(true);
    setError(null);
    setJobStatus("pending");

    if (reportId) {
      void (async () => {
        try {
          const { data, error: reportError } = await supabase
            .from("reports")
            .select("analysis_data")
            .eq("id", reportId)
            .single();

          if (reportError || !data?.analysis_data) {
            throw new Error(reportError?.message || t("analysisFailed"));
          }
          setAnalysis(sanitizeAnalysis(data.analysis_data as any));
          setLoading(false);
        } catch (err) {
          const msg = err instanceof Error ? err.message : t("analysisFailed");
          setError(msg);
          setLoading(false);
          toast({ title: t("errorTitle"), description: msg, variant: "destructive" });
        }
      })();
      return;
    }

    analyzeProfile(url, lang, companyName, (s) => setJobStatus(s), force)
      .then((data) => { setAnalysis(sanitizeAnalysis(data as any)); setLoading(false); })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : t("analysisFailed");
        setError(msg);
        setLoading(false);
        toast({ title: t("errorTitle"), description: msg, variant: "destructive" });
      });
  }, [url, reportId, force, navigate, lang, companyName, t, toast]);

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

      const brandSlug = branding.enabled && branding.agency_name
        ? branding.agency_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : "viewsup";
      pdf.save(`${brandSlug}-${analysis?.username || "report"}.pdf`);
      toast({ title: "PDF", description: lang === "pt-BR" ? "Relatório exportado com sucesso!" : "Report exported successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    const isPt = lang === "pt-BR";
    const statusLabel: Record<string, string> = isPt
      ? {
          pending: "Na fila…",
          processing: "Coletando dados do perfil e gerando insights com IA…",
          completed: "Quase lá…",
          failed: "Erro",
        }
      : {
          pending: "Queued…",
          processing: "Collecting profile data and generating AI insights…",
          completed: "Almost there…",
          failed: "Error",
        };
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full gradient-bg animate-spin opacity-30" />
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-foreground">{t("analyzing")}</p>
          <p className="text-sm text-muted-foreground mt-1">{statusLabel[jobStatus] ?? statusLabel.pending}</p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            {isPt
              ? "Isso pode levar até 2 minutos. Você pode fechar esta aba — o relatório ficará salvo no seu painel."
              : "This can take up to 2 minutes. You can close this tab — the report will be saved to your dashboard."}
          </p>
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
      <PageHelmet
        title={lang === "pt-BR" ? "Resultados da Análise | Viewsup AI" : "Analysis Results | Viewsup AI"}
        description={lang === "pt-BR" ? "Veja os resultados da auditoria do seu perfil Instagram, pontuações e insights acionáveis gerados por IA." : "View your AI-generated Instagram profile audit results, scores, and actionable insights."}
        path="/results"
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          {branding.enabled && branding.agency_logo_url ? (
            <img src={branding.agency_logo_url} alt={branding.agency_name ? `${branding.agency_name} logo` : "Agency logo"} className="h-7 w-7 object-contain" />
          ) : (
            <Sparkles className="h-6 w-6 text-primary" />
          )}
          <span className="text-lg font-bold text-foreground">
            {branding.enabled && branding.agency_name ? branding.agency_name : t("appName")}
          </span>
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
          <div className="flex items-center gap-3">
            {/* Company name badge */}
            {editingCompany ? (
              <form onSubmit={(e) => { e.preventDefault(); setCompanyName(companyDraft); setEditingCompany(false); }} className="flex items-center gap-2">
                <Input
                  value={companyDraft}
                  onChange={(e) => setCompanyDraft(e.target.value)}
                  placeholder="Viewsup Insights"
                  className="h-9 w-48 bg-secondary border-border text-sm"
                  autoFocus
                  aria-label={lang === "pt-BR" ? "Nome da empresa" : "Company name"}
                />
                <Button type="submit" size="sm" className="h-9 gradient-bg text-primary-foreground">OK</Button>
              </form>
            ) : (
              <button
                onClick={() => { setCompanyDraft(companyName); setEditingCompany(true); }}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center gap-1.5"
                title={lang === "pt-BR" ? "Clique para alterar o nome da empresa" : "Click to change company name"}
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {companyName}
              </button>
            )}
            <Button onClick={handleExportPDF} disabled={exporting} className="gradient-bg text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "..." : t("savePDF")}
            </Button>
          </div>
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
          <button
            onClick={() => setActiveTab("retention-lab")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "retention-lab" ? "gradient-bg text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            {t("tabRetentionLab")}
          </button>
        </div>

        <div
          ref={reportRef}
          style={
            branding.enabled && branding.agency_primary_color
              ? ({ ["--primary" as any]: hexToHslString(branding.agency_primary_color) || undefined } as React.CSSProperties)
              : undefined
          }
        >
          {branding.enabled && (
            <div
              className="mb-6 rounded-xl px-5 py-3 flex items-center justify-between border"
              style={{
                borderColor: `${branding.agency_primary_color || "#7c3aed"}55`,
                background: `linear-gradient(90deg, ${branding.agency_primary_color || "#7c3aed"}22, transparent)`,
              }}
            >
              <div className="flex items-center gap-2.5">
                {branding.agency_logo_url && (
                  <img src={branding.agency_logo_url} alt={branding.agency_name || ""} className="h-8 w-8 object-contain" crossOrigin="anonymous" />
                )}
                <span className="text-base font-bold text-foreground">{branding.agency_name || ""}</span>
              </div>
              {branding.agency_website && (
                <span className="text-xs text-muted-foreground">{branding.agency_website.replace(/^https?:\/\//, "")}</span>
              )}
            </div>
          )}

          {activeTab === "analysis" && (
            <>
              {/* Score + Dimensions */}
              <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-10">
                <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-card border border-border card-shadow">
                  <p className="text-xs text-muted-foreground mb-4 tracking-wide">{t("overallScore")}</p>
                  <ScoreRing score={analysis.overallScore} />
                </div>
                <div className="p-6 rounded-xl bg-card border border-border card-shadow space-y-5">
                  <h2 className="text-sm font-semibold text-muted-foreground tracking-wide">{t("dimensions")}</h2>
                  {(analysis.dimensions ?? []).map((d) => <DimensionBar key={d.name} dim={d} />)}
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

              {/* ══ PREDICTIVE VIRAL SCORE ══ */}
              {analysis.viralScore && (
                <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair className="h-5 w-5 text-accent" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("viralScoreTitle")}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">{t("viralScoreDesc")}</p>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative h-32 w-32">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={analysis.viralScore.probability >= 60 ? "hsl(var(--success))" : analysis.viralScore.probability >= 35 ? "hsl(var(--warning))" : "hsl(var(--destructive))"} strokeWidth="8" strokeDasharray={`${(analysis.viralScore.probability / 100) * 264} 264`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">{analysis.viralScore.probability}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">{t("viralProbability")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-secondary text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t("hookStrength")}</p>
                      <p className="text-2xl font-bold text-foreground">{analysis.viralScore.hookStrengthFactor}</p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${analysis.viralScore.hookStrengthFactor}%` }} /></div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t("editDensity")}</p>
                      <p className="text-2xl font-bold text-foreground">{analysis.viralScore.editDensityFactor}</p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${analysis.viralScore.editDensityFactor}%` }} /></div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-semibold text-primary uppercase mb-1">{t("viralVerdict")}</p>
                    <p className="text-sm text-foreground italic"><RichText text={analysis.viralScore.verdict} /></p>
                  </div>
                </div>
              )}

              {/* ══ MENTAL HEATMAP ══ */}
              {analysis.mentalHeatmap && Array.isArray(analysis.mentalHeatmap.triggers) && analysis.mentalHeatmap.triggers.length > 0 && analysis.mentalHeatmap.totalDurationSeconds > 0 && (
                <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-warning" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("mentalHeatmapTitle")}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">{t("mentalHeatmapDesc")}</p>
                  {/* Timeline bar */}
                  <div className="relative mb-6">
                    <div className="h-10 rounded-lg bg-secondary relative overflow-visible">
                      {analysis.mentalHeatmap.triggers.map((tr, i) => {
                        const pct = Math.min((tr.timestampSeconds / analysis.mentalHeatmap.totalDurationSeconds) * 100, 100);
                        const colors: Record<string, string> = { zoom: "bg-primary", sfx: "bg-accent", cut: "bg-warning", text: "bg-success" };
                        const icons: Record<string, string> = { zoom: "🔍", sfx: "🔊", cut: "✂️", text: "💬" };
                        return (
                          <div key={i} className="absolute top-0 flex flex-col items-center group" style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
                            <div className={`h-10 w-1.5 rounded-full ${colors[tr.type] || "bg-muted-foreground"} opacity-80`} />
                            <span className="text-lg mt-1">{icons[tr.type]}</span>
                            <div className="hidden group-hover:block absolute top-12 z-20 px-3 py-2 rounded-lg bg-popover border border-border shadow-lg text-xs text-foreground whitespace-nowrap max-w-xs">
                              <span className="font-bold">{tr.timestampSeconds}s</span> — {tr.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0s</span>
                      <span>{analysis.mentalHeatmap.totalDurationSeconds}s</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    {[{ key: "zoom", color: "bg-primary" }, { key: "sfx", color: "bg-accent" }, { key: "cut", color: "bg-warning" }, { key: "text", color: "bg-success" }].map(({ key, color }) => (
                      <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        {t((`trigger${key.charAt(0).toUpperCase()}${key.slice(1)}`) as any)}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground italic"><RichText text={analysis.mentalHeatmap.insight} /></p>
                  </div>
                </div>
              )}

              {/* ══ HOOK SWAPPER ══ */}
              {analysis.hookStyles && analysis.hookStyles.length > 0 && (() => {
                const styleKeys = [
                  { key: "reversePsychology" as const, label: t("styleReversePsych"), icon: "🧠" },
                  { key: "extremeCuriosity" as const, label: t("styleExtremeCuriosity"), icon: "🔥" },
                  { key: "bruteAuthority" as const, label: t("styleBruteAuthority"), icon: "👊" },
                  { key: "acidHumor" as const, label: t("styleAcidHumor"), icon: "😈" },
                ];
                return (
                  <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("hookSwapperTitle")}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{t("hookSwapperDesc")}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {styleKeys.map(({ key, label, icon }) => (
                        <button key={key} onClick={() => setActiveHookStyle(key)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeHookStyle === key ? "gradient-bg text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          <span>{icon}</span> {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {analysis.hookStyles.map((hs, i) => (
                        <div key={i} className="p-5 rounded-xl bg-secondary/50 border border-border">
                          <h3 className="font-semibold text-foreground text-sm mb-3">{hs.topic}</h3>
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm text-foreground font-medium">"{hs[activeHookStyle]}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ══ SOUNDSCAPE ARCHITECT ══ */}
              {analysis.soundscapeArchitect && (
                <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="h-5 w-5 text-success" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("soundscapeTitle")}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">{t("soundscapeDesc")}</p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-secondary text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t("idealGenre")}</p>
                      <p className="text-lg font-bold text-foreground">{analysis.soundscapeArchitect.idealGenre}</p>
                    </div>
                    <div className="p-4 rounded-lg gradient-bg text-center">
                      <p className="text-xs text-primary-foreground/70 mb-1">{t("bpmRange")}</p>
                      <p className="text-lg font-bold text-primary-foreground">{analysis.soundscapeArchitect.bpmRange}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t("retentionSpeed")}</p>
                      <p className="text-lg font-bold text-foreground">{analysis.soundscapeArchitect.retentionSpeed}</p>
                    </div>
                  </div>
                  {Array.isArray(analysis.soundscapeArchitect.trackSuggestions) && analysis.soundscapeArchitect.trackSuggestions.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("trackSuggestions")}</h3>
                      <div className="grid sm:grid-cols-3 gap-3 mb-4">
                        {analysis.soundscapeArchitect.trackSuggestions.map((tr, i) => (
                          <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border">
                            <p className="font-semibold text-foreground text-sm">{tr.title}</p>
                            <p className="text-xs text-muted-foreground">{tr.artist}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">{tr.bpm} BPM</span>
                              <span className="text-xs text-muted-foreground">{tr.mood}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground italic"><RichText text={analysis.soundscapeArchitect.insight} /></p>
                  </div>
                </div>
              )}


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
                        {(analysis.profileHealth.engagementRatio.issues ?? []).map((issue, i) => (
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
              {analysis.benchmarkComparison && (analysis.benchmarkComparison.hormoziGap || analysis.benchmarkComparison.stevenGap) && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-4">{t("benchmarkTitle")}</h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {analysis.benchmarkComparison.hormoziGap && (
                      <AdvancedCard icon={Trophy} title={t("vsHormozi")}
                        stats={[
                          { label: t("editGap"), value: `${analysis.benchmarkComparison.hormoziGap.editDensityGap ?? 0}%` },
                          { label: t("hookGap"), value: `${analysis.benchmarkComparison.hormoziGap.hookAggressivenessGap ?? 0}%` },
                          { label: t("cutGap"), value: `${analysis.benchmarkComparison.hormoziGap.cutFrequencyGap ?? 0}%` },
                        ]}
                        issues={analysis.benchmarkComparison.hormoziGap.issues ?? []}
                        insight={analysis.benchmarkComparison.hormoziGap.insight ?? ""}
                        iconColor="text-warning" />
                    )}
                    {analysis.benchmarkComparison.stevenGap && (
                      <AdvancedCard icon={Trophy} title={t("vsSteven")}
                        stats={[
                          { label: t("storytellingGap"), value: `${analysis.benchmarkComparison.stevenGap.storytellingGap ?? 0}%` },
                          { label: t("productionGap"), value: `${analysis.benchmarkComparison.stevenGap.productionQualityGap ?? 0}%` },
                          { label: t("emotionGap"), value: `${analysis.benchmarkComparison.stevenGap.emotionalDepthGap ?? 0}%` },
                        ]}
                        issues={analysis.benchmarkComparison.stevenGap.issues ?? []}
                        insight={analysis.benchmarkComparison.stevenGap.insight ?? ""}
                        iconColor="text-primary" />
                    )}
                  </div>
                  {Array.isArray(analysis.benchmarkComparison.top3MissingElements) && analysis.benchmarkComparison.top3MissingElements.length > 0 && (
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
                  )}
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
                            <h3 className="font-semibold text-foreground"><RichText text={bp.problem} /></h3>
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

              {/* ══ 10 VÍDEOS PARA GRAVAR AGORA ══ */}
              {analysis.videoIdeas && analysis.videoIdeas.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-2">{t("videoIdeasTitle")}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("videoIdeasDesc")}</p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-10">
                    {analysis.videoIdeas.map((v, i) => {
                      const formatColors: Record<string, string> = {
                        Tutorial: "bg-primary/20 text-primary",
                        "Polêmica": "bg-destructive/20 text-destructive",
                        Comparativo: "bg-warning/20 text-warning",
                        Bastidores: "bg-accent/20 text-accent-foreground",
                        "Prova Social": "bg-success/20 text-success",
                      };
                      const badgeClass = formatColors[v.format] || "bg-secondary text-muted-foreground";
                      return (
                        <div key={i} className="p-5 rounded-xl bg-card border border-border card-shadow flex flex-col">
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm leading-tight">{v.title}</h3>
                              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                                {v.format}
                              </span>
                            </div>
                          </div>

                          {/* Hook verbal */}
                          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-3">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">🎤 Hook (3s)</p>
                            <p className="text-sm text-foreground font-medium">"{v.hookVerbal}"</p>
                          </div>

                          {/* 3-Act Structure */}
                          <div className="space-y-1.5 mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("videoStructure")}</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="p-2 rounded bg-primary/10 text-center">
                                <p className="text-[10px] text-primary font-bold">{t("videoHookAct")}</p>
                                <p className="text-[11px] text-foreground mt-0.5">{v.structure.gancho}</p>
                              </div>
                              <div className="p-2 rounded bg-secondary text-center">
                                <p className="text-[10px] text-muted-foreground font-bold">{t("videoDevelopment")}</p>
                                <p className="text-[11px] text-foreground mt-0.5">{v.structure.desenvolvimento}</p>
                              </div>
                              <div className="p-2 rounded bg-success/10 text-center">
                                <p className="text-[10px] text-success font-bold">{t("videoCta")}</p>
                                <p className="text-[11px] text-foreground mt-0.5">{v.structure.cta}</p>
                              </div>
                            </div>
                          </div>

                          {/* Best time */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{t("videoBestTime")}: <span className="text-foreground font-medium">{v.bestDay} — {v.bestTime}</span></span>
                          </div>

                          {/* Hashtags */}
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {v.hashtags.map((tag, j) => (
                              <span key={j} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">
                                {tag.startsWith("#") ? tag : `#${tag}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                    {(analysis.issues ?? []).map((issue, i) => (
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
                    {(analysis.patterns ?? []).map((p, i) => (
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
                  {(analysis.improvedHooks ?? []).map((hook, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary border border-border text-sm text-foreground"><RichText text={hook} /></div>
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
                  {(analysis.rewrittenCaptions ?? []).map((c, i) => (
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
          )}

          {activeTab === "trends" && (
            /* ══ TREND RADAR TAB ══ */
            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">{t("trendRadar")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("trendRadarDesc")}</p>

              {trendRadar.length > 0 ? (
                <div className="space-y-6">
                  {trendRadar.map((trend, i) => (
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

          {activeTab === "retention-lab" && (
            <Suspense fallback={
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 rounded-full gradient-bg animate-spin opacity-30" />
              </div>
            }>
              <RetentionLab />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
