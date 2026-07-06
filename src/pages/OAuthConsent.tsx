import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHelmet } from "@/components/PageHelmet";
import { Sparkles } from "lucide-react";

// The Supabase auth SDK's oauth namespace is beta and not in the generated types.
// Use a narrow local typed wrapper to keep TS happy.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?redirect=${encodeURIComponent(next)}`;
        return;
      }
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load authorization request");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setError(e?.message ?? "Failed to complete authorization");
      setBusy(false);
    }
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an app";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <PageHelmet title="Authorize app | Viewsup AI" path="/.lovable/oauth/consent" />
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-xl gradient-bg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Connect {clientName}</CardTitle>
          <CardDescription>
            {details
              ? `${clientName} is requesting access to your Viewsup AI account. You can approve or deny below.`
              : error
                ? "Could not load this authorization request."
                : "Loading authorization request…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {details && (
            <>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                <p>Once connected, {clientName} will be able to read your Viewsup AI analysis reports on your behalf.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                  Deny
                </Button>
                <Button className="flex-1 gradient-bg text-primary-foreground" disabled={busy} onClick={() => decide(true)}>
                  {busy ? "Working…" : "Approve"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
