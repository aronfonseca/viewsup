import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LanguageSelector from "@/components/LanguageSelector";
import {
  Sparkles, LogOut, Search, Clock, ExternalLink, User,
  Video, CheckCircle2, AlertTriangle, Loader2, FlaskConical,
} from "lucide-react";

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
  const [url, setUrl] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [videoJobs, setVideoJobs] = useState<VideoJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .single();
      if (profile) setDisplayName(profile.display_name || user!.email || "");

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

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    navigate(`/results?url=${encodeURIComponent(url.trim())}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
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

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
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
                  onClick={() => navigate(`/results?url=${encodeURIComponent(r.profile_url)}`)}
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
