export const LINEUP_REMINDER_DAYS = 7;

export type NeedsYouTarget = { view: 'lineup' | 'register' | 'roster'; matchId?: string };

export type NeedsYouItem = {
  key: string;
  /** `action` needs the coach to do something; `info` is waiting on the league office. */
  kind: 'action' | 'info';
  title: string;
  detail: string;
  target: NeedsYouTarget;
};

export type NeedsYouInput = {
  now: Date;
  hasActiveSeason: boolean;
  registered: boolean;
  nextMatch: {
    id: string;
    date: Date;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
    opponent: string;
    lineupPlayers: number;
  } | null;
  latestApplication: {
    status: 'PENDING' | 'OWNERSHIP_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    adminNotes: string | null;
  } | null;
  pendingPlayers: number;
  pendingRemovals: number;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Builds the team's to-do list, most urgent first. */
export function buildNeedsYou(input: NeedsYouInput): NeedsYouItem[] {
  const items: NeedsYouItem[] = [];
  const { nextMatch, latestApplication } = input;

  if (
    nextMatch &&
    nextMatch.status === 'UPCOMING' &&
    nextMatch.lineupPlayers === 0 &&
    nextMatch.date.getTime() - input.now.getTime() <= LINEUP_REMINDER_DAYS * 86_400_000
  ) {
    items.push({
      key: `lineup-${nextMatch.id}`,
      kind: 'action',
      title: 'Submit your lineup',
      detail: `No players are listed yet for the match against ${nextMatch.opponent}.`,
      target: { view: 'lineup', matchId: nextMatch.id },
    });
  }

  if (!input.registered && input.hasActiveSeason) {
    if (latestApplication?.status === 'PENDING' || latestApplication?.status === 'OWNERSHIP_VERIFICATION') {
      items.push({
        key: 'registration-pending',
        kind: 'info',
        title: 'Season entry under review',
        detail: 'The league office is reviewing your entry. Nothing is needed from you yet.',
        target: { view: 'register' },
      });
    } else if (latestApplication?.status === 'REJECTED') {
      items.push({
        key: 'registration-rejected',
        kind: 'action',
        title: 'Season entry was not approved',
        detail: latestApplication.adminNotes?.trim() || 'Review the entry and submit it again.',
        target: { view: 'register' },
      });
    } else {
      items.push({
        key: 'registration-missing',
        kind: 'action',
        title: 'Register for the season',
        detail: 'Your team has not entered the active season yet.',
        target: { view: 'register' },
      });
    }
  }

  const awaiting = [
    input.pendingPlayers ? plural(input.pendingPlayers, 'player proposal') : null,
    input.pendingRemovals ? plural(input.pendingRemovals, 'removal request') : null,
  ].filter(Boolean);
  if (awaiting.length) {
    items.push({
      key: 'roster-pending',
      kind: 'info',
      title: 'Roster changes awaiting the league office',
      detail: `${awaiting.join(' and ')} pending approval.`,
      target: { view: 'roster' },
    });
  }

  return items;
}
