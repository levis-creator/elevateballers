// Browser-side Sentry. Reports uncaught errors only: no performance tracing or
// session replay, which keeps usage inside Sentry's free Developer plan.
// PUBLIC_SENTRY_DSN is inlined at build time; without it Sentry stays off.
// Events go through this site's own /api/monitoring tunnel so ad blockers
// that block *.sentry.io don't drop them.
import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  tunnel: '/api/monitoring',
  enabled: Boolean(dsn) && import.meta.env.PROD,
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
