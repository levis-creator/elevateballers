import { createHash } from 'node:crypto';
import { sendAdminNotificationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/email/config';
import { escapeEmailHtml as esc, queueOrSend } from '@/lib/email/queue-or-send';

export type LineupPlayer = { playerId: string; name: string; jerseyNumber: number | null };

export type LineupSubmittedAlert = {
  matchId: string;
  teamId: string;
  teamName: string;
  coachName: string | null;
  opponent: string;
  isHome: boolean;
  when: string;
  /** The squad before this save ([] when there was none), as `playerId` + `started`. */
  previous: { playerId: string; started: boolean }[];
  starters: LineupPlayer[];
  bench: LineupPlayer[];
};

const site = () => (process.env.SITE_URL || SITE_URL).replace(/\/$/, '');
const playerList = (players: LineupPlayer[]) =>
  players.length
    ? players.map((p) => `${p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}${esc(p.name)}`).join(', ')
    : '<em>none</em>';

const squadOf = (rows: { playerId: string; started: boolean }[]) =>
  rows
    .map((p) => `${p.playerId}:${p.started ? 'S' : 'B'}`)
    .sort()
    .join(',');

const newSquad = (alert: Pick<LineupSubmittedAlert, 'starters' | 'bench'>) =>
  squadOf([
    ...alert.starters.map((p) => ({ playerId: p.playerId, started: true })),
    ...alert.bench.map((p) => ({ playerId: p.playerId, started: false })),
  ]);

/** True when the save changed who is listed or who starts. */
export const lineupChanged = (alert: Pick<LineupSubmittedAlert, 'previous' | 'starters' | 'bench'>) =>
  squadOf(alert.previous) !== newSquad(alert);

/**
 * Names this change of lineup (squad before -> squad after), so a retried
 * request or repeated job never re-mails an admin about the same change,
 * while switching back to an earlier squad is still a new, mailed change.
 */
export function lineupEmailKey(alert: Pick<LineupSubmittedAlert, 'matchId' | 'teamId' | 'previous' | 'starters' | 'bench'>) {
  const change = `${squadOf(alert.previous)}>${newSquad(alert)}`;
  const hash = createHash('sha256').update(change).digest('hex').slice(0, 32);
  return `lineup:${alert.matchId}:${alert.teamId}:${hash}`;
}

/** Emails every admin whose "Lineup submissions" notification is on. */
export async function notifyAdminsOfLineup(alert: LineupSubmittedAlert) {
  if (!lineupChanged(alert)) return;
  const isUpdate = alert.previous.length > 0;
  const team = `<strong>${esc(alert.teamName)}</strong>`;
  const fixture = `${alert.isHome ? 'vs' : '@'} ${esc(alert.opponent)} · ${esc(alert.when)}`;
  const total = alert.starters.length + alert.bench.length;
  const data = {
    idempotencyKey: lineupEmailKey(alert),
    type: 'lineup_submitted' as const,
    title: `${isUpdate ? 'Lineup updated' : 'Lineup submitted'}: ${alert.teamName}`,
    message: total
      ? `${esc(alert.coachName || 'A coach')} ${isUpdate ? 'updated' : 'submitted'} the lineup for ${team} (${fixture}).` +
        `<br /><br /><strong>Starters (${alert.starters.length}):</strong> ${playerList(alert.starters)}` +
        `<br /><strong>Bench (${alert.bench.length}):</strong> ${playerList(alert.bench)}`
      : `${esc(alert.coachName || 'A coach')} cleared the lineup for ${team} (${fixture}). No players are listed now.`,
    actionUrl: `${site()}/admin/matches/${encodeURIComponent(alert.matchId)}`,
    actionText: 'View match',
  };
  await queueOrSend('admin_notification', data, () => sendAdminNotificationEmail(data));
}
