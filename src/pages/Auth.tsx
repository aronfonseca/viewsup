import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import { PageHelmet } from "@/components/PageHelmet";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const initialMode = searchParams.get("mode") === "signup" ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const isPt = lang === "pt-BR";

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate(redirectTo, { replace: true });
      } else {
        await signUp(email, password, displayName);
        toast({
          title: t("authCheckEmail"),
          description: t("authConfirmEmail"),
        });
      }
    } catch (err: any) {
      toast({ title: t("authError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      // Direct Supabase OAuth — works on any host (including Vercel deployments).
      // The /auth/callback route picks up the session and redirects onward.
      const next = encodeURIComponent(redirectTo);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });
      if (error) {
        toast({ title: t("authError"), description: error.message, variant: "destructive" });
        setLoading(false);
      }
      // On success the browser navigates to Google — no further work here.
    } catch (err: any) {
      toast({ title: t("authError"), description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: isPt ? "Email enviado" : "Email sent",
        description: isPt
          ? "Verifique sua caixa de entrada para o link de redefinição."
          : "Check your inbox for the reset link.",
      });
      setShowForgot(false);
    } catch (err: any) {
      toast({ title: t("authError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <PageHelmet
        title={isPt ? "Entrar | Viewsup AI" : "Sign In | Viewsup AI"}
        description={isPt ? "Entre ou crie uma conta no Viewsup AI para começar a auditar perfis Instagram com IA." : "Sign in or create an account on Viewsup AI to start auditing Instagram profiles with AI."}
        path="/auth"
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-xl gradient-bg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">
            {showForgot
              ? (isPt ? "Recuperar senha" : "Reset password")
              : (isLogin ? t("authLoginTitle") : t("authSignupTitle"))}
          </h1>
          <CardDescription>
            {showForgot
              ? (isPt ? "Enviaremos um link por email." : "We'll email you a reset link.")
              : (isLogin ? t("authLoginDesc") : t("authSignupDesc"))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgot ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("authEmail")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="pl-10" />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-bg text-primary-foreground" disabled={loading}>
                {loading ? "..." : (isPt ? "Enviar link" : "Send link")}
              </Button>
              <button type="button" onClick={() => setShowForgot(false)} className="text-sm text-primary hover:underline w-full text-center">
                {isPt ? "Voltar ao login" : "Back to login"}
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">{t("authName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("authNamePlaceholder")} className="pl-10" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("authEmail")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("authPassword")}</Label>
                    {isLogin && (
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                        {isPt ? "Esqueci a senha" : "Forgot password?"}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-bg text-primary-foreground" disabled={loading}>
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" /> : (isLogin ? t("authLoginBtn") : t("authSignupBtn"))}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">{isPt ? "ou" : "or"}</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleGoogle}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {isPt ? "Continuar com Google" : "Continue with Google"}
              </Button>

              <div className="mt-6 text-center">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
                  {isLogin ? t("authSwitchToSignup") : t("authSwitchToLogin")}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
