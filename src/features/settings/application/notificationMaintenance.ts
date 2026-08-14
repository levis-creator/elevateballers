import { prisma } from '../../../lib/prisma';
import { SITE_URL } from '../../../lib/email/config';
import { sendMatchReminderEmail } from '../../../lib/email';
import { hashValue } from '../../../lib/email/providers';
import { getRuntimeEmailTemplates } from '../../../lib/email/runtime-settings';

type MatchRecipient = { email: string; name: string };

function collectRecipients(team: any, staff: any[]): MatchRecipient[] {
  const recipients = new Map<string, string>();
  if (team?.contactEmail) recipients.set(String(team.contactEmail).trim().toLowerCase(), team.name);
  for (const relation of staff) {
    if (relation.teamId !== team?.id || !relation.staff?.email) continue;
    recipients.set(String(relation.staff.email).trim().toLowerCase(), `${relation.staff.firstName} ${relation.staff.lastName}`.trim());
  }
  return [...recipients].map(([email, name]) => ({ email, name }));
}

export async function notifyMatchParticipants(matchId: string): Promise<number> {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { team1: true, team2: true } });
  if (!match || match.status !== 'UPCOMING') return 0;
  const teamIds = [match.team1Id, match.team2Id].filter((id): id is string => Boolean(id));
  const staff = teamIds.length ? await prisma.teamStaff.findMany({
    where: { teamId: { in: teamIds }, role: { in: ['COACH', 'MANAGER'] } }, include: { staff: true },
  }) : [];
  let sent = 0;
  for (const side of [
    { team: match.team1, opponent: match.team2?.name || match.team2Name || 'TBC' },
    { team: match.team2, opponent: match.team1?.name || match.team1Name || 'TBC' },
  ]) {
    if (!side.team) continue;
    for (const recipient of collectRecipients(side.team, staff)) {
      await sendMatchReminderEmail({
        name: recipient.name, email: recipient.email, team: side.team.name, opponent: side.opponent,
        matchDate: new Intl.DateTimeFormat('en-KE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(match.date),
        venue: side.team.venue || match.team1?.venue || match.team2?.venue || 'Venue to be confirmed',
        link: `${SITE_URL.replace(/\/$/, '')}/matches/${match.slug || match.id}`,
        matchId: match.id,
      });
      sent += 1;
    }
  }
  return sent;
}

export async function sendDueMatchReminders(now = new Date()): Promise<{ matches: number; sent: number; skipped: number }> {
  const templates = await getRuntimeEmailTemplates();
  if (!templates.match.enabled) return { matches: 0, sent: 0, skipped: 0 };
  const from = new Date(now.getTime() + templates.matchLead * 86_400_000);
  const to = new Date(from.getTime() + 65 * 60_000);
  const matches = await prisma.match.findMany({
    where: { status: 'UPCOMING', date: { gte: from, lt: to } },
    include: { team1: true, team2: true },
    orderBy: { date: 'asc' },
  });
  const teamIds = [...new Set(matches.flatMap((match) => [match.team1Id, match.team2Id]).filter((id): id is string => Boolean(id)))];
  const staff = teamIds.length ? await prisma.teamStaff.findMany({
    where: { teamId: { in: teamIds }, role: { in: ['COACH', 'MANAGER'] } },
    include: { staff: true },
  }) : [];
  let sent = 0;
  let skipped = 0;
  for (const match of matches) {
    const sides = [
      { team: match.team1, opponent: match.team2?.name || match.team2Name || 'TBC' },
      { team: match.team2, opponent: match.team1?.name || match.team1Name || 'TBC' },
    ];
    for (const side of sides) {
      if (!side.team) continue;
      for (const recipient of collectRecipients(side.team, staff)) {
        const marker = `match-reminder:${match.id}:${hashValue(recipient.email)}`;
        const delivered = await prisma.userAuditLog.findFirst({ where: { userId: marker, action: 'MATCH_REMINDER_DISPATCHED' }, select: { id: true } });
        if (delivered) { skipped += 1; continue; }
        await sendMatchReminderEmail({
          name: recipient.name,
          email: recipient.email,
          team: side.team.name,
          opponent: side.opponent,
          matchDate: new Intl.DateTimeFormat('en-KE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(match.date),
          venue: side.team.venue || match.team1?.venue || match.team2?.venue || 'Venue to be confirmed',
          link: `${SITE_URL.replace(/\/$/, '')}/matches/${match.slug || match.id}`,
          matchId: match.id,
        });
        await prisma.userAuditLog.create({ data: { userId: marker, action: 'MATCH_REMINDER_DISPATCHED', performedBy: 'system', metadata: { matchId: match.id, recipientHash: hashValue(recipient.email) } } });
        sent += 1;
      }
    }
  }
  return { matches: matches.length, sent, skipped };
}
