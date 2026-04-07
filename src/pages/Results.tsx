import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, AlertTriangle, TrendingUp, Lightbulb, RefreshCw, Timer, Eye, Volume2, MousePointerClick, Trophy, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ScoreRing from "@/components/ScoreRing";
import DimensionBar from "@/components/DimensionBar";
import { analyzeProfile, type ProfileAnalysis } from "@/lib/mockAnalysis";

/** Renders text with markdown-style [label](url) links as clickable <a> tags */
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

const AdvancedCard = ({ icon: Icon, title, score, stats, issues, insight, iconColor }: {
  icon: React.ElementType;
  title: string;
  score?: number;
  stats?: { label: string; value: string | number }[];
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
            <span className="font-semibold text-foreground">{s.value}</span>
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

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const url = searchParams.get("url") || "";
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      navigate("/");
      return;
    }
    setLoading(true);
    setError(null);
    analyzeProfile(url)
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
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
          <Button onClick={() => navigate("/")} className="gradient-bg text-primary-foreground">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">ViralLens AI</span>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-1">Analysis for</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">@{analysis.username}</h1>
        </div>

        {/* Score + Dimensions */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-10">
          <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-card border border-border card-shadow">
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Overall Score</p>
            <ScoreRing score={analysis.overallScore} />
          </div>
          <div className="p-6 rounded-xl bg-card border border-border card-shadow space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dimension Breakdown</h2>
            {analysis.dimensions.map((d) => (
              <DimensionBar key={d.name} dim={d} />
            ))}
          </div>
        </div>

        {/* Advanced Analysis - 6 new sections */}
        <h2 className="text-lg font-bold text-foreground mb-4">🎬 Advanced Video Diagnostics</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {analysis.hookRetention && (
            <AdvancedCard
              icon={Timer}
              title="Hook Retention"
              score={analysis.hookRetention.score}
              stats={[
                { label: "Audience Lost (3s)", value: `${analysis.hookRetention.audienceLostPercent}%` },
              ]}
              issues={analysis.hookRetention.issues}
              insight={analysis.hookRetention.insight}
              iconColor="text-warning"
            />
          )}
          {analysis.visualFatigue && (
            <AdvancedCard
              icon={Eye}
              title="Visual Fatigue"
              score={analysis.visualFatigue.score}
              stats={[
                { label: "Avg Between Cuts", value: `${analysis.visualFatigue.avgSecondsBetweenCuts}s` },
                { label: "Static Segments", value: analysis.visualFatigue.staticSegments },
              ]}
              issues={analysis.visualFatigue.issues}
              insight={analysis.visualFatigue.insight}
              iconColor="text-primary"
            />
          )}
          {analysis.audioClarity && (
            <AdvancedCard
              icon={Volume2}
              title="Audio & Sound Design"
              score={analysis.audioClarity.score}
              stats={[
                { label: "BG Music", value: analysis.audioClarity.hasBackgroundMusic ? "Yes" : "No" },
                { label: "SFX", value: analysis.audioClarity.hasSoundEffects ? "Yes" : "No" },
              ]}
              issues={analysis.audioClarity.issues}
              insight={analysis.audioClarity.insight}
              iconColor="text-success"
            />
          )}
          {analysis.ctaStrength && (
            <AdvancedCard
              icon={MousePointerClick}
              title="CTA Strength"
              score={analysis.ctaStrength.score}
              stats={[
                { label: "Avg CTAs/Video", value: analysis.ctaStrength.avgCtasPerVideo },
              ]}
              issues={analysis.ctaStrength.issues}
              insight={analysis.ctaStrength.insight}
              iconColor="text-destructive"
            />
          )}
          {analysis.benchmarkComparison && (
            <AdvancedCard
              icon={Trophy}
              title={`Benchmark vs ${analysis.benchmarkComparison.comparedTo}`}
              stats={[
                { label: "Edit Density Gap", value: `${analysis.benchmarkComparison.editDensityGap}%` },
                { label: "Your Avg Words", value: analysis.benchmarkComparison.captionWordCountAvg },
                { label: "Elite Avg Words", value: analysis.benchmarkComparison.eliteCaptionWordCountAvg },
              ]}
              issues={analysis.benchmarkComparison.issues}
              insight={analysis.benchmarkComparison.insight}
              iconColor="text-warning"
            />
          )}
          {analysis.captionLanguageQuality && (
            <AdvancedCard
              icon={Languages}
              title="Caption Language Quality"
              score={analysis.captionLanguageQuality.score}
              stats={[
                { label: "Grammar Errors", value: analysis.captionLanguageQuality.grammarErrors },
              ]}
              issues={analysis.captionLanguageQuality.issues}
              insight={analysis.captionLanguageQuality.insight}
              iconColor="text-primary"
            />
          )}
        </div>

        {/* Issues + Patterns */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 rounded-xl bg-card border border-border card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detected Issues</h2>
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detected Patterns</h2>
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI-Generated Hooks</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.improvedHooks.map((hook, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary border border-border text-sm text-foreground">
                {hook}
              </div>
            ))}
          </div>
        </div>

        {/* Rewritten Captions */}
        <div className="p-6 rounded-xl bg-card border border-border card-shadow">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rewritten Captions</h2>
          </div>
          <div className="space-y-6">
            {analysis.rewrittenCaptions.map((c, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-destructive font-medium mb-2 uppercase">Original</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{c.original}</p>
                </div>
                <div className="p-4 rounded-lg gradient-border bg-card">
                  <p className="text-xs text-primary font-medium mb-2 uppercase">AI Rewrite</p>
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
