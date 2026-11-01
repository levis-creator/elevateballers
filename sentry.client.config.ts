// Browser-side Sentry, tuned to stay inside the free Developer plan:
// - errors, with a session replay only for page views that hit an error
//   (the plan includes 50 replays a month; text and media are masked)
// - a 10% sample of page-load and navigation traces
// - console warnings and errors as Sentry logs
// - a "Report a bug" button that sends visitor feedback to Sentry
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
  release: import.meta.env.PUBLIC_SENTRY_RELEASE || undefined,
  sendDefaultPii: false,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    Sentry.feedbackIntegration({
      // Public pages only; the floating button would sit over admin controls.
      autoInject: !window.location.pathname.startsWith('/admin'),
      colorScheme: 'system',
      showBranding: false,
      triggerLabel: 'Report a bug',
      formTitle: 'Report a bug',
      messagePlaceholder: 'What went wrong? What did you expect to happen?',
      submitButtonLabel: 'Send report',
      successMessageText: 'Thanks! Your report has been sent.',
      isNameRequired: false,
      isEmailRequired: false,
    }),
  ],
  tracesSampleRate: 0.1,
  // Keep traces on this site; don't add trace headers to Supabase, R2 etc.
  tracePropagationTargets: [/^\//],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});
