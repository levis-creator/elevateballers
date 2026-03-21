import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. Receives error and reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

/**
 * Full error boundary for wrapping major UI sections.
 * Catches unhandled React render/lifecycle errors and renders a fallback UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * With custom fallback:
 *   <ErrorBoundary fallback={(err, reset) => <MyFallback error={err} onReset={reset} />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            background: '#f9fafb',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              padding: '2rem 2.5rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h2 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              An unexpected error occurred in this section. You can try again or refresh the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  Error details (dev only)
                </summary>
                <pre
                  style={{
                    background: '#f3f4f6',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.7rem',
                    overflowX: 'auto',
                    color: '#ef4444',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.reset}
                style={{
                  background: '#dd3333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
