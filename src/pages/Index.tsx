import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, BarChart3, Lightbulb, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSelector from "@/components/LanguageSelector";

const Index = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();

  // Redirect logged-in users straight to their dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const target = `/results?url=${encodeURIComponent(url.trim())}`;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  const isPt = lang === "pt-BR";
  const loginLabel = isPt ? "Entrar" : "Sign In";
  const signupLabel = isPt ? "Criar conta" : "Sign Up";
  const dashboardLabel = isPt ? "Meu painel" : "Dashboard";
  const pricingLabel = isPt ? "Planos" : "Pricing";

  const features = [
    { icon: Search, title: t("feat1Title"), desc: t("feat1Desc") },
    { icon: BarChart3, title: t("feat2Title"), desc: t("feat2Desc") },
    { icon: Lightbulb, title: t("feat3Title"), desc: t("feat3Desc") },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {user ? (
            <Button size="sm" onClick={() => navigate("/dashboard")} className="gradient-bg text-primary-foreground">
              <LayoutDashboard className="h-4 w-4 mr-1" />
              {dashboardLabel}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                <LogIn className="h-4 w-4 mr-1" />
                {loginLabel}
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=signup")} className="gradient-bg text-primary-foreground">
                <UserPlus className="h-4 w-4 mr-1" />
                {signupLabel}
              </Button>
            </>
          )}
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground mb-8">
          <Sparkles className="h-3 w-3 text-primary" />
          {t("heroBadge")}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          {t("heroTitle1")}
          <span className="gradient-text">{t("heroHighlight")}</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-10">{t("heroDesc")}</p>

        <form onSubmit={handleAnalyze} className="w-full max-w-lg flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("placeholder")}
              className="pl-10 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" className="h-12 px-8 gradient-bg font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            {t("analyzeBtn")}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">{t("freeAnalysis")}</p>
      </section>

      {/* Subtle accent glow under hero — no neural network image */}
      <div className="relative z-0 max-w-5xl mx-auto px-6 -mt-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-card border border-border card-shadow hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-lg gradient-bg flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 text-xs text-muted-foreground border-t border-border">
        {t("footer")}
      </footer>
    </div>
  );
};

export default Index;
