/**
 * Fire a GA4 custom event, if analytics has actually loaded.
 *
 * `window.gtag` only exists once a visitor has accepted the analytics
 * cookie category (see CookieConsent.astro) and the provider is set to
 * Google Analytics 4 — before that, or with a different provider, this is
 * a silent no-op rather than a runtime error.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
