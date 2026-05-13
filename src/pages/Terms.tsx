import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHelmet } from "@/components/PageHelmet";

const Terms = () => {
  const { lang } = useI18n();
  const isPt = lang === "pt-BR";

  useEffect(() => {
    document.title = isPt ? "Termos de Uso | Viewsup AI" : "Terms of Service | Viewsup AI";
  }, [isPt]);

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <h1>Termos de Uso</h1>
            <p><em>Última atualização: 7 de maio de 2026</em></p>

            <p>Estes Termos de Uso ("Termos") regem o acesso e uso do serviço Viewsup AI ("Serviço"), operado por <strong>Viewsup</strong> ("Viewsup", "nós"). Ao usar o Serviço, você concorda com estes Termos.</p>

            <h2>1. Aceitação</h2>
            <p>Ao criar uma conta ou usar o Serviço, você confirma que tem capacidade legal para celebrar este contrato e concorda com estes Termos. Se você usa o Serviço em nome de uma organização, declara ter autoridade para vinculá-la.</p>

            <h2>2. Descrição do Serviço</h2>
            <p>O Viewsup AI é uma ferramenta de diagnóstico de perfis do Instagram baseada em inteligência artificial, que analisa conteúdo público e gera relatórios, pontuações e sugestões editoriais.</p>

            <h2>3. Uso Aceitável</h2>
            <p>Você concorda em não:</p>
            <ul>
              <li>Usar o Serviço para qualquer finalidade ilegal, fraudulenta ou de spam;</li>
              <li>Violar direitos de propriedade intelectual de terceiros;</li>
              <li>Interferir na segurança do Serviço (malware, sondagem, scraping não autorizado);</li>
              <li>Tentar reverter, descompilar ou contornar limites técnicos;</li>
              <li>Revender, redistribuir ou sublicenciar o Serviço sem autorização.</li>
            </ul>

            <h2>4. Conta e Credenciais</h2>
            <p>Você é responsável por manter a confidencialidade das suas credenciais e por toda atividade ocorrida na sua conta. Forneça informações precisas e mantenha-as atualizadas.</p>

            <h2>5. Conteúdo Gerado por IA</h2>
            <p>O Serviço usa modelos de IA generativa para produzir relatórios, hooks, roteiros e sugestões de conteúdo. Você reconhece que:</p>
            <ul>
              <li>Resultados podem conter imprecisões e não substituem aconselhamento profissional;</li>
              <li>Você é responsável por revisar, validar e decidir como usar os outputs;</li>
              <li>É proibido usar o Serviço para gerar conteúdo ilegal, enganoso, deepfakes, discurso de ódio, malware ou tentativas de jailbreak;</li>
              <li>Você precisa ter os direitos sobre qualquer conteúdo (URLs de perfis, imagens, vídeos) que submeter para análise;</li>
              <li>Reservamo-nos o direito de moderar, filtrar ou recusar outputs e suspender contas que descumpram estas regras;</li>
              <li>Para infrações reiteradas de direitos de terceiros, contas podem ser encerradas. Solicitações de remoção podem ser enviadas pelo nosso suporte.</li>
            </ul>

            <h2>6. Propriedade Intelectual</h2>
            <p>Todo o software, design, marca e documentação do Serviço pertencem à Viewsup. Concedemos a você uma licença limitada, não-exclusiva e intransferível para usar o Serviço dentro do plano contratado.</p>

            <h2>7. Pagamentos e Assinaturas</h2>
            <p>Nosso processo de pedidos é conduzido pelo nosso revendedor online <strong>Paddle.com</strong>. <strong>Paddle.com é o Merchant of Record (Revendedor Oficial) de todos os nossos pedidos. A Paddle fornece todo o atendimento ao cliente para questões de cobrança e processa devoluções.</strong></p>
            <p>Para condições de pagamento, cobrança, impostos, renovação, cancelamento e reembolso, consulte os <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">Buyer Terms da Paddle</a>. Assinaturas são renovadas automaticamente até serem canceladas.</p>

            <h2>8. Disponibilidade do Serviço</h2>
            <p>Buscamos máxima disponibilidade, mas não garantimos operação ininterrupta ou livre de erros. Podemos realizar manutenções, atualizações ou alterações no Serviço a qualquer momento.</p>

            <h2>9. Garantias e Responsabilidade</h2>
            <p>Na máxima medida permitida por lei, o Serviço é fornecido "como está", sem garantias implícitas de comerciabilidade ou adequação a um propósito específico. Nossa responsabilidade agregada é limitada aos valores pagos por você nos 12 meses anteriores ao evento. Não nos responsabilizamos por danos indiretos, lucros cessantes, perda de dados ou de oportunidade.</p>

            <h2>10. Suspensão e Encerramento</h2>
            <p>Podemos suspender ou encerrar seu acesso em caso de: violação material destes Termos, inadimplência, risco de segurança ou fraude, ou descumprimento reiterado de políticas. Você pode encerrar sua conta a qualquer momento.</p>

            <h2>11. Lei Aplicável</h2>
            <p>Estes Termos são regidos pelas leis aplicáveis à sede da Viewsup, com foro eleito na mesma jurisdição, salvo direito de consumidor que estabeleça o contrário.</p>

            <h2>12. Alterações</h2>
            <p>Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas com antecedência razoável.</p>

            <h2>13. Contato</h2>
            <p>Dúvidas sobre estes Termos? Entre em contato pelo suporte dentro do painel.</p>
          </>
        ) : (
          <>
            <h1>Terms of Service</h1>
            <p><em>Last updated: May 7, 2026</em></p>

            <p>These Terms of Service ("Terms") govern access to and use of the Viewsup AI service ("Service"), operated by <strong>Viewsup</strong> ("Viewsup", "we", "us"). By using the Service you agree to these Terms.</p>

            <h2>1. Acceptance</h2>
            <p>By creating an account or using the Service you confirm that you have legal capacity to enter into this agreement and accept these Terms. If you use the Service on behalf of an organisation, you represent that you have authority to bind it.</p>

            <h2>2. The Service</h2>
            <p>Viewsup AI is an AI-powered Instagram profile audit tool that analyses publicly available content and produces reports, scores and editorial suggestions.</p>

            <h2>3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful, fraudulent or spam purpose;</li>
              <li>Infringe third-party intellectual property rights;</li>
              <li>Interfere with the security of the Service (malware, probing, unauthorised scraping);</li>
              <li>Reverse engineer, decompile or circumvent technical limits;</li>
              <li>Resell, redistribute or sublicense the Service without authorisation.</li>
            </ul>

            <h2>4. Account & Credentials</h2>
            <p>You are responsible for keeping your credentials confidential and for all activity under your account. Provide accurate information and keep it up to date.</p>

            <h2>5. AI-Generated Content</h2>
            <p>The Service uses generative AI models to produce reports, hooks, scripts and content suggestions. You acknowledge that:</p>
            <ul>
              <li>Outputs may be inaccurate and are not a substitute for professional advice;</li>
              <li>You are responsible for reviewing, validating and deciding how to use outputs;</li>
              <li>You must not use the Service to produce illegal or misleading content, deepfakes, hate speech, malware, or jailbreak attempts;</li>
              <li>You must hold the necessary rights to any content (profile URLs, images, video) you submit for analysis;</li>
              <li>We reserve the right to moderate, filter or refuse outputs and to suspend accounts that breach these rules;</li>
              <li>Repeated infringement of third-party rights may lead to account termination. Takedown requests can be submitted via support.</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>All software, design, branding and documentation of the Service belong to Viewsup. We grant you a limited, non-exclusive, non-transferable licence to use the Service within your plan.</p>

            <h2>7. Payments & Subscriptions</h2>
            <p>Our order process is conducted by our online reseller <strong>Paddle.com</strong>. <strong>Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.</strong></p>
            <p>For payment, billing, tax, renewal, cancellation and refund mechanics, please refer to the <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">Paddle Buyer Terms</a>. Subscriptions auto-renew until cancelled.</p>

            <h2>8. Service Availability</h2>
            <p>We aim for high availability but do not guarantee uninterrupted or error-free operation. We may perform maintenance, updates or changes to the Service at any time.</p>

            <h2>9. Warranties & Liability</h2>
            <p>To the fullest extent permitted by law, the Service is provided "as is" without implied warranties of merchantability or fitness for a particular purpose. Our aggregate liability is capped at fees paid by you in the 12 months preceding the event. We exclude liability for indirect, consequential or special damages including loss of profits, data or goodwill.</p>

            <h2>10. Suspension & Termination</h2>
            <p>We may suspend or terminate your access for: material breach of these Terms, non-payment, security or fraud risk, or repeated policy violations. You may close your account at any time.</p>

            <h2>11. Governing Law</h2>
            <p>These Terms are governed by the laws applicable at Viewsup's place of establishment, with venue in the same jurisdiction, subject to mandatory consumer protection law.</p>

            <h2>12. Changes</h2>
            <p>We may update these Terms. Material changes will be communicated with reasonable notice.</p>

            <h2>13. Contact</h2>
            <p>Questions about these Terms? Reach out via in-app support.</p>
          </>
        )}

        <p className="mt-12 text-sm">
          <Link to="/privacy" className="text-primary hover:underline">{isPt ? "Política de Privacidade" : "Privacy Policy"}</Link>
          {" · "}
          <Link to="/refund" className="text-primary hover:underline">{isPt ? "Política de Reembolso" : "Refund Policy"}</Link>
        </p>
      </main>
    </div>
  );
};

export default Terms;
