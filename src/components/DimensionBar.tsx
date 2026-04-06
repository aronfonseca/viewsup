import { Zap, Eye, MessageCircle, LayoutGrid, Heart } from "lucide-react";
import type { Dimension } from "@/lib/mockAnalysis";

const iconMap: Record<string, React.ElementType> = {
  Zap, Eye, MessageCircle, LayoutGrid, Heart,
};

const DimensionBar = ({ dim }: { dim: Dimension }) => {
  const Icon = iconMap[dim.icon] || Zap;

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
          <span className="text-sm font-medium text-foreground">{dim.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dim.label}</span>
          <span className="text-sm font-semibold text-foreground">{dim.score}</span>
        </div>
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
