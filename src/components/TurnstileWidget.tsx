import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface Props {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export default function TurnstileWidget({ siteKey, onSuccess, onExpire, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current) return;
      // Clear any previous render in this container
      containerRef.current.innerHTML = '';
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onSuccess,
        'expired-callback': onExpire ?? (() => {}),
        'error-callback': onError ?? (() => {}),
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
  }, [siteKey]);

  return <div ref={containerRef} style={{ margin: '12px 0' }} />;
}
