import { Zap, Eye, MessageCircle, LayoutGrid, Heart } from "lucide-react";
import type { Dimension } from "@/lib/mockAnalysis";

const iconMap: Record<string, React.ElementType> = {
  Zap, Eye, MessageCircle, LayoutGrid, Heart,
};

// Legacy fallback: when a dimension only has a camelCase `name` and no proper `label`,
// map common identifiers to readable English names.
const NAME_FALLBACK: Record<string, string> = {
  hookRetention: "Hook & Retention",
  visualConsistency: "Visual Identity",
  consistency: "Visual Identity",
  engagement: "Engagement",
  contentStrategy: "Content Strategy",
  contentValue: "Content Strategy",
  community: "Community Building",
  viralPotential: "Viral Potential",
  profileHealth: "Profile Health",
};

const prettify = (raw: string) => {
  if (NAME_FALLBACK[raw]) return NAME_FALLBACK[raw];
  // Split camelCase / PascalCase into words and Title Case
  const spaced = raw.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
};

const isCamelCase = (s: string) => /^[a-z]+([A-Z][a-z0-9]*)+$/.test(s);

const displayName = (dim: Dimension) => {
  // Prefer label if it's already human-friendly
  if (dim.label && !isCamelCase(dim.label)) return prettify(dim.label);
  return prettify(dim.name);
};

const DimensionBar = ({ dim }: { dim: Dimension }) => {
  const Icon = iconMap[dim.icon] || Zap;
  const label = displayName(dim);

  const getBarColor = (s: number) => {
    if (s >= 75) return "bg-success";
    if (s >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{dim.score}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(dim.score)}`}
          style={{ width: `${dim.score}%` }}
        />
      </div>
    </div>
  );
};

export default DimensionBar;
