import { prisma } from '@/lib/prisma';
import { C, SITE_URL } from '@/lib/email/config';
import { btn, emailWrapper, sendTransactionalEmail } from '@/lib/email/core';
import { escapeEmailHtml as esc, queueOrSend } from '@/lib/email/queue-or-send';

const site = () => (process.env.SITE_URL || SITE_URL).replace(/\/$/, '');

export type PlayerTransferNotice = {
  transferId: string;
  playerName: string;
  fromTeamId: string;
  fromTeamName: string;
  toTeamId: string;
  toTeamName: string;
};

type TransferEmail = {
  to: string;
  coachName: string | null;
  teamId: string;
  teamName: string;
  playerName: string;
  otherTeamName: string;
  direction: 'OUT' | 'IN';
  idempotencyKey: string;
};

export async function sendPlayerTransferEmail(data: TransferEmail) {
  const player = `<strong>${esc(data.playerName)}</strong>`;
  const line =
    data.direction === 'OUT'
      ? `${player} has been transferred from <strong>${esc(data.teamName)}</strong> to <strong>${esc(data.otherTeamName)}</strong>. They are off your roster and out of your upcoming lineups.`
      : `${player} has joined <strong>${esc(data.teamName)}</strong> from <strong>${esc(data.otherTeamName)}</strong> and is on your roster, ready to be named in lineups.`;
  const html = emailWrapper(`
    <h2 style="margin:0 0 12px;font-size:22px;color:${C.primary};font-family:'Anton','Arial Black',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Player transfer</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${esc(data.coachName || 'Coach')},</p>
    <p style="margin:0 0 12px;font-size:15px;color:${C.text};line-height:1.7;">${line}</p>
    ${btn('Open Team Portal', `${site()}/team-portal?team=${encodeURIComponent(data.teamId)}&view=roster`)}
  `);
  await sendTransactionalEmail({
    to: data.to,
    subject: `${data.direction === 'OUT' ? 'Player transferred out' : 'New player'} · ${data.teamName}`,
    html,
    idempotencyKey: data.idempotencyKey,
    audit: { template: 'player_transfer', context: { teamId: data.teamId } },
  });
}

/** Emails the coaches of both teams once an admin has moved a player between them. */
export async function notifyCoachesOfTransfer(notice: PlayerTransferNotice) {
  const now = new Date();
  const owners = await prisma.teamOwnership.findMany({
    where: {
      teamId: { in: [notice.fromTeamId, notice.toTeamId] },
      revokedAt: null,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    select: {
      teamId: true,
      email: true,
      user: { select: { name: true, email: true, notificationSettings: { select: { enabled: true, emailEnabled: true } } } },
    },
  });
  const sent = new Set<string>();
  for (const owner of owners) {
    const settings = owner.user?.notificationSettings;
    if (settings?.enabled === false || settings?.emailEnabled === false) continue;
    const to = (owner.user?.email || owner.email || '').trim().toLowerCase();
    if (!to || sent.has(`${owner.teamId}:${to}`)) continue;
    sent.add(`${owner.teamId}:${to}`);
    const out = owner.teamId === notice.fromTeamId;
    const data: TransferEmail = {
      to,
      coachName: owner.user?.name ?? null,
      teamId: owner.teamId,
      teamName: out ? notice.fromTeamName : notice.toTeamName,
      otherTeamName: out ? notice.toTeamName : notice.fromTeamName,
      playerName: notice.playerName,
      direction: out ? 'OUT' : 'IN',
      idempotencyKey: `player-transfer:${notice.transferId}:${owner.teamId}`,
    };
    await queueOrSend('player_transfer', data, () => sendPlayerTransferEmail(data));
  }
}
