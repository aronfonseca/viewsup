import { useNavigate } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import type { Plan } from "@/hooks/usePlan";

export type UpgradeReason =
  | "analyses_limit"
  | "retention_lab"
  | "pdf_export"
  | "full_history"
  | "white_label"
  | "agency_panel";

const COPY: Record<UpgradeReason, { pt: { title: string; desc: string; target: Plan }; en: { title: string; desc: string; target: Plan } }> = {
  analyses_limit: {
    pt: { title: "Você atingiu seu limite", desc: "Faça upgrade para continuar analisando perfis.", target: "starter" },
    en: { title: "You've reached your limit", desc: "Upgrade to continue analysing profiles.", target: "starter" },
  },
  retention_lab: {
    pt: { title: "Laboratório de Vídeo é Pro", desc: "Disponível nos planos Pro e Agency. Faça upgrade para auditar vídeos antes de postar.", target: "pro" },
    en: { title: "Video Lab is a Pro feature", desc: "Available on Pro and Agency plans. Upgrade to audit videos before posting.", target: "pro" },
  },
  pdf_export: {
    pt: { title: "Exportação de PDF é Pro", desc: "Disponível nos planos Pro e Agency. Faça upgrade para baixar relatórios em PDF.", target: "pro" },
    en: { title: "PDF export is a Pro feature", desc: "Available on Pro and Agency plans. Upgrade to download PDF reports.", target: "pro" },
  },
  full_history: {
    pt: { title: "Histórico completo é Starter+", desc: "No plano grátis você vê apenas a última análise. Faça upgrade para acessar o histórico completo.", target: "starter" },
    en: { title: "Full history is Starter+", desc: "On the free plan you only see your latest analysis. Upgrade to access full history.", target: "starter" },
  },
  white_label: {
    pt: { title: "White-Label é Agency", desc: "A personalização de marca é exclusiva do plano Agency. Faça upgrade para entregar relatórios com sua marca.", target: "agency" },
    en: { title: "White-Label is Agency-only", desc: "Brand customisation is exclusive to the Agency plan. Upgrade to deliver branded reports.", target: "agency" },
  },
  agency_panel: {
    pt: { title: "Painel de Agência é Agency", desc: "Disponível apenas no plano Agency.", target: "agency" },
    en: { title: "Agency Panel is Agency-only", desc: "Available only on the Agency plan.", target: "agency" },
  },
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: UpgradeReason;
}

export const UpgradeModal = ({ open, onOpenChange, reason }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const isPt = lang === "pt-BR";
  const copy = isPt ? COPY[reason].pt : COPY[reason].en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full gradient-bg flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">{copy.title}</DialogTitle>
          <DialogDescription className="text-center">{copy.desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isPt ? "Agora não" : "Not now"}
          </Button>
          <Button
            className="gradient-bg text-primary-foreground"
            onClick={() => { onOpenChange(false); navigate("/pricing"); }}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {isPt ? "Ver planos" : "See plans"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface LockedOverlayProps {
  reason: UpgradeReason;
  children: React.ReactNode;
  className?: string;
}

/** Wraps content with a frosted lock overlay + "Ver planos" CTA. */
export const LockedOverlay = ({ reason, children, className = "" }: LockedOverlayProps) => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const isPt = lang === "pt-BR";
  const copy = isPt ? COPY[reason].pt : COPY[reason].en;

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border p-6 text-center">
        <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">🔒 {copy.title}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{copy.desc}</p>
        </div>
        <Button onClick={() => navigate("/pricing")} className="gradient-bg text-primary-foreground">
          <Sparkles className="h-4 w-4 mr-1.5" />
          {isPt ? "Ver planos" : "See plans"}
        </Button>
      </div>
    </div>
  );
};
