import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "@/hooks/use-toast";
import { PageHelmet } from "@/components/PageHelmet";

interface Plan {
  id: "starter" | "pro" | "agency";
  name: string;
  priceId: string;
  pricePt: string;
  priceEn: string;
  perDayPt: string;
  perDayEn: string;
  descriptionPt: string;
  descriptionEn: string;
  tagPt?: string;
  tagEn?: string;
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
    perDayPt: "R$ 1,57/dia",
    perDayEn: "£0.27/day",
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
      "15 profile analyses / month",
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
    pricePt: "R$ 97",
    priceEn: "£16",
    perDayPt: "R$ 3,23/dia",
    perDayEn: "£0.53/day",
    descriptionPt: "Para criadores sérios e small business",
    descriptionEn: "For serious creators and small businesses",
    tagPt: "Ideal para quem posta mais de 2x por semana e quer crescer com dados",
    tagEn: "Ideal for creators posting 2+ times a week who want to grow with data",
    featuresPt: [
      "60 análises de perfil/mês",
      "Tudo do Starter",
      "Relatório completo com 14 módulos",
      "Reescreva os hooks dos seus vídeos com IA",
      "Sugestões de música e áudio para cada vídeo",
      "Laboratório de Vídeo",
      "Relatório em PDF",
      "Suporte prioritário",
    ],
    featuresEn: [
      "60 profile analyses / month",
      "Everything in Starter",
      "Complete report with 14 modules",
      "Rewrite your video hooks with AI",
      "Music and audio suggestions for each video",
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
    pricePt: "R$ 297",
    priceEn: "£49",
    perDayPt: "R$ 9,90/dia",
    perDayEn: "£1.63/day",
    descriptionPt: "Para agências e consultores",
    descriptionEn: "For agencies and consultants",
    tagPt: "Seus clientes recebem relatórios com a logo da sua agência — não do Viewsup",
    tagEn: "Your clients receive reports with your agency's logo — not Viewsup's",
    featuresPt: [
      "Análises ilimitadas",
      "Tudo do Pro",
      "Relatórios white-label",
      "Painel de agência",
      "PDF customizado com sua marca",
      "Múltiplos clientes / workspaces",
      "Suporte VIP dedicado",
    ],
    featuresEn: [
      "Unlimited analyses",
      "Everything in Pro",
      "White-label reports",
      "Agency dashboard",
      "Custom-branded PDF",
      "Multiple clients / workspaces",
      "Dedicated VIP support",
    ],
  },
];

const PLAN_USD: Record<string, number> = {
  starter: 9,
  pro: 19,
  agency: 59,
};

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang, locale } = useI18n();
  const { openCheckout, loading } = usePaddleCheckout();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const isPt = lang === "pt-BR";
  const isGb = locale.countryCode === "GB";

  const tx = {
    title: isPt ? "Escolha seu plano" : "Choose your plan",
    subtitle: isPt
      ? "Diagnósticos profundos de perfis Instagram com IA. Cancele quando quiser."
      : "Deep AI-powered Instagram profile audits. Cancel anytime.",
    period: isPt ? "/mês" : "/month",
    mostPopular: isPt ? "Mais popular" : "Most popular",
    subscribe: isPt ? "Assinar agora" : "Subscribe now",
    back: isPt ? "Voltar" : "Back",
    guarantee: isPt ? "✓ 7 dias de garantia ou seu dinheiro de volta" : "✓ 7-day money-back guarantee",
    freeTitle: isPt ? "Grátis" : "Free",
    freeDesc: isPt
      ? "1 análise sem cadastro • Sem cartão de crédito • Resultado em segundos"
      : "1 analysis with no sign-up • No credit card • Results in seconds",
    freeCta: isPt ? "Experimentar grátis" : "Try it free",
    footer: isPt
      ? "Pagamentos processados com segurança. Cancele a qualquer momento direto pelo seu painel."
      : "Payments processed securely. Cancel anytime from your dashboard.",
  };



  // Format display price using detected currency for "rest of world"
  const formatPrice = (plan: Plan): string => {
    if (isPt) return plan.pricePt;
    if (isGb) return plan.priceEn;
    const amount = PLAN_USD[plan.id] ?? 9;
    try {
      return new Intl.NumberFormat(locale.paddleLocale || "en", {
        style: "currency",
        currency: locale.currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${amount}`;
    }
  };

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
        locale: locale.paddleLocale,
        countryCode: locale.countryCode,
      });
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title={isPt ? "Planos | Viewsup AI" : "Pricing | Viewsup AI"}
        description={isPt ? "Escolha seu plano de auditoria Instagram. Do Starter ao Agency, análise de perfil com IA e preços mensais flexíveis." : "Choose your Instagram audit plan. From Starter to Agency, get AI-powered profile analysis with flexible monthly pricing."}
        path="/pricing"
      />
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
            <span className="font-bold">Viewsup</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{tx.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{tx.subtitle}</p>
        </div>

        {/* Free trial banner */}
        <Card className="mb-10 border-primary/40 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 shadow-md shadow-primary/10">
          <CardContent className="py-5 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{tx.freeTitle}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{tx.freeDesc}</p>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 shrink-0"
            >
              {tx.freeCta}
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isLoading = loading && selectedPlan === plan.id;
            const price = formatPrice(plan);
            const perDay = isPt ? plan.perDayPt : plan.perDayEn;
            const description = isPt ? plan.descriptionPt : plan.descriptionEn;
            const tag = isPt ? plan.tagPt : plan.tagEn;
            const features = isPt ? plan.featuresPt : plan.featuresEn;
            return (
              <Card
                key={plan.id}
                className={`relative border-border bg-card flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-2xl shadow-primary/20 md:scale-110 md:-my-2 z-10 ring-1 ring-primary/40"
                    : "opacity-95"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-bg text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      {tx.mostPopular}
                    </span>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 flex flex-col flex-1">
                  <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{price}</span>
                    <span className="text-muted-foreground">{tx.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 mt-1">{perDay}</p>
                  {tag && (
                    <p className={`text-xs italic mb-4 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`}>
                      {tag}
                    </p>
                  )}
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
                  <p className="text-center text-xs text-muted-foreground mt-3">{tx.guarantee}</p>
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

