// Server-side Sentry (the Node process Passenger runs on cPanel), tuned to
// stay inside the free Developer plan: errors from pages and API routes, a
// 10% sample of request traces, and console warnings and errors as Sentry
// logs (searchable in Sentry instead of tailing ~/prod/stderr.log).
// SENTRY_DSN in the server's .env wins, falling back to the build-time
// PUBLIC_SENTRY_DSN.
import * as Sentry from '@sentry/astro';

const dsn = process.env.SENTRY_DSN || import.meta.env.PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && import.meta.env.PROD,
  environment: import.meta.env.MODE,
  release: import.meta.env.PUBLIC_SENTRY_RELEASE || undefined,
  sendDefaultPii: false,
  integrations: [Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })],
  tracesSampleRate: 0.1,
  enableLogs: true,
});
