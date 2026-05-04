import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LanguageSelector from "@/components/LanguageSelector";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, LogOut, Search, Clock, ExternalLink, User,
  Video, CheckCircle2, AlertTriangle, Loader2, FlaskConical, Zap, Crown, Palette,
} from "lucide-react";
import AgencyReportPreview from "@/components/AgencyReportPreview";
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
  const { t } = useI18n();
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
  const { branding } = useAgencyBranding();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({
        title: "🎉 Bem-vindo a bordo!",
        description: "Sua assinatura está ativa. Aproveite suas análises!",
      });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, plan, analyses_remaining, analyses_limit")
        .eq("user_id", user!.id)
        .single();
      if (profile) {
        setDisplayName(profile.display_name || user!.email || "");
        setPlan((profile as any).plan || "free");
        setAnalysesRemaining((profile as any).analyses_remaining ?? 0);
        setAnalysesLimit((profile as any).analyses_limit ?? 0);
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

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      navigate("/pricing");
      return;
    }
    if (!url.trim()) return;
    navigate(`/results?url=${encodeURIComponent(url.trim())}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
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
            <Button
              variant={limitReached ? "default" : "outline"}
              size="sm"
              className={limitReached ? "gradient-bg text-primary-foreground" : ""}
              onClick={() => navigate("/pricing")}
            >
              {plan === "agency" ? t("dashManagePlan") : limitReached ? t("dashUpgrade") : t("dashViewPlans")}
            </Button>
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
                    <p className="font-semibold text-foreground">White-Label da Agência</p>
                    <p className="text-sm text-muted-foreground">
                      {branding.enabled
                        ? "Seus relatórios PDF serão entregues com sua marca."
                        : "Configure sua marca para entregar relatórios personalizados aos clientes."}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/settings/agency")}>
                  {branding.enabled ? "Editar marca" : "Configurar agora"}
                </Button>
              </div>
              <div className="max-w-md">
                <AgencyReportPreview
                  agencyName={branding.agency_name || "Sua Agência"}
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
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("placeholder")}
                    className="pl-10"
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
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
