import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected rendering error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-main p-6 text-text-primary">
          <div className="glass-panel max-w-md rounded-2xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-status-danger/30 bg-status-danger/10 text-status-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-bold">Interface Recovery</h1>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2 text-xs font-bold text-white dark:text-slate-950"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
