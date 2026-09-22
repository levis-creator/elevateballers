import { prisma } from '@/lib/prisma';
import {
  fmtDate,
  fmtWhen,
  homeName,
  awayName,
  homeNickname,
  awayNickname,
  leagueOf,
} from '@/features/teams/domain/usecases/match-format';
import { getDisplayImageUrl } from '@/lib/asset-url';

export type LineupCount = { players: number; starters: number };

/** Counts each match's listed players and starters for one team. */
export async function getLineupCounts(matchIds: string[], teamId: string) {
  const counts = new Map<string, LineupCount>();
  if (!matchIds.length) return counts;
  const rows = await prisma.matchPlayer.findMany({
    where: { matchId: { in: matchIds }, teamId },
    select: { matchId: true, started: true },
  });
  for (const row of rows) {
    const entry = counts.get(row.matchId) ?? { players: 0, starters: 0 };
    entry.players += 1;
    if (row.started) entry.starters += 1;
    counts.set(row.matchId, entry);
  }
  return counts;
}

/** Maps a match (with team relations) to the given team's point of view. */
export function toTeamFixture(m: any, teamId: string, lineups: Map<string, LineupCount>) {
  const isHome = (m.team1?.id ?? m.team1Id) === teamId;
  const hasScore = m.team1Score != null && m.team2Score != null;
  const teamScore: number | null = hasScore ? (isHome ? m.team1Score : m.team2Score) : null;
  const oppScore: number | null = hasScore ? (isHome ? m.team2Score : m.team1Score) : null;
  const result =
    m.status === 'COMPLETED' && teamScore != null && oppScore != null
      ? teamScore > oppScore
        ? 'win'
        : teamScore < oppScore
          ? 'loss'
          : 'draw'
      : null;
  return {
    id: m.id as string,
    href: `/matches/${m.slug || m.id}`,
    date: m.date as Date,
    when: fmtWhen(m.date),
    dateLabel: fmtDate(m.date),
    status: m.status as 'UPCOMING' | 'LIVE' | 'COMPLETED',
    stage: m.stage ?? null,
    league: leagueOf(m),
    isHome,
    opponent: {
      name: isHome ? awayName(m) : homeName(m),
      nickname: isHome ? awayNickname(m) : homeNickname(m),
      logo: getDisplayImageUrl(isHome ? m.team2?.logo || m.team2Logo : m.team1?.logo || m.team1Logo),
    },
    teamScore,
    oppScore,
    result,
    // Lineup status is only meaningful before and during a match.
    lineup: m.status === 'COMPLETED' ? null : (lineups.get(m.id) ?? { players: 0, starters: 0 }),
  };
}

export type TeamFixture = ReturnType<typeof toTeamFixture>;
