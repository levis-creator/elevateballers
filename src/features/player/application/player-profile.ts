import { prisma } from '../../../lib/prisma';

const eventPoints: Record<string, number> = { TWO_POINT_MADE: 2, THREE_POINT_MADE: 3, FREE_THROW_MADE: 1 };

export async function getPlayerProfile(playerId: string, includePrivate = false) {
  const db = prisma as any;
  // Keep the profile request focused on identity data. Registration history is
  // loaded by getPlayerRegistrationHistory; joining the full roster/league
  // graph here made the profile endpoint unnecessarily fragile in production.
  return db.player.findUnique({ where: { id: playerId }, include: { team: true } });
}

export async function getPlayerRegistrationHistory(playerId: string) {
  const db = prisma as any;
  const [notifications, rosterChanges, history] = await Promise.all([
    db.registrationNotification.findMany({ where: { playerId }, orderBy: { createdAt: 'desc' } }),
    db.seasonRegistrationRosterChange.findMany({ where: { playerId }, include: { application: { include: { leagueSeason: { include: { league: true, season: true } }, team: true } } }, orderBy: { createdAt: 'desc' } }),
    db.seasonRosterHistory.findMany({ where: { playerId }, include: { seasonTeam: { include: { team: true, leagueSeason: { include: { league: true, season: true } } } } }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { notifications, rosterChanges, history };
}

export async function getPlayerRegistrationOptions(playerId: string) {
  const db = prisma as any;
  return db.leagueSeason.findMany({
    where: { status: { not: 'COMPLETED' } },
    include: {
      league: true,
      season: true,
      seasonTeams: {
        include: { team: true, players: { where: { playerId }, select: { id: true, status: true, jerseyNumber: true, position: true } } },
        orderBy: { team: { name: 'asc' } },
      },
    },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getPlayerGameLog(playerId: string, filters: { leagueSeasonId?: string; page: number; limit: number }) {
  const db = prisma as any;
  const where: any = { playerId };
  if (filters.leagueSeasonId) where.match = { leagueSeasonId: filters.leagueSeasonId };
  const total = await db.matchPlayer.count({ where });
  const rows = await db.matchPlayer.findMany({ where, include: { match: { include: { league: true, season: true, leagueSeason: true, team1: true, team2: true } }, playingTimeSegments: true }, orderBy: { match: { date: 'desc' } }, skip: (filters.page - 1) * filters.limit, take: filters.limit });
  const logs = await Promise.all(rows.map(async (row: any) => {
    const events = await db.matchEvent.findMany({ where: { matchId: row.matchId, playerId, isUndone: false }, select: { eventType: true } });
    const stats = events.reduce((acc: Record<string, number>, event: { eventType: string }) => { const key = event.eventType.toLowerCase(); acc[key] = (acc[key] || 0) + 1; if (eventPoints[event.eventType]) acc.points = (acc.points || 0) + eventPoints[event.eventType]; return acc; }, {});
    const match = row.match;
    const team1Name = match?.team1Name || match?.team1?.name || null;
    const team2Name = match?.team2Name || match?.team2?.name || null;
    const isHome = Boolean(match && row.teamId && match.team1Id === row.teamId);
    const isAway = Boolean(match && row.teamId && match.team2Id === row.teamId);
    const playerTeamName = isHome ? team1Name : isAway ? team2Name : row.team?.name;
    const opponent = isHome ? team2Name : isAway ? team1Name : team1Name || team2Name;
    const teamScore = isHome ? match?.team1Score : isAway ? match?.team2Score : null;
    const opponentScore = isHome ? match?.team2Score : isAway ? match?.team1Score : null;
    const result = teamScore == null || opponentScore == null ? null : teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
    return {
      ...row,
      stats,
      date: match?.date ?? null,
      opponent: opponent || 'Opponent unavailable',
      home: isHome,
      teamName: playerTeamName || row.team?.name || 'Team unavailable',
      teamScore,
      oppScore: opponentScore,
      result,
      score: teamScore == null || opponentScore == null ? '—' : `${teamScore}-${opponentScore}`,
    };
  }));
  return { logs, page: filters.page, limit: filters.limit, total, totalPages: Math.max(1, Math.ceil(total / filters.limit)) };
}

export async function getPlayerStatistics(playerId: string, leagueSeasonId?: string) {
  const db = prisma as any;
  const where: any = { playerId, ...(leagueSeasonId ? { match: { leagueSeasonId } } : {}) };
  const rows = await db.matchPlayer.findMany({ where, select: { matchId: true, minutesPlayed: true } });
  const events = await db.matchEvent.findMany({ where: { playerId, isUndone: false, ...(leagueSeasonId ? { match: { leagueSeasonId } } : {}) }, select: { eventType: true } });
  const totals = events.reduce((acc: Record<string, number>, event: { eventType: string }) => { const key = event.eventType.toLowerCase(); acc[key] = (acc[key] || 0) + 1; if (eventPoints[event.eventType]) acc.points = (acc.points || 0) + eventPoints[event.eventType]; return acc; }, {});
  const games = rows.length;
  return { playerId, leagueSeasonId: leagueSeasonId ?? null, games, minutes: rows.reduce((sum: number, row: any) => sum + (row.minutesPlayed || 0), 0), totals, perGame: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, games ? Number(value) / games : 0])) };
}

export async function getPlayerMedia(playerId: string) {
  return (prisma as any).media.findMany({ where: { fileUsages: { some: { entityType: 'PLAYER', entityId: playerId } } }, orderBy: { createdAt: 'desc' } });
}
