// Session replay and the "Report a bug" button are most of the Sentry bundle.
// sentry.client.config.ts imports this file dynamically once the page is idle,
// so they load in their own chunk instead of delaying every page.
import { addIntegration } from '@sentry/astro';
import { replayIntegration } from '@sentry/replay';
import {
  buildFeedbackIntegration,
  feedbackModalIntegration,
  feedbackScreenshotIntegration,
} from '@sentry/feedback';

const feedbackIntegration = buildFeedbackIntegration({
  getModalIntegration: () => feedbackModalIntegration,
  getScreenshotIntegration: () => feedbackScreenshotIntegration,
});

export function addDeferredIntegrations(): void {
  addIntegration(replayIntegration({ maskAllText: true, blockAllMedia: true }));
  addIntegration(
    feedbackIntegration({
      // Public pages only: the floating button would sit over admin controls
      // and the team portal's fixed bottom navigation on phones.
      autoInject: !/^\/(admin|team-portal)(\/|$)/.test(window.location.pathname),
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
  );
}
