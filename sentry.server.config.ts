// Server-side Sentry (the Node process Passenger runs on cPanel). Reports
// errors thrown while rendering pages and API routes; tracing stays off to
// keep usage inside Sentry's free Developer plan. SENTRY_DSN in the server's
// .env wins, falling back to the build-time PUBLIC_SENTRY_DSN.
import * as Sentry from '@sentry/astro';

const dsn = process.env.SENTRY_DSN || import.meta.env.PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && import.meta.env.PROD,
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  tracesSampleRate: 0,
});
