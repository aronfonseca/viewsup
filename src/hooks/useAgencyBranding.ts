import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyBranding {
  enabled: boolean;
  agency_name: string | null;
  agency_logo_url: string | null;
  agency_primary_color: string | null;
  agency_website: string | null;
  plan: string;
}

const EMPTY: AgencyBranding = {
  enabled: false,
  agency_name: null,
  agency_logo_url: null,
  agency_primary_color: null,
  agency_website: null,
  plan: "free",
};

/**
 * Fetches the current user's agency white-label settings.
 * `enabled` is true only when the user is on the `agency` plan
 * AND has set up at least an agency name or logo.
 */
export function useAgencyBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<AgencyBranding>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) { setBranding(EMPTY); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("plan, agency_name, agency_logo_url, agency_primary_color, agency_website")
      .eq("user_id", user.id)
      .single();
    if (data) {
      const p = data as any;
      const isAgency = p.plan === "agency";
      setBranding({
        enabled: isAgency && Boolean(p.agency_name || p.agency_logo_url),
        agency_name: p.agency_name ?? null,
        agency_logo_url: p.agency_logo_url ?? null,
        agency_primary_color: p.agency_primary_color ?? null,
        agency_website: p.agency_website ?? null,
        plan: p.plan ?? "free",
      });
    }
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [user?.id]);

  return { branding, loading, refresh };
}
