import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertCircle, Lightbulb, Flame } from "lucide-react";

interface NichoInsight {
  nicho: string;
  total_analises: number;
  avg_score_geral: number | null;
  avg_hook_strength: number | null;
  avg_retention: number | null;
  avg_engagement: number | null;
  avg_viral_score: number | null;
  top_problemas: Array<{ problema: string; count: number }>;
  top_solucoes: Array<{ solucao: string; count: number }>;
  viral_patterns: any[];
  updated_at: string;
}

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toFixed(1);

const NichoIntelligence = () => {
  const [data, setData] = useState<NichoInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("nicho_insights")
        .select("*")
        .order("total_analises", { ascending: false });
      if (!error && data) setData(data as any);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum dado de nicho ainda. Os insights aparecerão assim que as análises forem processadas.
        </CardContent>
      </Card>
    );
  }

  const maxAnalises = Math.max(...data.map((d) => d.total_analises), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.map((n) => {
          const problemas = (n.top_problemas ?? []).slice(0, 3);
          const solucoes = (n.top_solucoes ?? []).slice(0, 3);
          const patterns = Array.isArray(n.viral_patterns) ? n.viral_patterns : [];
          const pct = Math.round((n.total_analises / maxAnalises) * 100);

          return (
            <Card key={n.nicho} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {n.nicho}
                  </CardTitle>
                  <Badge variant="secondary">{n.total_analises} análises</Badge>
                </div>
                <div className="mt-2">
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Volume relativo: {pct}%
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Averages grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Score</div>
                    <div className="text-lg font-semibold">{fmt(n.avg_score_geral)}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Hook</div>
                    <div className="text-lg font-semibold">{fmt(n.avg_hook_strength)}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Engajamento</div>
                    <div className="text-lg font-semibold">{fmt(n.avg_engagement)}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Viral</div>
                    <div className="text-lg font-semibold">{fmt(n.avg_viral_score)}</div>
                  </div>
                </div>

                {/* Top problemas */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Top problemas
                  </div>
                  {problemas.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
                  ) : (
                    <ul className="space-y-1">
                      {problemas.map((p, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                          <span className="flex-1">{p.problema}</span>
                          <Badge variant="outline" className="shrink-0">{p.count}x</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Top soluções */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Top soluções
                  </div>
                  {solucoes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
                  ) : (
                    <ul className="space-y-1">
                      {solucoes.map((s, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                          <span className="flex-1">{s.solucao}</span>
                          <Badge variant="outline" className="shrink-0">{s.count}x</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Viral patterns */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Padrões virais
                  </div>
                  {patterns.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Aguardando coleta do niche-research-agent.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {patterns.slice(0, 5).map((vp: any, i: number) => (
                        <li key={i} className="rounded-md bg-muted/30 px-2 py-1">
                          {typeof vp === "string"
                            ? vp
                            : vp.pattern ?? vp.title ?? vp.description ?? JSON.stringify(vp)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NichoIntelligence;
