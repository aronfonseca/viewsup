import { useEffect, useState } from "react";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

type CalendarStatus = "planejado" | "gravando" | "editando" | "postado";

interface CalendarItem {
  id: string;
  title: string;
  format: string | null;
  best_day: string | null;
  best_time: string | null;
  status: CalendarStatus;
}

interface ContentCalendarProps {
  username: string;
  readOnly?: boolean;
}

const STATUS_ORDER: CalendarStatus[] = ["planejado", "gravando", "editando", "postado"];

const STATUS_LABEL: Record<string, Record<CalendarStatus, string>> = {
  "pt-BR": { planejado: "Planejado", gravando: "Gravando", editando: "Editando", postado: "Postado" },
  "en-GB": { planejado: "Planned", gravando: "Recording", editando: "Editing", postado: "Posted" },
};

const STATUS_DOT: Record<CalendarStatus, string> = {
  planejado: "bg-muted-foreground",
  gravando: "bg-warning",
  editando: "bg-primary",
  postado: "bg-success",
};

const ContentCalendar = ({ username, readOnly }: ContentCalendarProps) => {
  const { lang } = useI18n();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(!readOnly);
  const [userId, setUserId] = useState<string | null>(null);
  const labels = STATUS_LABEL[lang] ?? STATUS_LABEL["pt-BR"];

  useEffect(() => {
    if (readOnly) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("content_calendar_items")
        .select("id, title, format, best_day, best_time, status")
        .eq("user_id", user.id)
        .eq("username", username)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setItems((data ?? []) as CalendarItem[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [username, readOnly]);

  const advance = async (item: CalendarItem) => {
    const idx = STATUS_ORDER.indexOf(item.status);
    if (idx === -1 || idx === STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[idx + 1];
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    if (!userId) return;
    await supabase
      .from("content_calendar_items")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", item.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (readOnly || items.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground text-sm">
          {readOnly
            ? (lang === "pt-BR" ? "Disponível após uma análise real do perfil." : "Available after a real profile analysis.")
            : (lang === "pt-BR" ? "Nenhuma ideia de vídeo ainda — rode a análise pra popular o calendário." : "No video ideas yet — run the analysis to populate the calendar.")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        {lang === "pt-BR" ? "Calendário de Conteúdo" : "Content Calendar"}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {lang === "pt-BR" ? "Clique num card pra avançar o status de produção." : "Click a card to advance its production status."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_ORDER.map((status) => {
          const colItems = items.filter((i) => i.status === status);
          return (
            <div key={status} className="rounded-xl bg-secondary/40 border border-border p-3 min-h-[140px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                <span className="text-xs font-semibold text-foreground">{labels[status]}</span>
                <span className="text-xs text-muted-foreground ml-auto">{colItems.length}</span>
              </div>
              <div className="space-y-2">
                {colItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => advance(item)}
                    disabled={status === "postado"}
                    className="w-full text-left rounded-lg bg-card border border-border p-2.5 hover:border-primary/40 transition-colors disabled:cursor-default disabled:hover:border-border"
                  >
                    {item.format && (
                      <Badge variant="outline" className="text-[10px] mb-1.5">{item.format}</Badge>
                    )}
                    <p className="text-xs text-foreground leading-snug mb-2">{item.title}</p>
                    {(item.best_day || item.best_time) && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {[item.best_day, item.best_time].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentCalendar;
