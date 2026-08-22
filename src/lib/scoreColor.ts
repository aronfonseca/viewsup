export type ScoreTone = "success" | "warning" | "destructive";

export function getScoreTone(score: number): ScoreTone {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

const TEXT_CLASS: Record<ScoreTone, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const BAR_CLASS: Record<ScoreTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

// Explicit maps (not template-literal class names) so Tailwind's JIT scanner
// can always see the full class strings, regardless of what else is in the codebase.
export function scoreTextClass(score: number): string {
  return TEXT_CLASS[getScoreTone(score)];
}

export function scoreBarClass(score: number): string {
  return BAR_CLASS[getScoreTone(score)];
}

export function scoreHsl(score: number): string {
  return `hsl(var(--${getScoreTone(score)}))`;
}
