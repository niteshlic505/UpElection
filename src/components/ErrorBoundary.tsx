import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('UP Mandate ErrorBoundary caught:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendlyMsg = `Cloud sync permission notice (${parsed.operationType || 'read'}): ${parsed.error}`;
        }
      } catch {
        // Keep raw message if not JSON
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] dark:bg-[#070E20] p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Synchronization Interrupted
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 break-words">
              {friendlyMsg}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload UP Mandate
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
