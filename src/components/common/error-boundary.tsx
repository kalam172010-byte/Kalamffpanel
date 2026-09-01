import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('kalam_auth_user');
      localStorage.removeItem('kalam_active_mode');
    } catch {}
    window.location.reload();
  };

  private handleResetAll = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4 selection:bg-rose-500/30 selection:text-white">
          <div className="w-full max-w-md bg-[#161622] border border-rose-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Application Recovery
              </h2>
              <p className="text-xs text-gray-400">
                A temporary interface state encountered an issue. You can recover instantly without losing your account.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left font-mono text-[11px] text-rose-300 max-h-28 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Home className="w-4 h-4 text-purple-400" />
                <span>Reset View Session</span>
              </button>

              <button
                onClick={this.handleResetAll}
                className="w-full py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-[11px] font-semibold text-rose-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Corrupted Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
