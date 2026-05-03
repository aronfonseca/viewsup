import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface Plan {
  id: "starter" | "pro" | "agency";
  name: string;
  priceId: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceId: "starter_monthly",
    price: "R$ 47",
    period: "/mês",
    description: "Para criadores começando",
    features: ["15 análises de perfil/mês", "Relatórios em PDF", "Histórico completo", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "pro_monthly",
    price: "R$ 197",
    period: "/mês",
    description: "Para criadores sérios e small business",
    features: ["60 análises de perfil/mês", "Tudo do Starter", "Laboratório de Retenção", "Roteiros personalizados", "Análise de tendências"],
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    priceId: "agency_monthly",
    price: "R$ 497",
    period: "/mês",
    description: "Para agências e consultores",
    features: ["Análises ilimitadas", "Tudo do Pro", "White-label completo", "Branding customizado", "Suporte prioritário"],
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => { document.title = "Planos | ViralLens AI"; }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) { navigate("/auth"); return; }
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
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">ViralLens AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Escolha seu plano
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Diagnósticos profundos de perfis Instagram com IA. Cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isLoading = loading && selectedPlan === plan.id;
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
                      Mais popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
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
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assinar agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          Pagamentos processados com segurança. Cancele a qualquer momento direto pelo seu painel.
        </p>
      </main>
    </div>
  );
};

export default Pricing;
