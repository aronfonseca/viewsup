import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ViewsupLogo } from "@/components/ViewsupLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LanguageSelector from "@/components/LanguageSelector";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, LogOut, Search, Clock, ExternalLink, User,
  Video, CheckCircle2, AlertTriangle, Loader2, FlaskConical, Zap, Crown, Palette, RefreshCw,
} from "lucide-react";
import AgencyReportPreview from "@/components/AgencyReportPreview";
import { PageHelmet } from "@/components/PageHelmet";
import { useAgencyBranding } from "@/hooks/useAgencyBranding";

interface Report {
  id: string;
  username: string;
  profile_url: string;
  language: string;
  created_at: string;
  profile_pic_url: string | null;
}

interface VideoJobRow {
  id: string;
  file_name: string;
  file_size: number | null;
  status: string;
  created_at: string;
  result_data: { verdict?: string } | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [url, setUrl] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [videoJobs, setVideoJobs] = useState<VideoJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [plan, setPlan] = useState<string>("free");
  const [analysesRemaining, setAnalysesRemaining] = useState<number>(0);
  const [analysesLimit, setAnalysesLimit] = useState<number>(0);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { branding } = useAgencyBranding();
  const isPt = lang === "pt-BR";

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({
        title: isPt ? "🎉 Bem-vindo a bordo!" : "🎉 Welcome aboard!",
        description: isPt ? "Sua assinatura está ativa. Aproveite suas análises!" : "Your subscription is active. Enjoy your analyses!",
      });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isPt]);

  useEffect(() => {
    const fetchData = async () => {
      // On-demand check: downgrade if grace period expired
      try {
        await supabase.functions.invoke("downgrade-expired", { body: { userId: user!.id } });
      } catch { /* ignore */ }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, plan, analyses_remaining, analyses_limit, period_end")
        .eq("user_id", user!.id)
        .single();
      if (profile) {
        setDisplayName(profile.display_name || user!.email || "");
        setPlan((profile as any).plan || "free");
        setAnalysesRemaining((profile as any).analyses_remaining ?? 0);
        setAnalysesLimit((profile as any).analyses_limit ?? 0);
        setPeriodEnd((profile as any).period_end ?? null);
      }

      // Fetch latest subscription for status / portal access
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, cancel_at_period_end, current_period_end")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub) {
        setSubStatus((sub as any).status);
        setCancelAtPeriodEnd(!!(sub as any).cancel_at_period_end);
      }

      const [reportsRes, videosRes] = await Promise.all([
        supabase
          .from("reports")
          .select("id, username, profile_url, language, created_at, profile_pic_url")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("video_jobs")
          .select("id, file_name, file_size, status, created_at, result_data")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (reportsRes.data) setReports(reportsRes.data);
      if (videosRes.data) setVideoJobs(videosRes.data as unknown as VideoJobRow[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const limitReached = analysesRemaining <= 0;
  const hasPaidPlan = plan !== "free";
  const isPastDue = subStatus === "past_due";

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      navigate("/pricing");
      return;
    }
    if (!url.trim()) return;
    navigate(`/results?url=${encodeURIComponent(url.trim())}`);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { environment: (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string)?.startsWith("test_") ? "sandbox" : "live" },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open portal");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({
        title: isPt ? "Erro" : "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title={isPt ? "Painel | Viewsup AI" : "Dashboard | Viewsup AI"}
        description={isPt ? "Seu painel Viewsup AI. Execute auditorias de perfil Instagram, visualize relatórios e gerencie sua assinatura." : "Your Viewsup AI dashboard. Run Instagram profile audits, view reports, and manage your subscription."}
        path="/dashboard"
      />
      <PaymentTestModeBanner />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ViewsupLogo size={28} />
            <span className="font-bold text-foreground">{t("appName")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              {t("authLogout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome + New Analysis */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("dashWelcome")}, {displayName.split("@")[0]}! 👋
          </h1>
          <p className="text-muted-foreground">{t("dashSubtitle")}</p>
        </div>

        {/* Past-due banner */}
        {isPastDue && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {isPt ? "Pagamento pendente" : "Payment past due"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPt
                      ? "O último pagamento da sua assinatura falhou. Atualize seu método de pagamento para manter o acesso."
                      : "Your latest subscription payment failed. Update your payment method to keep access."}
                  </p>
                </div>
              </div>
              <Button onClick={handleManageSubscription} disabled={portalLoading} className="gradient-bg text-primary-foreground">
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isPt ? "Atualizar pagamento" : "Update payment")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cancel-at-period-end notice */}
        {cancelAtPeriodEnd && periodEnd && (
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="py-3 text-sm text-foreground">
              {isPt
                ? `Sua assinatura será cancelada em ${new Date(periodEnd).toLocaleDateString("pt-BR")}. Você mantém acesso até lá.`
                : `Your subscription will end on ${new Date(periodEnd).toLocaleDateString("en-GB")}. You keep access until then.`}
            </CardContent>
          </Card>
        )}

        {/* Plan + analyses counter */}
        <Card className={`border ${limitReached ? "border-destructive/40 bg-destructive/5" : "border-primary/20 bg-card"}`}>
          <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                {plan === "agency" ? (
                  <Crown className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Zap className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("dashCurrentPlan")}</p>
                <p className="font-semibold text-foreground capitalize">
                  {plan === "free" ? t("dashPlanFree") : plan}
                  {" · "}
                  {plan === "agency"
                    ? t("dashUnlimitedAnalyses")
                    : `${analysesRemaining}/${analysesLimit} ${t("dashAnalysesRemaining")}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPaidPlan && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isPt ? "Gerenciar assinatura" : "Manage subscription")}
                </Button>
              )}
              <Button
                variant={limitReached ? "default" : "outline"}
                size="sm"
                className={limitReached ? "gradient-bg text-primary-foreground" : ""}
                onClick={() => navigate("/pricing")}
              >
                {plan === "agency" ? t("dashManagePlan") : limitReached ? t("dashUpgrade") : t("dashViewPlans")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agency white-label preview (Agency plan only) */}
        {plan === "agency" && (
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                    <Palette className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("agencyWhiteLabel")}</p>
                    <p className="text-sm text-muted-foreground">
                      {branding.enabled
                        ? t("agencyWhiteLabelEnabled")
                        : t("agencyWhiteLabelDesc")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/settings/agency")}>
                  {branding.enabled ? t("agencyEditBrand") : t("agencyConfigureNow")}
                </Button>
              </div>
              <div className="max-w-md">
                <AgencyReportPreview
                  agencyName={branding.agency_name || t("agencyDefaultName")}
                  agencyLogoUrl={branding.agency_logo_url}
                  primaryColor={branding.agency_primary_color || "#7c3aed"}
                  website={branding.agency_website || undefined}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            {limitReached ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{t("dashLimitReachedTitle")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashLimitReachedDesc")}
                    </p>
                  </div>
                </div>
                <Button
                  className="gradient-bg text-primary-foreground"
                  onClick={() => navigate("/pricing")}
                >
                  {t("dashUpgrade")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAnalyze} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("placeholder")}
                    className="pl-10"
                    aria-label={isPt ? "Link do perfil Instagram" : "Instagram profile link"}
                  />
                </div>
                <Button type="submit" className="gradient-bg text-primary-foreground">
                  {t("analyzeBtn")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Reports History */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("dashHistory")}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{t("dashNoReports")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {reports.map((r) => (
                <Card
                  key={r.id}
                  className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/results?reportId=${encodeURIComponent(r.id)}`)}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        {r.profile_pic_url && (
                          <AvatarImage
                            src={r.profile_pic_url}
                            alt={`@${r.username} profile`}
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="gradient-bg text-primary-foreground font-bold">
                          {r.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">@{r.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()} · {r.language}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title={isPt ? "Forçar nova análise" : "Force new analysis"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (limitReached) { navigate("/pricing"); return; }
                          navigate(`/results?url=${encodeURIComponent(r.profile_url)}&force=1`);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {isPt ? "Nova análise" : "New analysis"}
                      </Button>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Video Analyses History */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            {t("dashVideoHistory")}
          </h2>

          {loading ? null : videoJobs.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-10 text-center">
                <Video className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">{t("dashVideoHistoryEmpty")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {videoJobs.map((v) => {
                const verdict = v.result_data?.verdict;
                const isCompleted = v.status === "completed";
                const isFailed = v.status === "failed";
                return (
                  <Card key={v.id} className="border-border bg-card">
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          {isCompleted ? (
                            verdict === "PRONTO_PARA_POSTAR"
                              ? <CheckCircle2 className="h-5 w-5 text-success" />
                              : <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : isFailed ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{v.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(v.created_at).toLocaleString()}
                            {v.file_size && ` · ${(v.file_size / 1024 / 1024).toFixed(1)} MB`}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        isCompleted ? "bg-success/15 text-success" :
                        isFailed ? "bg-destructive/15 text-destructive" :
                        v.status === "processing" ? "bg-warning/15 text-warning" :
                        "bg-warning/15 text-warning"
                      }`}>
                        {isCompleted ? t("retLabStatusCompleted") :
                         isFailed ? t("retLabStatusFailed") :
                         v.status === "processing" ? t("retLabStatusProcessing") :
                         t("retLabStatusPending")}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
