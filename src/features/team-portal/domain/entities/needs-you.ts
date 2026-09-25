export const LINEUP_REMINDER_DAYS = 7;
/** How long a league-office roster decision stays on the coach's list. */
export const ROSTER_DECISION_DAYS = 14;

export const ROSTER_DECISION_ACTIONS = [
  'ROSTER_APPROVED',
  'ROSTER_REJECTED',
  'ROSTER_EDIT_REJECTED',
  'ROSTER_REMOVAL_APPROVED',
  'ROSTER_REMOVAL_REJECTED',
  'ROSTER_DROPPED_OUT',
  'ROSTER_REINSTATED',
  'TRANSFER_OUT',
  'TRANSFER_IN',
] as const;
export type RosterDecisionAction = (typeof ROSTER_DECISION_ACTIONS)[number];

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
  /** League-office decisions on this team's roster within ROSTER_DECISION_DAYS, newest first. */
  recentDecisions?: { id: string; action: RosterDecisionAction; playerName: string; at: Date; otherTeam?: string | null }[];
};

const DECISION_COPY: Record<RosterDecisionAction, (name: string, otherTeam: string) => { title: string; detail: string }> = {
  ROSTER_APPROVED: (name) => ({ title: `${name} approved`, detail: 'Cleared by the league office and can now be named in lineups.' }),
  ROSTER_REJECTED: (name) => ({ title: `${name} not approved`, detail: 'The league office declined this player proposal.' }),
  ROSTER_EDIT_REJECTED: (name) => ({ title: `Changes to ${name} declined`, detail: 'The player stays on the roster with their earlier details.' }),
  ROSTER_REMOVAL_APPROVED: (name) => ({ title: `${name} removed`, detail: 'The league office approved your removal request.' }),
  ROSTER_REMOVAL_REJECTED: (name) => ({ title: `Removal of ${name} declined`, detail: 'The player stays on your roster.' }),
  ROSTER_DROPPED_OUT: (name) => ({ title: `${name} dropped out`, detail: 'Recorded as having left the league; their roster spot is free.' }),
  ROSTER_REINSTATED: (name) => ({ title: `${name} reinstated`, detail: 'Back on your roster and can be named in lineups.' }),
  TRANSFER_OUT: (name, otherTeam) => ({ title: `${name} transferred out`, detail: `Moved by the league office to ${otherTeam} and removed from your upcoming lineups.` }),
  TRANSFER_IN: (name, otherTeam) => ({ title: `${name} joined your roster`, detail: `Transferred by the league office from ${otherTeam}; they can be named in lineups.` }),
};

const shortDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

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

  for (const decision of input.recentDecisions ?? []) {
    const copy = DECISION_COPY[decision.action](decision.playerName, decision.otherTeam || 'another team');
    items.push({
      key: `roster-decision-${decision.id}`,
      kind: 'info',
      title: copy.title,
      detail: `${copy.detail} · ${shortDate(decision.at)}`,
      target: { view: 'roster' },
    });
  }

  return items;
}
