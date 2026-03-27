import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="max-w-xl mx-auto mt-20 bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4"
        >
          <div className="text-4xl">💥</div>
          <h2 className="text-lg font-bold text-red-800">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600 font-mono break-all">
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
