import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHelmet } from "@/components/PageHelmet";

const Privacy = () => {
  const { lang } = useI18n();
  const isPt = lang === "pt-BR";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHelmet
        title={isPt ? "Política de Privacidade | Viewsup AI" : "Privacy Policy | Viewsup AI"}
        description={isPt ? "Saiba como o Viewsup AI coleta, usa e protege seus dados pessoais e conteúdo do Instagram." : "Learn how Viewsup AI collects, uses, and protects your personal data and Instagram content."}
        path="/privacy"
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
            <h1>Política de Privacidade</h1>
            <p><em>Última atualização: 7 de maio de 2026</em></p>

            <p>Esta Política descreve como a <strong>Viewsup</strong> ("Viewsup", "nós") trata dados pessoais quando você usa o serviço Viewsup AI ("Serviço"). Atuamos como controlador de dados em relação às informações descritas abaixo.</p>

            <h2>1. Dados que coletamos</h2>
            <ul>
              <li><strong>Conta:</strong> nome, e-mail, credenciais de login, idioma preferido;</li>
              <li><strong>Conteúdo submetido:</strong> URLs de perfis do Instagram e arquivos de vídeo enviados para análise;</li>
              <li><strong>Resultados:</strong> relatórios e análises gerados pela IA, vinculados à sua conta;</li>
              <li><strong>Suporte:</strong> mensagens trocadas com nossa equipe;</li>
              <li><strong>Uso/telemetria:</strong> dados de navegação, dispositivo, identificadores e endereço IP;</li>
              <li><strong>Cobrança:</strong> dados básicos da assinatura. Os dados de pagamento (cartão, etc.) são coletados e processados diretamente pela Paddle.</li>
            </ul>

            <h2>2. Finalidades e bases legais</h2>
            <ul>
              <li><strong>Prestar o Serviço</strong> (execução de contrato): autenticação, realizar análises, entregar relatórios;</li>
              <li><strong>Cobrança e gestão da assinatura</strong> (execução de contrato/obrigação legal): vinculando sua conta à Paddle;</li>
              <li><strong>Segurança e prevenção a fraude</strong> (interesse legítimo);</li>
              <li><strong>Melhoria do produto</strong> (interesse legítimo): análises agregadas e diagnóstico de bugs;</li>
              <li><strong>Comunicações transacionais</strong> (execução de contrato);</li>
              <li><strong>Marketing</strong> (consentimento, quando aplicável).</li>
            </ul>

            <h2>3. Compartilhamento de dados</h2>
            <p>Compartilhamos dados pessoais com as seguintes categorias de destinatários:</p>
            <ul>
              <li><strong>Prestadores de serviço/subprocessadores:</strong> hospedagem em nuvem, banco de dados, autenticação, armazenamento, e-mail transacional, monitoramento, e provedores de IA que executam as análises;</li>
              <li><strong>Merchant of Record (Paddle):</strong> para venda do produto, gestão de assinatura, cobrança, conformidade fiscal e emissão de fatura;</li>
              <li><strong>Consultores profissionais:</strong> jurídicos, contábeis;</li>
              <li><strong>Autoridades</strong> quando exigido por lei.</li>
            </ul>

            <h2>4. Transferências internacionais</h2>
            <p>Alguns prestadores podem processar dados fora do seu país de residência, incluindo fora do Reino Unido / EEE. Quando isso ocorre, usamos salvaguardas adequadas como Cláusulas Contratuais Padrão (SCCs) ou decisões de adequação aplicáveis.</p>

            <h2>5. Retenção</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa e pelo período necessário para cumprir obrigações legais e fiscais. Após o encerramento, dados são deletados ou anonimizados, exceto onde a retenção é exigida por lei. Vídeos enviados para análise são removidos automaticamente após processamento (rotina de limpeza).</p>

            <h2>6. Seus direitos</h2>
            <p>Conforme a legislação aplicável (LGPD/GDPR/UK GDPR), você tem direito a: acesso, correção, exclusão, portabilidade, oposição, restrição de tratamento, retirada de consentimento e reclamação à autoridade de proteção de dados competente. Atenderemos solicitações dentro dos prazos legais (geralmente 30 dias). Para exercer seus direitos, contate-nos pelo suporte do painel.</p>

            <h2>7. Segurança</h2>
            <p>Adotamos medidas técnicas e organizacionais apropriadas para proteger seus dados, incluindo criptografia em trânsito, controles de acesso e isolamento multi-tenant via políticas de Row-Level Security no banco de dados.</p>

            <h2>8. Cookies</h2>
            <p>Usamos cookies essenciais para autenticação e funcionamento do Serviço. Cookies analíticos e de marketing, quando usados, exigem seu consentimento e podem ser gerenciados pelas configurações do navegador.</p>

            <h2>9. Alterações</h2>
            <p>Podemos atualizar esta Política. Mudanças relevantes serão comunicadas com antecedência razoável.</p>

            <h2>10. Contato</h2>
            <p>Controlador: <strong>Viewsup</strong>. Para dúvidas, solicitações de direitos ou reclamações, contate-nos pelo suporte dentro do painel.</p>
          </>
        ) : (
          <>
            <h1>Privacy Notice</h1>
            <p><em>Last updated: May 7, 2026</em></p>

            <p>This Privacy Notice describes how <strong>Viewsup</strong> ("Viewsup", "we", "us") handles personal data when you use the Viewsup AI service ("Service"). We act as data controller for the information described below.</p>

            <h2>1. Data we collect</h2>
            <ul>
              <li><strong>Account:</strong> name, email, login credentials, preferred language;</li>
              <li><strong>Submitted content:</strong> Instagram profile URLs and video files uploaded for analysis;</li>
              <li><strong>Results:</strong> AI-generated reports and analyses linked to your account;</li>
              <li><strong>Support:</strong> messages exchanged with our team;</li>
              <li><strong>Usage/telemetry:</strong> browsing data, device information, identifiers, IP address;</li>
              <li><strong>Billing:</strong> basic subscription data. Payment details (card, etc.) are collected and processed directly by Paddle.</li>
            </ul>

            <h2>2. Purposes & legal bases</h2>
            <ul>
              <li><strong>Providing the Service</strong> (contract performance): authentication, running analyses, delivering reports;</li>
              <li><strong>Billing and subscription management</strong> (contract performance/legal obligation): linking your account to Paddle;</li>
              <li><strong>Security and fraud prevention</strong> (legitimate interest);</li>
              <li><strong>Product improvement</strong> (legitimate interest): aggregate analytics and bug diagnostics;</li>
              <li><strong>Transactional communications</strong> (contract performance);</li>
              <li><strong>Marketing</strong> (consent, where applicable).</li>
            </ul>

            <h2>3. Data sharing</h2>
            <p>We share personal data with the following categories of recipients:</p>
            <ul>
              <li><strong>Service providers/subprocessors:</strong> cloud hosting, database, authentication, file storage, transactional email, monitoring, and AI providers that perform analyses;</li>
              <li><strong>Merchant of Record (Paddle):</strong> for product sale, subscription management, payments, tax compliance and invoicing;</li>
              <li><strong>Professional advisers:</strong> legal, accounting;</li>
              <li><strong>Authorities</strong> where required by law.</li>
            </ul>

            <h2>4. International transfers</h2>
            <p>Some providers may process data outside your country of residence, including outside the UK/EEA. Where that happens we rely on appropriate safeguards such as Standard Contractual Clauses (SCCs) or applicable adequacy decisions.</p>

            <h2>5. Retention</h2>
            <p>We keep your data while your account is active and for the period needed to meet legal and tax obligations. After closure, data is deleted or anonymised, except where retention is required by law. Videos uploaded for analysis are automatically removed after processing (cleanup routine).</p>

            <h2>6. Your rights</h2>
            <p>Subject to applicable law (UK GDPR/GDPR/LGPD), you have rights to: access, rectification, erasure, portability, objection, restriction of processing, withdrawal of consent and to lodge a complaint with the competent data protection authority. We respond within statutory deadlines (typically 1 month). To exercise your rights, contact us via in-app support.</p>

            <h2>7. Security</h2>
            <p>We apply appropriate technical and organisational measures to protect your data, including encryption in transit, access controls and multi-tenant isolation via Row-Level Security policies in the database.</p>

            <h2>8. Cookies</h2>
            <p>We use essential cookies for authentication and Service operation. Analytics and marketing cookies, when used, require your consent and can be managed via your browser settings.</p>

            <h2>9. Changes</h2>
            <p>We may update this Notice. Material changes will be communicated with reasonable notice.</p>

            <h2>10. Contact</h2>
            <p>Controller: <strong>Viewsup</strong>. For questions, rights requests or complaints, contact us via in-app support.</p>
          </>
        )}

        <p className="mt-12 text-sm">
          <Link to="/terms" className="text-primary hover:underline">{isPt ? "Termos de Uso" : "Terms of Service"}</Link>
          {" · "}
          <Link to="/refund" className="text-primary hover:underline">{isPt ? "Política de Reembolso" : "Refund Policy"}</Link>
        </p>
      </main>
    </div>
  );
};

export default Privacy;
