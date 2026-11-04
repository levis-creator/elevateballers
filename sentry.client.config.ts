// Browser-side Sentry, tuned to stay inside the free Developer plan:
// - errors, with a session replay only for page views that hit an error
//   (the plan includes 50 replays a month; text and media are masked)
// - a 10% sample of page-load and navigation traces
// - console warnings and errors as Sentry logs
// - a "Report a bug" button that sends visitor feedback to Sentry
// PUBLIC_SENTRY_DSN is inlined at build time; without it Sentry stays off.
// Events go through this site's own /api/monitoring tunnel so ad blockers
// that block *.sentry.io don't drop them.
//
// Replay and the feedback button are loaded once the page is idle (see
// src/lib/sentryDeferredIntegrations.ts): they are most of the SDK's size, and
// loading them up front delayed every page. An error in the first moments of a
// visit is still reported, just without a replay.
import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
// Search-engine renderers (Googlebot, Bingbot...) cut off script fetches, so
// their page views report chunk-load failures no visitor sees, and they spend
// the free plan's quota. Leave Sentry off for them.
// Crawlers name themselves "Googlebot/2.1" etc.; a bare "bot" would also hit
// phone models such as CUBOT.
const isCrawler = /(bot|crawler|spider)\/|\bbot\b|slurp|HeadlessChrome|Lighthouse/i.test(navigator.userAgent);
const enabled = Boolean(dsn) && import.meta.env.PROD && !isCrawler;

Sentry.init({
  dsn,
  tunnel: '/api/monitoring',
  enabled,
  environment: import.meta.env.MODE,
  release: import.meta.env.PUBLIC_SENTRY_RELEASE || undefined,
  sendDefaultPii: false,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
  ],
  tracesSampleRate: 0.1,
  // Keep traces on this site; don't add trace headers to Supabase, R2 etc.
  tracePropagationTargets: [/^\//],
  // Astro's page transitions: a second click (or Back) while one is animating
  // makes the browser cancel the old transition and reject it. The visitor
  // just lands on the newer page, so these are not errors.
  ignoreErrors: [
    /view transition aborted/i,
    /Skipped ViewTransition/i,
    /Transition was (aborted|skipped)/i,
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});

if (enabled) {
  const loadDeferred = () => {
    import('./src/lib/sentryDeferredIntegrations')
      .then(({ addDeferredIntegrations }) => addDeferredIntegrations())
      .catch(() => {
        // A failed chunk load only costs replay and the feedback button.
      });
  };
  const whenIdle = () =>
    'requestIdleCallback' in window
      ? window.requestIdleCallback(loadDeferred, { timeout: 4000 })
      : setTimeout(loadDeferred, 1500);
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}
