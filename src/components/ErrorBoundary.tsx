import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div className="max-w-md">
            <h1 className="text-xl font-semibold text-foreground mb-2">Algo deu errado ao exibir esta página</h1>
            <p className="text-sm text-muted-foreground mb-2">
              Encontramos um erro ao renderizar o conteúdo. Você pode voltar ao painel e tentar novamente.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground/70 mb-6 font-mono break-all">{this.state.error.message}</p>
            )}
            <Button onClick={this.handleReset} className="gradient-bg text-primary-foreground">
              Voltar ao painel
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
