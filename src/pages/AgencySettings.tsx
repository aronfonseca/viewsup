import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Image as ImageIcon, Loader2, Sparkles, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import LanguageSelector from "@/components/LanguageSelector";
import { toast } from "@/hooks/use-toast";
import AgencyReportPreview from "@/components/AgencyReportPreview";
import { PageHelmet } from "@/components/PageHelmet";

const DEFAULT_COLOR = "#7c3aed";

const AgencySettings = () => {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const isPt = lang === "pt-BR";
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [plan, setPlan] = useState<string>("free");
  const [agencyName, setAgencyName] = useState("");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_COLOR);
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan, agency_name, agency_logo_url, agency_primary_color, agency_website")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const p = data as any;
        setPlan(p.plan ?? "free");
        setAgencyName(p.agency_name ?? "");
        setAgencyLogoUrl(p.agency_logo_url ?? null);
        setPrimaryColor(p.agency_primary_color ?? DEFAULT_COLOR);
        setWebsite(p.agency_website ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const isAgency = plan === "agency";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Erro", description: isPt ? "Logo deve ter até 2MB" : "Logo must be under 2MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("agency-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("agency-logos").getPublicUrl(path);
      setAgencyLogoUrl(pub.publicUrl);
      toast({ title: "✓", description: isPt ? "Logo carregada" : "Logo uploaded" });
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        agency_name: agencyName.trim() || null,
        agency_logo_url: agencyLogoUrl,
        agency_primary_color: primaryColor || null,
        agency_website: website.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✓", description: isPt ? "Configurações salvas" : "Settings saved" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title={isPt ? "Configurações da Agência | Viewsup AI" : "Agency Settings | Viewsup AI"}
        path="/settings/agency"
      />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">{t("appName")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {isPt ? "Voltar" : "Back"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isPt ? "White-Label da Agência" : "Agency White-Label"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isPt
                ? "Personalize os relatórios entregues aos seus clientes com sua própria marca."
                : "Customize reports delivered to your clients with your own brand."}
            </p>
          </div>
        </div>

        {!isAgency && (
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="py-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <p className="text-sm text-foreground">
                {isPt
                  ? "O white-label é exclusivo para o plano Agency. Faça upgrade para liberar."
                  : "White-label is exclusive to the Agency plan. Upgrade to unlock."}
              </p>
              <Button className="gradient-bg text-primary-foreground" onClick={() => navigate("/pricing")}>
                {isPt ? "Ver planos" : "See plans"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="agency-name">{isPt ? "Nome da agência" : "Agency name"}</Label>
                <Input
                  id="agency-name"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder={isPt ? "Ex: Acme Marketing" : "E.g. Acme Marketing"}
                  disabled={!isAgency}
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label>{isPt ? "Logo da agência" : "Agency logo"}</Label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-lg border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {agencyLogoUrl ? (
                      <img src={agencyLogoUrl} alt="Agency logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isAgency || uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isPt ? "Carregar logo" : "Upload logo"}
                  </Button>
                  {agencyLogoUrl && (
                    <Button type="button" variant="ghost" size="sm" disabled={!isAgency} onClick={() => setAgencyLogoUrl(null)}>
                      {isPt ? "Remover" : "Remove"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG/SVG, max 2MB</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-color">{isPt ? "Cor primária" : "Primary color"}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={!isAgency}
                    className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer disabled:opacity-50"
                  />
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#7c3aed"
                    disabled={!isAgency}
                    className="font-mono w-40"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency-website">{isPt ? "Site da agência (opcional)" : "Agency website (optional)"}</Label>
                <Input
                  id="agency-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.com"
                  disabled={!isAgency}
                  maxLength={200}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!isAgency || saving}
                className="gradient-bg text-primary-foreground w-full"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isPt ? "Salvar configurações" : "Save settings"}
              </Button>
            </CardContent>
          </Card>

          {/* Live preview */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {isPt ? "Prévia do relatório" : "Report preview"}
            </h2>
            <AgencyReportPreview
              agencyName={agencyName || "Sua Agência"}
              agencyLogoUrl={agencyLogoUrl}
              primaryColor={primaryColor}
              website={website}
            />
            <p className="text-xs text-muted-foreground">
              {isPt
                ? "É assim que seus clientes verão o cabeçalho do relatório PDF."
                : "This is how your clients will see the PDF report header."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgencySettings;
