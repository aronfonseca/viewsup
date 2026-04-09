import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, AlertTriangle, TrendingUp, Lightbulb, RefreshCw,
  Timer, Eye, Volume2, MousePointerClick, Trophy, Languages, Palette,
  Link2, Users, Shield, Flame, Target, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ScoreRing from "@/components/ScoreRing";
import DimensionBar from "@/components/DimensionBar";
import { analyzeProfile, type ProfileAnalysis } from "@/lib/mockAnalysis";

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

/* ── Health Label Color ── */
const healthColor = (label: string) => {
  if (label === "Healthy") return "text-success";
  if (label === "Average") return "text-warning";
  return "text-destructive";
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const url = searchParams.get("url") || "";
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) { navigate("/"); return; }
    setLoading(true);
    setError(null);
    analyzeProfile(url)
      .then((data) => { setAnalysis(data); setLoading(false); })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Analysis failed";
        setError(msg);
        setLoading(false);
        toast({ title: "Analysis Error", description: msg, variant: "destructive" });
      });
  }, [url, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full gradient-bg animate-spin opacity-30" />
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Analyzing profile…</p>
          <p className="text-sm text-muted-foreground mt-1">Scanning videos, detecting patterns, generating insights</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-foreground mb-2">Analysis Failed</p>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="gradient-bg text-primary-foreground">Try Again</Button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const isPt = analysis.language === "pt-BR";

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">ViralLens AI</span>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isPt ? "Nova Análise" : "New Analysis"}
        </Button>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-1">{isPt ? "Análise para" : "Analysis for"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">@{analysis.username}</h1>
        </div>

        {/* Score + Dimensions */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-10">
          <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-card border border-border card-shadow">
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Performance Score</p>
            <ScoreRing score={analysis.overallScore} />
          </div>
          <div className="p-6 rounded-xl bg-card border border-border card-shadow space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {isPt ? "Dimensões" : "Dimension Breakdown"}
            </h2>
            {analysis.dimensions.map((d) => <DimensionBar key={d.name} dim={d} />)}
          </div>
        </div>

        {/* ══ Profile Health ══ */}
        {analysis.profileHealth && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">
              🏥 {isPt ? "Saúde do Perfil" : "Profile Health"}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <AdvancedCard
                icon={Palette}
                title={isPt ? "Consistência Visual" : "Visual Consistency"}
                score={analysis.profileHealth.visualConsistency.score}
                stats={[
                  { label: isPt ? "Padrão de Cores" : "Color Pattern", value: analysis.profileHealth.visualConsistency.hasColorPattern },
                  { label: isPt ? "Padrão de Fonte" : "Font Pattern", value: analysis.profileHealth.visualConsistency.hasFontPattern },
                  { label: isPt ? "Rosto Visível" : "Face Visible", value: analysis.profileHealth.visualConsistency.hostFaceVisible },
                ]}
                issues={analysis.profileHealth.visualConsistency.issues}
                insight={analysis.profileHealth.visualConsistency.insight}
                iconColor="text-accent"
              />
              <AdvancedCard
                icon={Link2}
                title={isPt ? "Bio & Hook" : "Bio & Hook"}
                stats={[
                  { label: "USP", value: analysis.profileHealth.bioHook.hasUSP },
                  { label: isPt ? "Link Visível" : "Visible Link", value: analysis.profileHealth.bioHook.hasVisibleLink },
                ]}
                issues={analysis.profileHealth.bioHook.issues}
                insight={analysis.profileHealth.bioHook.insight}
                iconColor="text-primary"
              />
              <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-warning" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isPt ? "Engajamento" : "Engagement Ratio"}
                  </h2>
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
                    <span className="text-muted-foreground">Avg Likes: </span>
                    <span className="font-semibold text-foreground">{analysis.profileHealth.engagementRatio.avgLikes}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-secondary text-xs">
                    <span className="text-muted-foreground">Avg Comments: </span>
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

        {/* ══ Video Engineering ══ */}
        <h2 className="text-lg font-bold text-foreground mb-4">
          🎬 {isPt ? "Engenharia de Vídeo" : "Video Engineering"}
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {analysis.hookRetention && (
            <AdvancedCard
              icon={Timer}
              title="Hook Retention"
              score={analysis.hookRetention.score}
              stats={[
                { label: isPt ? "Audiência Perdida (3s)" : "Audience Lost (3s)", value: `${analysis.hookRetention.audienceLostPercent}%` },
                { label: isPt ? "Hook Visual" : "Visual Hook", value: analysis.hookRetention.hasVisualHook },
                { label: isPt ? "Hook Verbal" : "Verbal Hook", value: analysis.hookRetention.hasVerbalHook },
              ]}
              issues={analysis.hookRetention.issues}
              insight={analysis.hookRetention.insight}
              iconColor="text-warning"
            />
          )}
          {analysis.visualFatigue && (
            <AdvancedCard
              icon={Eye}
              title={isPt ? "Fadiga Visual" : "Visual Fatigue"}
              score={analysis.visualFatigue.score}
              stats={[
                { label: isPt ? "Média entre Cortes" : "Avg Between Cuts", value: `${analysis.visualFatigue.avgSecondsBetweenCuts}s` },
                { label: isPt ? "Segmentos Estáticos" : "Static Segments", value: analysis.visualFatigue.staticSegments },
              ]}
              issues={analysis.visualFatigue.issues}
              insight={analysis.visualFatigue.insight}
              iconColor="text-primary"
            />
          )}
          {analysis.safeZoneAudit && (
            <AdvancedCard
              icon={Shield}
              title="Safe Zone"
              score={analysis.safeZoneAudit.score}
              stats={[
                { label: isPt ? "Legendas Fora da Zona" : "Captions Out of Zone", value: analysis.safeZoneAudit.captionsOutOfZone },
                { label: isPt ? "CTAs Escondidos" : "CTAs Hidden", value: analysis.safeZoneAudit.ctasHidden },
              ]}
              issues={analysis.safeZoneAudit.issues}
              insight={analysis.safeZoneAudit.insight}
              iconColor="text-accent"
            />
          )}
          {analysis.audioClarity && (
            <AdvancedCard
              icon={Volume2}
              title={isPt ? "Áudio & Sound Design" : "Audio & Sound Design"}
              score={analysis.audioClarity.score}
              stats={[
                { label: isPt ? "Música BG" : "BG Music", value: analysis.audioClarity.hasBackgroundMusic },
                { label: "SFX", value: analysis.audioClarity.hasSoundEffects },
              ]}
              issues={analysis.audioClarity.issues}
              insight={analysis.audioClarity.insight}
              iconColor="text-success"
            />
          )}
          {analysis.ctaStrength && (
            <AdvancedCard
              icon={MousePointerClick}
              title={isPt ? "Força do CTA" : "CTA Strength"}
              score={analysis.ctaStrength.score}
              stats={[
                { label: isPt ? "CTAs/Vídeo" : "Avg CTAs/Video", value: analysis.ctaStrength.avgCtasPerVideo },
              ]}
              issues={analysis.ctaStrength.issues}
              insight={analysis.ctaStrength.insight}
              iconColor="text-destructive"
            />
          )}
          {analysis.captionLanguageQuality && (
            <AdvancedCard
              icon={Languages}
              title={isPt ? "Qualidade das Legendas" : "Caption Language Quality"}
              score={analysis.captionLanguageQuality.score}
              stats={[
                { label: isPt ? "Erros de Gramática" : "Grammar Errors", value: analysis.captionLanguageQuality.grammarErrors },
              ]}
              issues={analysis.captionLanguageQuality.issues}
              insight={analysis.captionLanguageQuality.insight}
              iconColor="text-primary"
            />
          )}
        </div>

        {/* ══ Benchmarking ══ */}
        {analysis.benchmarkComparison && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">
              🏆 {isPt ? "Benchmark vs Elite" : "Benchmark vs Elite"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <AdvancedCard
                icon={Trophy}
                title="vs @hormozi"
                stats={[
                  { label: isPt ? "Gap Edição" : "Edit Density Gap", value: `${analysis.benchmarkComparison.hormoziGap.editDensityGap}%` },
                  { label: isPt ? "Gap Hook" : "Hook Gap", value: `${analysis.benchmarkComparison.hormoziGap.hookAggressivenessGap}%` },
                  { label: isPt ? "Gap Cortes" : "Cut Freq Gap", value: `${analysis.benchmarkComparison.hormoziGap.cutFrequencyGap}%` },
                ]}
                issues={analysis.benchmarkComparison.hormoziGap.issues}
                insight={analysis.benchmarkComparison.hormoziGap.insight}
                iconColor="text-warning"
              />
              <AdvancedCard
                icon={Trophy}
                title="vs @steven"
                stats={[
                  { label: isPt ? "Gap Storytelling" : "Storytelling Gap", value: `${analysis.benchmarkComparison.stevenGap.storytellingGap}%` },
                  { label: isPt ? "Gap Produção" : "Production Gap", value: `${analysis.benchmarkComparison.stevenGap.productionQualityGap}%` },
                  { label: isPt ? "Gap Emoção" : "Emotion Gap", value: `${analysis.benchmarkComparison.stevenGap.emotionalDepthGap}%` },
                ]}
                issues={analysis.benchmarkComparison.stevenGap.issues}
                insight={analysis.benchmarkComparison.stevenGap.insight}
                iconColor="text-primary"
              />
            </div>
            <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isPt ? "3 Elementos que Faltam para Atingir o Nível Elite" : "3 Missing Elements to Reach Elite Level"}
              </h3>
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

        {/* ══ BURNING PROBLEMS + FONSECA FILMS ══ */}
        {analysis.burningProblems && analysis.burningProblems.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">
              🔥 {isPt ? "Problemas que Estão Te Custando Dinheiro" : "The Burning Problems"}
            </h2>
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
                      <span className="text-xs font-semibold text-success uppercase tracking-wider">
                        {isPt ? "Solução Fonseca Films" : "Fonseca Films Solution"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground"><RichText text={bp.solution} /></p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ Content Pillars ══ */}
        {analysis.contentPillars && analysis.contentPillars.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">
              📋 {isPt ? "Pilares de Conteúdo Sugeridos" : "Suggested Content Pillars"}
            </h2>
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {isPt ? "Problemas Detectados" : "Detected Issues"}
              </h2>
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {isPt ? "Padrões Positivos" : "Detected Patterns"}
              </h2>
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

        {/* Improved Hooks */}
        <div className="p-6 rounded-xl bg-card border border-border card-shadow mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {isPt ? "Hooks Gerados por IA" : "AI-Generated Hooks"}
            </h2>
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {isPt ? "Legendas Reescritas" : "Rewritten Captions"}
            </h2>
          </div>
          <div className="space-y-6">
            {analysis.rewrittenCaptions.map((c, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-destructive font-medium mb-2 uppercase">Original</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{c.original}</p>
                </div>
                <div className="p-4 rounded-lg gradient-border bg-card">
                  <p className="text-xs text-primary font-medium mb-2 uppercase">{isPt ? "Reescrita IA" : "AI Rewrite"}</p>
                  <p className="text-sm text-foreground whitespace-pre-line">{c.rewritten}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
