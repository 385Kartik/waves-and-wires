import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-yellow-400/20 text-yellow-500 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                We encountered an unexpected error while loading this page. Please refresh to load the latest version.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary text-black px-6 py-3 font-black text-sm hover:bg-yellow-400 transition-all shadow-md"
              >
                <RefreshCw className="h-4 w-4" /> Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-foreground px-6 py-3 font-bold text-sm hover:bg-accent transition-all"
              >
                <Home className="h-4 w-4" /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
