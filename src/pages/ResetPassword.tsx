import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Lock } from "lucide-react";
import { PageHelmet } from "@/components/PageHelmet";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const { toast } = useToast();
  const isPt = lang === "pt-BR";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auth puts type=recovery in the URL hash. The client will
    // automatically establish a recovery session.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
    } else {
      // Also accept already-established session as recovery context
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: isPt ? "Senha atualizada" : "Password updated",
        description: isPt ? "Faça login com a nova senha." : "Sign in with your new password.",
      });
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({
        title: isPt ? "Erro" : "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card/80">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {isPt ? "Link inválido ou expirado." : "Invalid or expired link."}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/auth")}>
              {isPt ? "Voltar" : "Back"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <PageHelmet
        title={isPt ? "Redefinir Senha | Viewsup AI" : "Reset Password | Viewsup AI"}
        path="/reset-password"
      />
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-xl gradient-bg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isPt ? "Nova senha" : "New password"}
          </CardTitle>
          <CardDescription>
            {isPt ? "Escolha uma nova senha para sua conta." : "Choose a new password for your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{isPt ? "Nova senha" : "New password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-bg text-primary-foreground" disabled={loading}>
              {loading ? "..." : (isPt ? "Salvar" : "Save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
