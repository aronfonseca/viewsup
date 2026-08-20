import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Check, X, Sparkles } from "lucide-react";

interface SeedSuggestion {
  id: string;
  nicho: string;
  username: string;
  status: string;
  suggested_by: string;
  reasoning: string | null;
  source: string | null;
  created_at: string;
}

const SeedAccountReview = () => {
  const [suggestions, setSuggestions] = useState<SeedSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("nicho-seed-review", {
      body: { action: "list" },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Erro ao carregar sugestões", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    setSuggestions(data.suggestions ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    const { data, error } = await supabase.functions.invoke("nicho-seed-review", {
      body: { action, id },
    });
    setBusyId(null);
    if (error || data?.error) {
      toast({ title: "Erro", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    toast({ title: action === "approve" ? "Conta aprovada" : "Conta rejeitada" });
    setSuggestions((s) => s.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Nenhuma sugestão pendente no momento.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <Card key={s.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                @{s.username}
                <Badge variant="secondary" className="ml-1">{s.nicho}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  disabled={busyId === s.id}
                  onClick={() => review(s.id, "approve")}
                >
                  <Check className="h-3.5 w-3.5 text-success" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  disabled={busyId === s.id}
                  onClick={() => review(s.id, "reject")}
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
            {s.reasoning && <p>{s.reasoning}</p>}
            {s.source && <p className="italic">Fonte: {s.source}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SeedAccountReview;
