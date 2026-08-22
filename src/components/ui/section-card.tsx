import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive";

const ACCENT_RAIL_CLASS: Record<Tone, string> = {
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
};

const PADDING_CLASS = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
  "2xl": "p-12",
} as const;

interface SectionCardProps {
  variant?: "card" | "tile";
  padding?: keyof typeof PADDING_CLASS;
  accentColor?: Tone;
  className?: string;
  children: ReactNode;
}

/**
 * Shared card container for report sections. `variant="tile"` is for content
 * nested inside a SectionCard that would otherwise be bg-card-on-bg-card.
 * `accentColor` adds a left rail only (no background wash) for the two
 * "diagnostic" sections (burningProblems, contentFocus) that should stay
 * visually findable without the heavy full-tint treatment.
 */
export function SectionCard({ variant = "card", padding = "lg", accentColor, className, children }: SectionCardProps) {
  return (
    <div
      className={cn(
        variant === "card"
          ? "rounded-xl border border-border bg-card card-shadow"
          : "rounded-lg border border-border/50 bg-secondary/50",
        accentColor && "border-l-4",
        accentColor && ACCENT_RAIL_CLASS[accentColor],
        PADDING_CLASS[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

type CalloutTone = Tone | "neutral";

const CALLOUT_CLASS: Record<CalloutTone, string> = {
  primary: "bg-primary/10 border-primary/20",
  success: "bg-success/10 border-success/20",
  warning: "bg-warning/10 border-warning/20",
  destructive: "bg-destructive/10 border-destructive/20",
  neutral: "bg-secondary/50 border-border/50",
};

interface CalloutProps {
  tone: CalloutTone;
  className?: string;
  children: ReactNode;
}

/** A single consistent recipe for nested insight/explanation boxes. */
export function Callout({ tone, className, children }: CalloutProps) {
  return (
    <div className={cn("rounded-lg border p-3 text-sm", CALLOUT_CLASS[tone], className)}>
      {children}
    </div>
  );
}

const BADGE_BG_CLASS: Record<Tone, string> = {
  primary: "bg-primary/20",
  success: "bg-success/20",
  warning: "bg-warning/20",
  destructive: "bg-destructive/20",
};

const BADGE_TEXT_CLASS: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

interface IconBadgeProps {
  tone: Tone;
  icon?: LucideIcon;
  label?: ReactNode;
  size?: "sm" | "lg";
  className?: string;
}

/** Small circular icon/number badge — replaces the ~4 hand-rolled variants. */
export function IconBadge({ tone, icon: Icon, label, size = "sm", className }: IconBadgeProps) {
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center shrink-0",
        size === "sm" ? "h-8 w-8" : "h-11 w-11",
        BADGE_BG_CLASS[tone],
        className,
      )}
    >
      {Icon && <Icon className={cn(size === "sm" ? "h-4 w-4" : "h-6 w-6", BADGE_TEXT_CLASS[tone])} />}
      {!Icon && label != null && (
        <span className={cn("font-bold", size === "sm" ? "text-xs" : "text-sm", BADGE_TEXT_CLASS[tone])}>{label}</span>
      )}
    </div>
  );
}
