import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * OAuth callback handler.
 *
 * Supabase returns OAuth tokens in the URL hash (#access_token=...) by default
 * and the JS client picks them up automatically via detectSessionInUrl. We just
 * wait briefly for the session to land, then redirect to the dashboard.
 *
 * If a `?next=` query param is present we honour it, otherwise default to /dashboard.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const finish = (path: string) => {
      if (mounted) navigate(path, { replace: true });
    };

    const url = new URL(window.location.href);
    const next = url.searchParams.get("next") || "/dashboard";
    const errorDesc = url.searchParams.get("error_description") || url.hash.match(/error_description=([^&]+)/)?.[1];

    if (errorDesc) {
      console.error("[auth/callback] OAuth error:", decodeURIComponent(errorDesc));
      finish(`/auth?error=${encodeURIComponent(decodeURIComponent(errorDesc))}`);
      return;
    }

    // Give supabase-js a moment to parse the hash and persist the session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        finish(next);
      } else {
        // Wait once for onAuthStateChange (token may still be settling).
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
          if (session) {
            sub.subscription.unsubscribe();
            finish(next);
          }
        });
        setTimeout(() => {
          sub.subscription.unsubscribe();
          // Still no session — bounce back to /auth
          supabase.auth.getSession().then(({ data: d }) => {
            finish(d.session ? next : "/auth");
          });
        }, 4000);
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full gradient-bg animate-spin opacity-40" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
