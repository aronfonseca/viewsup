import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface Plan {
  id: "starter" | "pro" | "agency";
  name: string;
  priceId: string;
  pricePt: string;
  priceEn: string;
  descriptionPt: string;
  descriptionEn: string;
  featuresPt: string[];
  featuresEn: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceId: "starter_monthly",
    pricePt: "R$ 47",
    priceEn: "£8",
    descriptionPt: "Para criadores começando",
    descriptionEn: "For creators just getting started",
    featuresPt: [
      "15 análises de perfil/mês",
      "Relatório completo",
      "Pontuações & dimensões",
      "10 roteiros prontos para gravar",
      "Trend Radar",
    ],
    featuresEn: [
      "15 analyses per month",
      "Full report",
      "Scores & dimensions",
      "10 ready-to-record scripts",
      "Trend Radar",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "pro_monthly",
    pricePt: "R$ 197",
    priceEn: "£32",
    descriptionPt: "Para criadores sérios e small business",
    descriptionEn: "For serious creators and small businesses",
    featuresPt: [
      "60 análises de perfil/mês",
      "Relatório completo com 14 módulos",
      "Hook Swapper",
      "Soundscape Architect",
      "Laboratório de Vídeo",
      "Relatório em PDF",
      "Suporte prioritário",
    ],
    featuresEn: [
      "60 analyses per month",
      "Complete report with 14 modules",
      "Hook Swapper",
      "Soundscape Architect",
      "Video Lab",
      "PDF report",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    priceId: "agency_monthly",
    pricePt: "R$ 497",
    priceEn: "£79",
    descriptionPt: "Para agências e consultores",
    descriptionEn: "For agencies and consultants",
    featuresPt: [
      "Análises ilimitadas",
      "Tudo do Pro",
      "Relatórios white-label",
      "Painel de agência",
      "PDF customizado",
      "Suporte VIP",
    ],
    featuresEn: [
      "Unlimited analyses",
      "Everything in Pro",
      "White-label reports",
      "Agency dashboard",
      "Custom PDF",
      "VIP support",
    ],
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const { openCheckout, loading } = usePaddleCheckout();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const isPt = lang === "pt-BR";

  const tx = {
    title: isPt ? "Escolha seu plano" : "Choose your plan",
    subtitle: isPt
      ? "Diagnósticos profundos de perfis Instagram com IA. Cancele quando quiser."
      : "Deep AI-powered Instagram profile audits. Cancel anytime.",
    period: isPt ? "/mês" : "/month",
    mostPopular: isPt ? "Mais popular" : "Most popular",
    subscribe: isPt ? "Assinar agora" : "Subscribe now",
    back: isPt ? "Voltar" : "Back",
    footer: isPt
      ? "Pagamentos processados com segurança. Cancele a qualquer momento direto pelo seu painel."
      : "Payments processed securely. Cancel anytime from your dashboard.",
  };

  useEffect(() => {
    document.title = isPt ? "Planos | ViralLens AI" : "Pricing | ViralLens AI";
  }, [isPt]);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast({
        title: isPt ? "Faça login para continuar" : "Sign in to continue",
        description: isPt ? "Você precisa estar logado para assinar." : "You must be signed in to subscribe.",
      });
      navigate(`/auth?redirect=/pricing`);
      return;
    }
    setSelectedPlan(plan.id);
    try {
      await openCheckout({
        priceId: plan.priceId,
        customerEmail: user.email,
        userId: user.id,
      });
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(user ? "/dashboard" : "/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {tx.back}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">ViralLens AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{tx.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{tx.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isLoading = loading && selectedPlan === plan.id;
            const price = isPt ? plan.pricePt : plan.priceEn;
            const description = isPt ? plan.descriptionPt : plan.descriptionEn;
            const features = isPt ? plan.featuresPt : plan.featuresEn;
            return (
              <Card
                key={plan.id}
                className={`relative border-border bg-card flex flex-col ${
                  plan.highlight ? "border-primary/50 shadow-lg shadow-primary/10 md:scale-105" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-bg text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {tx.mostPopular}
                    </span>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">{price}</span>
                    <span className="text-muted-foreground">{tx.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                    className={plan.highlight ? "gradient-bg text-primary-foreground w-full" : "w-full"}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : tx.subscribe}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">{tx.footer}</p>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">{isPt ? "Termos de Uso" : "Terms of Service"}</a>
          {" · "}
          <a href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">{isPt ? "Política de Privacidade" : "Privacy Policy"}</a>
          {" · "}
          <a href="/refund" className="hover:text-foreground underline-offset-4 hover:underline">{isPt ? "Política de Reembolso (30 dias)" : "Refund Policy (30 days)"}</a>
        </p>
      </main>
    </div>
  );
};

export default Pricing;

