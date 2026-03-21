import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Label shown in the fallback, e.g. "News Feed" */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Lightweight error boundary for smaller page sections.
 * Renders a compact inline fallback rather than a full-page error.
 *
 * Usage:
 *   <SectionErrorBoundary label="News Feed">
 *     <NewsFeed />
 *   </SectionErrorBoundary>
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const label = this.props.label ?? 'section';
    console.error(`[SectionErrorBoundary] Error in "${label}":`, error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const label = this.props.label ?? 'This section';
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: '#fff5f5',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontFamily: 'sans-serif',
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>⚠️</span>
          <span style={{ flex: 1 }}>
            <strong>{label}</strong> failed to load.
          </span>
          <button
            onClick={this.reset}
            style={{
              background: 'none',
              border: '1px solid #fca5a5',
              borderRadius: '0.25rem',
              color: '#991b1b',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
