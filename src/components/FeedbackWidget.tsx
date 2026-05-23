import { useState } from "react";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

type FeedbackType = "bug" | "suggestion";

// Detect language: app i18n → browser → fallback 'en'
function detectLang(appLang?: string): "pt" | "en" {
  const src = (appLang || (typeof navigator !== "undefined" ? navigator.language : "") || "").toLowerCase();
  if (src.startsWith("pt")) return "pt";
  if (src.startsWith("en")) return "en";
  return "en";
}

const COPY = {
  en: {
    trigger: "Feedback",
    title: "Help us improve Viewsup AI",
    description: "Report a bug or suggest an improvement. We read every message.",
    typeLabel: "Type",
    bug: "Report a Bug / Error",
    suggestion: "Suggest an Improvement",
    placeholder: "Describe the issue or your suggestion in detail...",
    send: "Send Feedback",
    sending: "Sending...",
    success: "Thank you! Your feedback has been sent successfully.",
    error: "Could not send feedback. Please try again.",
    tooShort: "Please write a bit more detail.",
    cancel: "Cancel",
  },
  pt: {
    trigger: "Feedback",
    title: "Ajude-nos a melhorar a Viewsup AI",
    description: "Reporte um erro ou sugira uma melhoria. Lemos todas as mensagens.",
    typeLabel: "Tipo",
    bug: "Reportar Erro / Bug",
    suggestion: "Sugerir uma Melhoria",
    placeholder: "Descreva em detalhes o erro ou a sua sugestão...",
    send: "Enviar Feedback",
    sending: "Enviando...",
    success: "Obrigado! Seu feedback foi enviado com sucesso.",
    error: "Não foi possível enviar o feedback. Tente novamente.",
    tooShort: "Por favor, escreva um pouco mais de detalhe.",
    cancel: "Cancelar",
  },
};

export const FeedbackWidget = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const code = detectLang(lang);
  const t = COPY[code];

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast.error(t.tooShort);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("user_feedbacks").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      type,
      message: trimmed,
      language: code,
      page_url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t.error);
      return;
    }
    toast.success(t.success);
    setMessage("");
    setType("bug");
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="fixed bottom-5 right-5 z-50 gradient-bg text-primary-foreground shadow-lg rounded-full h-12 px-4 gap-2"
        aria-label={t.trigger}
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">{t.trigger}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription>{t.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fb-type">{t.typeLabel}</Label>
              <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                <SelectTrigger id="fb-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">{t.bug}</SelectItem>
                  <SelectItem value="suggestion">{t.suggestion}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholder}
              rows={6}
              maxLength={5000}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              {t.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gradient-bg text-primary-foreground">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.sending}</> : t.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackWidget;
