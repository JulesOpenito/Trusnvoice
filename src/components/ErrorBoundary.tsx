import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  declare setState: (
    state:
      | ErrorBoundaryState
      | Partial<ErrorBoundaryState>
      | ((prevState: Readonly<ErrorBoundaryState>, props: Readonly<ErrorBoundaryProps>) => ErrorBoundaryState | Partial<ErrorBoundaryState> | null),
    callback?: () => void
  ) => void;

  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected application error occurred.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F5] text-black flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] p-8 space-y-5">
            <div className="flex items-center gap-3 border-b-2 border-black pb-4">
              <div className="p-2 bg-black text-white">
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-600">
                  TrustInvoice Runtime Recovery
                </p>
                <h1 className="text-xl font-black tracking-tight">Something went wrong</h1>
              </div>
            </div>

            <p className="text-sm text-neutral-700 leading-relaxed">
              The interface encountered an unexpected issue while rendering this view. Your saved records remain intact.
            </p>

            <div className="bg-neutral-100 border border-neutral-300 p-3 font-mono text-xs text-neutral-800 break-words">
              {this.state.errorMessage}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase px-5 py-3 border-2 border-black inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reload Application</span>
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, errorMessage: "" })}
                className="bg-white hover:bg-neutral-100 text-black font-mono text-xs font-bold uppercase px-5 py-3 border-2 border-black cursor-pointer transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
