import { prisma } from '../../../../lib/prisma';

export async function getRegistrationReviewQueue(input: {
  page: number;
  limit: number;
  kind?: string;
  status?: string;
  search?: string;
}) {
  const db = prisma as any;
  const playerWhere: any = {
    ...(input.status ? { approved: input.status === 'APPROVED' } : {}),
    ...(input.search
      ? {
          OR: [
            { firstName: { contains: input.search } },
            { lastName: { contains: input.search } },
            { email: { contains: input.search } },
          ],
        }
      : {}),
  };
  const teamWhere: any = {
    ...(input.status ? { approved: input.status === 'APPROVED' } : {}),
    ...(input.search
      ? { OR: [{ name: { contains: input.search } }, { contactEmail: { contains: input.search } }] }
      : {}),
  };
  const includePlayers = !input.kind || input.kind === 'PLAYER';
  const includeTeams = !input.kind || input.kind === 'TEAM';
  const includeRoster = !input.kind || input.kind === 'ROSTER';
  const rosterWhere: any = {
    status: input.status || 'PENDING',
    ...(input.search
      ? {
          OR: [
            { player: { firstName: { contains: input.search } } },
            { player: { lastName: { contains: input.search } } },
            { player: { email: { contains: input.search } } },
            { team: { name: { contains: input.search } } },
          ],
        }
      : {}),
  };
  const [players, teams, playerTotal, teamTotal, rosterProposals, rosterTotal] = await Promise.all([
    includePlayers
      ? db.player.findMany({
          where: playerWhere,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { team: true },
        })
      : [],
    includeTeams
      ? db.team.findMany({
          where: teamWhere,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        })
      : [],
    includePlayers ? db.player.count({ where: playerWhere }) : 0,
    includeTeams ? db.team.count({ where: teamWhere }) : 0,
    includeRoster
      ? db.seasonTeamPlayer.findMany({
          where: rosterWhere,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            player: true,
            team: true,
            leagueSeason: { include: { season: true, league: true } },
            history: {
              where: { action: 'ROSTER_PROPOSED' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })
      : [],
    includeRoster ? db.seasonTeamPlayer.count({ where: rosterWhere }) : 0,
  ]);
  const proposerIds = [
    ...new Set(
      rosterProposals.flatMap((row: any) =>
        row.history.map((item: any) => item.changedById).filter(Boolean)
      )
    ),
  ];
  const proposers = proposerIds.length
    ? await db.user.findMany({
        where: { id: { in: proposerIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const proposerById = new Map(proposers.map((user: any) => [user.id, user]));
  const mappedRosterProposals = rosterProposals.map((row: any) => ({
    ...row,
    proposedBy: proposerById.get(row.history[0]?.changedById) ?? null,
    proposedAt: row.history[0]?.createdAt ?? row.createdAt,
  }));
  const duplicates = await db.player.findMany({
    where: {
      OR: [{ email: { not: null } }, { firstName: { not: null }, lastName: { not: null } }],
    },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const duplicateKeys = new Map<string, string[]>();
  for (const player of duplicates) {
    const key =
      player.email?.toLowerCase() ||
      `${player.firstName?.toLowerCase()}::${player.lastName?.toLowerCase()}`;
    if (key) duplicateKeys.set(key, [...(duplicateKeys.get(key) || []), player.id]);
  }
  return {
    players,
    teams,
    rosterProposals: mappedRosterProposals,
    duplicates: [...duplicateKeys.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([key, ids]) => ({ key, ids })),
    page: input.page,
    limit: input.limit,
    total: playerTotal + teamTotal + rosterTotal,
    totalPages: Math.max(1, Math.ceil((playerTotal + teamTotal + rosterTotal) / input.limit)),
  };
}

export async function bulkReviewRegistrations(input: {
  kind: 'PLAYER' | 'TEAM';
  ids: string[];
  action: 'APPROVE' | 'REJECT';
}) {
  const db = prisma as any;
  const approved = input.action === 'APPROVE';
  if (input.kind === 'PLAYER')
    return db.player.updateMany({ where: { id: { in: input.ids } }, data: { approved } });
  return db.team.updateMany({ where: { id: { in: input.ids } }, data: { approved } });
}

export async function bulkReviewRosterProposals(input: {
  ids: string[];
  action: 'APPROVE' | 'REJECT';
  reviewerId: string;
}) {
  const db = prisma as any;
  return db.$transaction(async (tx: any) => {
    const rows = await tx.seasonTeamPlayer.findMany({
      where: { id: { in: input.ids }, status: 'PENDING' },
      select: { id: true, leagueSeasonId: true, seasonTeamId: true, teamId: true, playerId: true },
    });
    if (!rows.length) return { count: 0 };
    const status = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await tx.seasonTeamPlayer.updateMany({
      where: { id: { in: rows.map((row: any) => row.id) } },
      data: { status, ...(status === 'REJECTED' ? { leftAt: new Date() } : {}) },
    });
    await tx.seasonRosterHistory.createMany({
      data: rows.map((row: any) => ({
        leagueSeasonId: row.leagueSeasonId,
        playerId: row.playerId,
        seasonTeamId: row.seasonTeamId,
        rosterId: row.id,
        action: input.action === 'APPROVE' ? 'ROSTER_APPROVED' : 'ROSTER_REJECTED',
        changedById: input.reviewerId,
      })),
    });
    return { count: rows.length };
  });
}
