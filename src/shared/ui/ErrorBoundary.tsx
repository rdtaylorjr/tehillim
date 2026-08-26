import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Message } from "./Message";

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

/** Keeps a render failure to a stated message rather than a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled render error", error, info.componentStack);
  }

  override render(): ReactNode {
    const { failed } = this.state;
    const { children } = this.props;
    if (!failed) return children;
    return (
      <Message alert>
        Something went wrong rendering this page. Reloading usually clears it.
      </Message>
    );
  }
}
