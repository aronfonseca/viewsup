import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = "aronfonseca2020@gmail.com";

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  plan: string;
  analyses_remaining: number;
  analyses_limit: number;
  created_at: string;
}

const Admin = () => {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, number>>({});

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    setBusy(false);
    if (error || data?.error) {
      toast({ title: "Erro ao carregar", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;

  const updatePlan = async (user_id: string, plan: string) => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "update_plan", user_id, plan },
    });
    if (error || data?.error) {
      toast({ title: "Erro", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Plano atualizado" });
    load();
  };

  const updateAnalyses = async (user_id: string) => {
    const value = edits[user_id];
    if (typeof value !== "number" || isNaN(value)) return;
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "update_analyses", user_id, analyses_remaining: value },
    });
    if (error || data?.error) {
      toast({ title: "Erro", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Análises atualizadas" });
    setEdits((e) => { const n = { ...e }; delete n[user_id]; return n; });
    load();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin · Usuários</h1>
          <Button variant="outline" onClick={load} disabled={busy}>
            {busy ? <Loader2 className="animate-spin h-4 w-4" /> : "Recarregar"}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>{users.length} usuário(s)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Análises</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell>{u.display_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.plan} onValueChange={(v) => updatePlan(u.user_id, v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          className="w-24"
                          value={edits[u.user_id] ?? u.analyses_remaining}
                          onChange={(e) => setEdits((s) => ({ ...s, [u.user_id]: Number(e.target.value) }))}
                        />
                        <span className="text-xs text-muted-foreground">/ {u.analyses_limit}</span>
                        <Button size="sm" onClick={() => updateAnalyses(u.user_id)} disabled={edits[u.user_id] === undefined}>
                          Salvar
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
