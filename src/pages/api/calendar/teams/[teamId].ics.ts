import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const prerender = false;

const escapeIcs = (value: string) => value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replace(/\r?\n/g, '\\n');
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

export const GET: APIRoute = async ({ params }) => {
  const teamId = params.teamId;
  if (!teamId) return new Response('Team is required', { status: 400 });
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true, slug: true } });
  if (!team) return new Response('Team not found', { status: 404 });
  const matches = await prisma.match.findMany({
    where: { status: { in: ['UPCOMING', 'LIVE'] }, OR: [{ team1Id: teamId }, { team2Id: teamId }] },
    include: { team1: { select: { name: true, venue: true } }, team2: { select: { name: true, venue: true } }, league: { select: { name: true } } },
    orderBy: { date: 'asc' },
  });
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Elevate Ballers//Team Fixtures//EN', `X-WR-CALNAME:${escapeIcs(`${team.name} fixtures`)}`];
  for (const match of matches) {
    const end = new Date(match.date.getTime() + 2 * 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT', `UID:${match.id}@elevateballers.com`, `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(match.date)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeIcs(`${match.team1?.name ?? match.team1Name ?? 'TBD'} vs ${match.team2?.name ?? match.team2Name ?? 'TBD'}`)}`,
      `DESCRIPTION:${escapeIcs(match.league?.name ?? match.leagueName ?? 'Elevate Ballers')}`,
      `LOCATION:${escapeIcs(match.team1?.venue ?? match.team2?.venue ?? 'TBA')}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${team.slug}-fixtures.ics"`,
      'Cache-Control': 'public, s-maxage=300',
    },
  });
};
