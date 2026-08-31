import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, CheckCircle2, XCircle } from "lucide-react";

interface PillarScanRow {
  id: string;
  username: string;
  nicho: string | null;
  pilares_distintos: number | null;
  pilar_dominante: string | null;
  pilar_dominante_pct: number | null;
  consistencia_visual: "alta" | "media" | "baixa" | null;
  dados_performance_disponiveis: boolean | null;
  scan_error: string | null;
}

interface PillarScanBatch {
  id: string;
  requested_count: number;
  niches: string[] | null;
  status: "running" | "completed";
  created_at: string;
}

const VISUAL_LABEL: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
const VISUAL_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  alta: "success",
  media: "warning",
  baixa: "destructive",
};

const PillarScanPanel = () => {
  const [batch, setBatch] = useState<PillarScanBatch | null>(null);
  const [scans, setScans] = useState<PillarScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLatest = async (batchId?: string) => {
    const { data, error } = await supabase.functions.invoke("pillar-scan-agent", {
      body: batchId ? { action: "list", batchId } : { action: "list" },
    });
    if (error || data?.error) {
      toast({ title: "Erro ao carregar scan", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    setBatch(data.batch ?? null);
    setScans(data.scans ?? []);
    if (data.batch?.status === "completed" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    (async () => {
      await loadLatest();
      setLoading(false);
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const runScan = async () => {
    setTriggering(true);
    const { data, error } = await supabase.functions.invoke("pillar-scan-agent", {
      body: { action: "run" },
    });
    setTriggering(false);
    if (error || data?.error) {
      toast({ title: "Erro ao disparar scan", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Scan iniciado", description: `Processando ${data.targetCount} perfis — isso leva alguns minutos.` });
    await loadLatest(data.batchId);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadLatest(data.batchId), 8000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {batch
            ? `Último lote: ${scans.length}/${batch.requested_count} perfis · ${batch.status === "running" ? "processando..." : "concluído"} · ${new Date(batch.created_at).toLocaleString("pt-BR")}`
            : "Nenhum scan rodado ainda."}
        </p>
        <Button onClick={runScan} disabled={triggering || batch?.status === "running"} size="sm">
          {triggering || batch?.status === "running" ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Rodar novo scan (12 perfis)</>
          )}
        </Button>
      </div>

      {scans.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Sem resultados ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Nº de pilares distintos</TableHead>
                <TableHead>Pilar dominante (%)</TableHead>
                <TableHead>Consistência visual</TableHead>
                <TableHead>Dados de performance disponíveis?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    @{s.username}
                    {s.nicho && <Badge variant="outline" className="ml-2">{s.nicho}</Badge>}
                    {s.scan_error && <p className="text-xs text-destructive mt-1">{s.scan_error}</p>}
                  </TableCell>
                  <TableCell>{s.pilares_distintos ?? "—"}</TableCell>
                  <TableCell>
                    {s.pilar_dominante
                      ? `${s.pilar_dominante} (${s.pilar_dominante_pct != null ? Math.round(s.pilar_dominante_pct) : "?"}%)`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {s.consistencia_visual ? (
                      <Badge variant={VISUAL_VARIANT[s.consistencia_visual]}>{VISUAL_LABEL[s.consistencia_visual]}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {s.dados_performance_disponiveis == null ? "—" : s.dados_performance_disponiveis ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PillarScanPanel;
