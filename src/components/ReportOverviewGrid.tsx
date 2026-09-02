import { Target, Gauge, Palette, Heart, Crosshair, AlertTriangle, Calendar, Lightbulb } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getScoreTone } from "@/lib/scoreColor";
import type { ProfileAnalysis } from "@/lib/mockAnalysis";

type Tone = "primary" | "success" | "warning" | "destructive";

const TONE_TEXT: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const TONE_ICON_BG: Record<Tone, string> = {
  primary: "bg-primary/15",
  success: "bg-success/15",
  warning: "bg-warning/15",
  destructive: "bg-destructive/15",
};

interface Area {
  id: string;
  icon: React.ElementType;
  label: string;
  value: string;
  tone: Tone;
  onClick: () => void;
}

interface ReportOverviewGridProps {
  analysis: ProfileAnalysis;
  onGoToCalendar: () => void;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function findEngagementScore(analysis: ProfileAnalysis): number | null {
  const dims = Array.isArray(analysis.dimensions) ? analysis.dimensions : [];
  const dim = dims.find((d) => /engaj|engage/i.test(String((d as any)?.name || (d as any)?.label || "")));
  return dim && Number.isFinite((dim as any).score) ? Number((dim as any).score) : null;
}

const ReportOverviewGrid = ({ analysis, onGoToCalendar }: ReportOverviewGridProps) => {
  const { lang, t } = useI18n();
  const isPT = lang === "pt-BR";

  const objAlign = analysis.objectiveAlignment;
  const engagementScore = findEngagementScore(analysis);
  const problemsCount = analysis.burningProblems?.length ?? 0;
  const ideasCount = analysis.videoIdeas?.length ?? 0;

  const areas: Area[] = [
    {
      id: "objetivo",
      icon: Target,
      label: t("profileObjectiveTitle"),
      value: objAlign?.hasStatedObjective
        ? `${Math.round(objAlign.alignmentScore)}/100`
        : (isPT ? "Não definido" : "Not set"),
      tone: objAlign?.hasStatedObjective ? getScoreTone(objAlign.alignmentScore) : "primary",
      onClick: () => scrollToSection("section-objetivo"),
    },
    {
      id: "score",
      icon: Gauge,
      label: t("overallScore"),
      value: `${Math.round(analysis.overallScore ?? 0)}/100`,
      tone: getScoreTone(analysis.overallScore ?? 0),
      onClick: () => scrollToSection("section-score"),
    },
    {
      id: "visual",
      icon: Palette,
      label: t("visualConsistency"),
      value: analysis.profileHealth?.visualConsistency
        ? `${Math.round(analysis.profileHealth.visualConsistency.score)}/100`
        : "—",
      tone: analysis.profileHealth?.visualConsistency ? getScoreTone(analysis.profileHealth.visualConsistency.score) : "primary",
      onClick: () => scrollToSection("section-visual"),
    },
    {
      id: "engajamento",
      icon: Heart,
      label: isPT ? "Engajamento" : "Engagement",
      value: engagementScore != null ? `${Math.round(engagementScore)}/100` : "—",
      tone: engagementScore != null ? getScoreTone(engagementScore) : "primary",
      onClick: () => scrollToSection("section-visual"),
    },
    {
      id: "foco",
      icon: Crosshair,
      label: t("contentFocusTitle"),
      value: analysis.contentFocus
        ? (analysis.contentFocus.hasClearFocus ? (isPT ? "Consistente" : "Consistent") : (isPT ? "Disperso" : "Scattered"))
        : "—",
      tone: analysis.contentFocus ? (analysis.contentFocus.hasClearFocus ? "success" : "warning") : "primary",
      onClick: () => scrollToSection("section-foco"),
    },
    {
      id: "problemas",
      icon: AlertTriangle,
      label: t("burningProblems"),
      value: problemsCount > 0
        ? `${problemsCount} ${isPT ? "encontrados" : "found"}`
        : (isPT ? "Nenhum" : "None"),
      tone: problemsCount > 0 ? "destructive" : "success",
      onClick: () => scrollToSection("section-problemas"),
    },
    {
      id: "calendario",
      icon: Calendar,
      label: isPT ? "Calendário" : "Calendar",
      value: isPT ? "Ver produção" : "View production",
      tone: "primary",
      onClick: onGoToCalendar,
    },
    {
      id: "ideias",
      icon: Lightbulb,
      label: t("videoIdeasTitle"),
      value: `${ideasCount} ${isPT ? "geradas" : "generated"}`,
      tone: "primary",
      onClick: () => scrollToSection("section-ideias"),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
      {areas.map((a) => (
        <button
          key={a.id}
          onClick={a.onClick}
          className="text-left rounded-xl bg-card border border-border p-3 hover:border-primary/40 transition-colors"
        >
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${TONE_ICON_BG[a.tone]}`}>
            <a.icon className={`h-4 w-4 ${TONE_TEXT[a.tone]}`} />
          </div>
          <p className="text-[11px] text-muted-foreground mb-0.5">{a.label}</p>
          <p className={`text-sm font-semibold ${TONE_TEXT[a.tone]}`}>{a.value}</p>
        </button>
      ))}
    </div>
  );
};

export default ReportOverviewGrid;
