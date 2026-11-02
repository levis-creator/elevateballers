import { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/astro';

declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (errorCode: string) => boolean | void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          appearance?: 'always' | 'execute' | 'interaction-only';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface Props {
  siteKey: string;
  /** Changing this value removes the consumed widget and renders a fresh challenge. */
  resetKey?: string | number;
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  /** Optional Cloudflare render options (default to the widget's defaults). */
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// Cloudflare raises these in the visitor's browser (300xxx/600xxx usually mean
// an extension, VPN or automated browser failed the check). Report one per
// widget so we can see how often real visitors get stuck.
function reportTurnstileError(errorCode: string) {
  Sentry.captureMessage(`Turnstile error ${errorCode}`, {
    level: 'warning',
    tags: { turnstile_code: errorCode },
    fingerprint: ['turnstile-error', errorCode],
  });
}

export default function TurnstileWidget({ siteKey, resetKey, onSuccess, onExpire, onError, theme, size, appearance }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const reportedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    reportedRef.current = false;
    setFailed(false);

    const render = () => {
      if (cancelled || !containerRef.current) return;
      // Clear any previous render in this container
      containerRef.current.innerHTML = '';
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          setFailed(false);
          onSuccess(token);
        },
        'expired-callback': onExpire ?? (() => {}),
        'error-callback': (errorCode) => {
          setFailed(true);
          if (!reportedRef.current) {
            reportedRef.current = true;
            reportTurnstileError(errorCode);
          }
          onError?.();
          // Handled: Turnstile skips its console error but keeps retrying.
          return true;
        },
        ...(theme ? { theme } : {}),
        ...(size ? { size } : {}),
        ...(appearance ? { appearance } : {}),
      });
    };

    if (typeof window.turnstile !== 'undefined') {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      // Script is already in DOM but not yet loaded — poll until ready
      const interval = setInterval(() => {
        if (typeof window.turnstile !== 'undefined') {
          clearInterval(interval);
          render();
        }
      }, 50);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && typeof window.turnstile !== 'undefined') {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget may already be gone
        }
      }
    };
  }, [siteKey, resetKey]);

  const retry = () => {
    setFailed(false);
    if (widgetIdRef.current != null && typeof window.turnstile !== 'undefined') {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  return (
    <div style={{ margin: '12px 0' }}>
      <div ref={containerRef} />
      {failed && (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.4 }}>
          Verification didn't complete. If you use a VPN or ad blocker, pause it, then{' '}
          <button type="button" onClick={retry} style={{ padding: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
            try again
          </button>
          .
        </p>
      )}
    </div>
  );
}
