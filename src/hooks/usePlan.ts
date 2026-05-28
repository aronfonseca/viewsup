import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type Plan = "free" | "starter" | "pro" | "agency";

const ORDER: Record<Plan, number> = { free: 0, starter: 1, pro: 2, agency: 3 };

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setPlan("free"); setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const p = ((data as any)?.plan as Plan) || "free";
      setPlan(["free","starter","pro","agency"].includes(p) ? p : "free");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const hasAtLeast = (min: Plan) => ORDER[plan] >= ORDER[min];

  return {
    plan,
    loading,
    isFree: plan === "free",
    isStarter: plan === "starter",
    isPro: plan === "pro",
    isAgency: plan === "agency",
    canUseRetentionLab: hasAtLeast("pro"),
    canExportPdf: hasAtLeast("pro"),
    canSeeFullHistory: hasAtLeast("starter"),
    canUseWhiteLabel: plan === "agency",
    hasAtLeast,
  };
}
