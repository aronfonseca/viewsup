import { useEffect, useState } from "react";
import { Target, Pencil, Check, X, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionCard, Callout, IconBadge } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { scoreTextClass } from "@/lib/scoreColor";
import type { ObjectiveAlignment } from "@/lib/mockAnalysis";

interface ProfileObjectiveProps {
  username: string;
  alignment?: ObjectiveAlignment;
  /** Demo/report-only views (no logged-in user, e.g. shared reportId) can't save — read-only in that case. */
  readOnly?: boolean;
}

const ProfileObjective = ({ username, alignment, readOnly }: ProfileObjectiveProps) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(!readOnly);
  const [saving, setSaving] = useState(false);
  const [objective, setObjective] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (readOnly) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("profile_objectives")
        .select("objective_text")
        .eq("user_id", user.id)
        .eq("username", username)
        .maybeSingle();
      if (!cancelled) {
        setObjective(data?.objective_text ?? null);
        setDraft(data?.objective_text ?? "");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [username, readOnly]);

  // Read-only views (e.g. /demo) have no logged-in user to query profile_objectives
  // for, so fall back to the objective already embedded in the analysis payload.
  const displayedObjective = readOnly ? (alignment?.objectiveSummary || null) : objective;

  const save = async () => {
    if (!userId || !draft.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profile_objectives")
      .upsert(
        { user_id: userId, username, objective_text: draft.trim(), updated_at: new Date().toISOString() },
        { onConflict: "user_id,username" },
      );
    setSaving(false);
    if (error) {
      toast({ title: t("profileObjectiveSaveError"), description: error.message, variant: "destructive" });
      return;
    }
    setObjective(draft.trim());
    setEditing(false);
    toast({ title: t("profileObjectiveSaved") });
  };

  if (loading) return null;

  return (
    <SectionCard padding="xl" accentColor="primary" className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">{t("profileObjectiveTitle")}</h2>
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("profileObjectivePlaceholder")}
            rows={4}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !draft.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {t("profileObjectiveSave")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(objective ?? ""); }}>
              <X className="h-4 w-4 mr-2" />
              {t("profileObjectiveCancel")}
            </Button>
          </div>
        </div>
      ) : displayedObjective ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-foreground flex-1">{displayedObjective}</p>
            {!readOnly && (
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {t("profileObjectiveEdit")}
              </Button>
            )}
          </div>

          {alignment?.hasStatedObjective ? (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-3">
                <IconBadge tone="primary" icon={TrendingUp} size="lg" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("profileObjectiveAlignmentTitle")}</p>
                  <span className={`text-2xl font-bold ${scoreTextClass(alignment.alignmentScore)}`}>{alignment.alignmentScore}</span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
              </div>
              {alignment.diagnosis && (
                <Callout tone="primary"><p>{alignment.diagnosis}</p></Callout>
              )}
              {alignment.gapAreas.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("profileObjectiveGapAreas")}</p>
                  <ul className="space-y-1.5">
                    {alignment.gapAreas.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {alignment.recommendedNextSteps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("profileObjectiveNextSteps")}</p>
                  <ul className="space-y-1.5">
                    {alignment.recommendedNextSteps.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <IconBadge tone="primary" size="sm" label={i + 1} />
                        <span className="pt-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : !readOnly && (
            <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">{t("profileObjectiveNoAlignmentYet")}</p>
          )}
        </div>
      ) : !readOnly ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("profileObjectiveEmptyPrompt")}</p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("profileObjectivePlaceholder")}
            rows={4}
            className="text-sm"
          />
          <Button size="sm" onClick={save} disabled={saving || !draft.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {t("profileObjectiveSave")}
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
};

export default ProfileObjective;
