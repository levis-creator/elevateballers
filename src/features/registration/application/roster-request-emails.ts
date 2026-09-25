import { prisma } from '@/lib/prisma';
import { publishToJob } from '@/lib/qstash';
import { sendAdminNotificationEmail } from '@/lib/email';
import { C, SITE_URL } from '@/lib/email/config';
import { btn, emailWrapper, sendTransactionalEmail } from '@/lib/email/core';

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
const site = () => (process.env.SITE_URL || SITE_URL).replace(/\/$/, '');

/**
 * Queue on QStash when configured; otherwise send inline (a background send can
 * be cut off once a serverless response returns). Email failures never fail the
 * request that triggered them.
 */
async function queueOrSend(jobType: string, data: Record<string, unknown>, sendNow: () => Promise<void>) {
  try {
    if (await publishToJob('/api/jobs/send-email', { jobType, data })) return;
    await sendNow();
  } catch (error) {
    console.error(`[roster-email] ${jobType} failed:`, error);
  }
}

export type RosterRequestAlert = {
  kind: 'NEW' | 'REMOVAL';
  playerName: string;
  teamName: string;
  coachName: string | null;
  jerseyNumber?: number | null;
  position?: string | null;
  note?: string | null;
};

/** Emails every admin whose "Coach roster requests" notification is on. */
export async function notifyAdminsOfRosterRequest(alert: RosterRequestAlert) {
  const who = esc(alert.coachName || 'A coach');
  const player = `<strong>${esc(alert.playerName)}</strong>`;
  const team = `<strong>${esc(alert.teamName)}</strong>`;
  const details = [
    alert.jerseyNumber != null ? `#${alert.jerseyNumber}` : null,
    alert.position ? esc(alert.position) : null,
  ].filter(Boolean);
  const data = {
    type: 'roster_request' as const,
    title: alert.kind === 'NEW' ? 'New player proposed' : 'Player removal requested',
    message:
      (alert.kind === 'NEW'
        ? `${who} proposed ${player}${details.length ? ` (${details.join(' · ')})` : ''} for ${team}.`
        : `${who} asked to remove ${player} from ${team}.`) +
      (alert.note ? `<br /><br />Note: “${esc(alert.note)}”` : ''),
    actionUrl: `${site()}/admin/registrations?kind=ROSTER`,
    actionText: 'Review request',
  };
  await queueOrSend('admin_notification', data, () => sendAdminNotificationEmail(data));
}

export type RosterDecision = {
  type: 'NEW' | 'EDIT' | 'REMOVAL';
  approved: boolean;
  playerName: string;
  teamId: string;
  teamName: string;
  coachId: string | null;
};

const decisionLine = (d: RosterDecision) => {
  const player = esc(d.playerName);
  if (d.type === 'REMOVAL')
    return d.approved
      ? `${player} has been removed from the roster.`
      : `Your request to remove ${player} was declined. They stay on the roster.`;
  if (d.type === 'EDIT')
    return d.approved ? `The changes to ${player} were approved.` : `The changes to ${player} were declined.`;
  return d.approved
    ? `${player} is approved and can now be named in lineups.`
    : `${player} was not approved for the roster.`;
};

export async function sendRosterDecisionEmail(data: {
  to: string;
  coachName: string | null;
  teamId: string;
  teamName: string;
  lines: string[];
  approvedCount: number;
  rejectedCount: number;
}) {
  const subject =
    data.rejectedCount && !data.approvedCount
      ? `Roster request declined · ${data.teamName}`
      : data.approvedCount && !data.rejectedCount
        ? `Roster request approved · ${data.teamName}`
        : `Roster requests reviewed · ${data.teamName}`;
  const html = emailWrapper(`
    <h2 style="margin:0 0 12px;font-size:22px;color:${C.primary};font-family:'Anton','Arial Black',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Roster update</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${esc(data.coachName || 'Coach')},</p>
    <p style="margin:0 0 12px;font-size:15px;color:${C.text};line-height:1.7;">The league office reviewed your roster request${data.lines.length === 1 ? '' : 's'} for <strong>${esc(data.teamName)}</strong>:</p>
    <ul style="margin:0 0 8px;padding-left:20px;font-size:15px;color:${C.text};line-height:1.7;">
      ${data.lines.map((line) => `<li>${line}</li>`).join('')}
    </ul>
    ${btn('Open Team Portal', `${site()}/team-portal?team=${encodeURIComponent(data.teamId)}&view=roster`)}
  `);
  await sendTransactionalEmail({
    to: data.to,
    subject,
    html,
    audit: { template: 'roster_decision', context: { teamId: data.teamId } },
  });
}

/** Tells each coach who proposed a change what the league office decided, one email per coach and team. */
export async function notifyCoachesOfRosterDecisions(decisions: RosterDecision[]) {
  const coachIds = [...new Set(decisions.map((d) => d.coachId).filter((id): id is string => Boolean(id)))];
  if (!coachIds.length) return;
  const coaches = await prisma.user.findMany({
    where: { id: { in: coachIds } },
    select: {
      id: true,
      name: true,
      email: true,
      notificationSettings: { select: { enabled: true, emailEnabled: true } },
    },
  });
  for (const coach of coaches) {
    const settings = coach.notificationSettings;
    if (!coach.email || settings?.enabled === false || settings?.emailEnabled === false) continue;
    const byTeam = new Map<string, RosterDecision[]>();
    for (const d of decisions)
      if (d.coachId === coach.id) byTeam.set(d.teamId, [...(byTeam.get(d.teamId) ?? []), d]);
    for (const [teamId, items] of byTeam) {
      const data = {
        to: coach.email,
        coachName: coach.name,
        teamId,
        teamName: items[0].teamName,
        lines: items.map(decisionLine),
        approvedCount: items.filter((d) => d.approved).length,
        rejectedCount: items.filter((d) => !d.approved).length,
      };
      await queueOrSend('roster_decision', data, () => sendRosterDecisionEmail(data));
    }
  }
}
