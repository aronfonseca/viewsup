import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHelmet } from "@/components/PageHelmet";

const Refund = () => {
  const { lang } = useI18n();
  const isPt = lang === "pt-BR";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHelmet
        title={isPt ? "Política de Reembolso | Viewsup AI" : "Refund Policy | Viewsup AI"}
        description={isPt ? "O Viewsup AI oferece garantia de reembolso de 30 dias em todos os planos pagos. Saiba como solicitar." : "Viewsup AI offers a 30-day money-back guarantee on all paid plans. Learn how to request a refund."}
        path="/refund"
      />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isPt ? "Voltar" : "Back"}
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">Viewsup AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
        {isPt ? (
          <>
            <h1>Política de Reembolso</h1>
            <p><em>Última atualização: 7 de maio de 2026</em></p>

            <p>A <strong>Viewsup</strong> oferece uma <strong>garantia de devolução do dinheiro de 30 dias</strong> para todos os planos pagos do Viewsup AI. Se você não ficou satisfeito com sua compra, pode solicitar um reembolso integral em até <strong>30 dias</strong> a partir da data do pedido.</p>

            <h2>Como solicitar um reembolso</h2>
            <p>Os reembolsos são processados pelo nosso provedor de pagamentos, a <strong>Paddle</strong>, que atua como Merchant of Record (Revendedor Oficial) de todas as nossas vendas.</p>
            <ol>
              <li>Acesse <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a> e localize sua compra usando o e-mail utilizado no checkout; ou</li>
              <li>Entre em contato com o suporte pelo painel da Viewsup, e nós encaminharemos sua solicitação à Paddle.</li>
            </ol>

            <h2>Cancelamento da assinatura</h2>
            <p>Você pode cancelar sua assinatura a qualquer momento pelo painel da sua conta ou via paddle.net. O cancelamento encerra a renovação automática; o acesso permanece ativo até o final do período já pago.</p>

            <h2>Observações</h2>
            <ul>
              <li>Os reembolsos retornam para o método de pagamento original em até alguns dias úteis, conforme o emissor.</li>
              <li>Para detalhes adicionais, consulte também a <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer">Política de Reembolso da Paddle</a>.</li>
            </ul>
          </>
        ) : (
          <>
            <h1>Refund Policy</h1>
            <p><em>Last updated: May 7, 2026</em></p>

            <p><strong>Viewsup</strong> offers a <strong>30-day money-back guarantee</strong> on all paid plans of Viewsup AI. If you are not satisfied with your purchase, you can request a full refund within <strong>30 days</strong> of the order date.</p>

            <h2>How to request a refund</h2>
            <p>Refunds are processed by our payment provider, <strong>Paddle</strong>, which acts as Merchant of Record for all our sales.</p>
            <ol>
              <li>Visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a> and locate your purchase using the email used at checkout; or</li>
              <li>Contact support from the Viewsup dashboard and we will forward your request to Paddle.</li>
            </ol>

            <h2>Subscription cancellation</h2>
            <p>You can cancel your subscription anytime from your account dashboard or via paddle.net. Cancelling stops auto-renewal; access remains active until the end of the period already paid for.</p>

            <h2>Notes</h2>
            <ul>
              <li>Refunds are returned to the original payment method, typically within a few business days depending on your issuer.</li>
              <li>For additional details, see Paddle's <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer">Refund Policy</a>.</li>
            </ul>
          </>
        )}

        <p className="mt-12 text-sm">
          <Link to="/terms" className="text-primary hover:underline">{isPt ? "Termos de Uso" : "Terms of Service"}</Link>
          {" · "}
          <Link to="/privacy" className="text-primary hover:underline">{isPt ? "Política de Privacidade" : "Privacy Policy"}</Link>
        </p>
      </main>
    </div>
  );
};

export default Refund;
