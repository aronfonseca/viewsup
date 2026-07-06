import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHelmet } from "@/components/PageHelmet";
import { useI18n } from "@/lib/i18n";
import { Copy, Check, Sparkles, ArrowLeft } from "lucide-react";

const Connect = () => {
  const { lang } = useI18n();
  const isPt = lang === "pt-BR";
  const [copied, setCopied] = useState(false);

  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const mcpUrl = `https://${projectRef}.supabase.co/functions/v1/mcp`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <PageHelmet
        title={isPt ? "Conectar assistente de IA | Viewsup AI" : "Connect an AI assistant | Viewsup AI"}
        description={
          isPt
            ? "Conecte o Viewsup AI ao ChatGPT ou Claude e converse com suas análises."
            : "Connect Viewsup AI to ChatGPT or Claude and chat with your analyses."
        }
        path="/connect"
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {isPt ? "Voltar" : "Back"}
        </Link>

        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl gradient-bg inline-flex">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            {isPt ? "Conecte um assistente de IA" : "Connect an AI assistant"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isPt
              ? "Use o Viewsup AI direto do ChatGPT ou Claude para consultar suas análises de perfil."
              : "Use Viewsup AI right from ChatGPT or Claude to browse your profile analyses."}
          </p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">{isPt ? "URL do servidor" : "Server URL"}</CardTitle>
            <CardDescription>
              {isPt
                ? "Copie este link — você vai colar no assistente."
                : "Copy this link — you'll paste it into the assistant."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3 font-mono text-sm break-all">
              <span className="flex-1">{mcpUrl}</span>
              <Button size="sm" variant="outline" onClick={copy} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? (isPt ? "Copiado" : "Copied") : (isPt ? "Copiar" : "Copy")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">ChatGPT</CardTitle>
            <CardDescription>
              {isPt ? "Requer o modo Desenvolvedor do ChatGPT." : "Requires ChatGPT Developer mode."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
              <li>
                {isPt ? "Abra " : "Open "}
                <a
                  href="https://chatgpt.com/#settings/Connectors/Advanced"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  chatgpt.com/#settings/Connectors/Advanced
                </a>
                {isPt
                  ? " e ative o modo Desenvolvedor (leia o aviso mostrado)."
                  : " and enable Developer mode (heed the risk notice shown there)."}
              </li>
              <li>
                {isPt
                  ? 'No menu "+" do campo de mensagem, ative o modo Desenvolvedor.'
                  : 'In the chat composer\'s "+" menu, turn on Developer mode.'}
              </li>
              <li>
                {isPt
                  ? 'Clique em "Add sources" e depois "Connect more".'
                  : 'Click "Add sources", then "Connect more".'}
              </li>
              <li>
                {isPt
                  ? "Dê um nome ao conector e cole a URL do servidor acima."
                  : "Name the connector and paste the MCP URL above."}
              </li>
              <li>
                {isPt
                  ? "Peça ao ChatGPT para usar o Viewsup AI."
                  : "Ask ChatGPT to use Viewsup AI."}
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Claude</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
              <li>
                {isPt ? "Abra " : "Open "}
                <a
                  href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  claude.ai/customize/connectors
                </a>
                .
              </li>
              <li>
                {isPt
                  ? "Dê um nome ao conector e cole a URL do servidor acima."
                  : "Name the connector and paste the MCP URL above."}
              </li>
              <li>
                {isPt
                  ? "Ative o conector no campo de mensagem e peça ao Claude para usar o Viewsup AI."
                  : "Enable the connector from the chat composer, then ask Claude to use Viewsup AI."}
              </li>
            </ol>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          {isPt
            ? "Você entra com sua conta Viewsup ao conectar. O assistente só acessa suas próprias análises."
            : "You sign in with your Viewsup account when connecting. The assistant only sees your own analyses."}
        </p>
      </div>
    </div>
  );
};

export default Connect;
