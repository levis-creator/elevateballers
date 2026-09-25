import { prisma } from '../../../../lib/prisma';

const PROPOSAL_ACTIONS = ['ROSTER_PROPOSED', 'ROSTER_EDIT_PROPOSED', 'ROSTER_REMOVAL_PROPOSED'];
const REMOVAL_ACTIONS = ['ROSTER_REMOVAL_PROPOSED', 'ROSTER_REMOVAL_APPROVED', 'ROSTER_REMOVAL_REJECTED'];

/**
 * Approved roster rows whose latest removal decision is still "proposed". A
 * plain `history: { some: ... }` filter would keep already-rejected requests in
 * the queue forever.
 */
async function pendingRemovalRosterIds(db: any, ids?: string[]): Promise<string[]> {
  const rows = await db.seasonTeamPlayer.findMany({
    where: {
      ...(ids ? { id: { in: ids } } : {}),
      status: 'APPROVED',
      leftAt: null,
      history: { some: { action: 'ROSTER_REMOVAL_PROPOSED' } },
    },
    select: {
      id: true,
      history: {
        where: { action: { in: REMOVAL_ACTIONS } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { action: true },
      },
    },
  });
  return rows
    .filter((row: any) => row.history[0]?.action === 'ROSTER_REMOVAL_PROPOSED')
    .map((row: any) => row.id);
}

/** What the coach asked for, derived from the row state and its latest proposal. */
function rosterRequestType(row: any, pendingRemovals: ReadonlySet<string>) {
  if (row.status === 'APPROVED' && pendingRemovals.has(row.id)) return 'REMOVAL';
  if (row.history[0]?.action === 'ROSTER_EDIT_PROPOSED') return 'EDIT';
  return 'NEW';
}

export type RosterRequest = {
  id: string;
  requestType: 'NEW' | 'EDIT' | 'REMOVAL';
  playerName: string;
  teamName: string | null;
  jerseyNumber: number | null;
  position: string | null;
  note: string | null;
};

/** Coach roster requests still awaiting a decision, newest first, for the admin dashboard. */
export async function getPendingRosterRequests(
  limit: number
): Promise<{ total: number; items: RosterRequest[] }> {
  const db = prisma as any;
  const pendingRemovals = await pendingRemovalRosterIds(db);
  const where = { OR: [{ status: 'PENDING', leftAt: null }, { id: { in: pendingRemovals } }] };
  const [rows, total] = await Promise.all([
    db.seasonTeamPlayer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        jerseyNumber: true,
        position: true,
        player: { select: { firstName: true, lastName: true } },
        team: { select: { name: true } },
        history: {
          where: { action: { in: PROPOSAL_ACTIONS } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { action: true, reason: true, createdAt: true },
        },
      },
    }),
    db.seasonTeamPlayer.count({ where }),
  ]);
  const removals = new Set(pendingRemovals);
  return {
    total,
    items: rows.map((row: any) => ({
      id: row.id,
      requestType: rosterRequestType(row, removals),
      playerName: `${row.player?.firstName ?? ''} ${row.player?.lastName ?? ''}`.trim() || 'Unnamed player',
      teamName: row.team?.name ?? null,
      jerseyNumber: row.jerseyNumber,
      position: row.position,
      note: row.history[0]?.reason ?? null,
    })),
  };
}

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
  const pendingRemovals = includeRoster ? await pendingRemovalRosterIds(db) : [];
  if (input.status === 'PENDING' || !input.status) {
    rosterWhere.AND = [{ OR: [{ status: 'PENDING' }, { id: { in: pendingRemovals } }] }];
  } else {
    rosterWhere.status = input.status;
  }
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
              where: { action: { in: PROPOSAL_ACTIONS } },
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
  const pendingRemovalSet = new Set(pendingRemovals);
  const mappedRosterProposals = rosterProposals.map((row: any) => ({
    ...row,
    requestType: rosterRequestType(row, pendingRemovalSet),
    note: row.history[0]?.reason ?? null,
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
  const approve = input.action === 'APPROVE';
  return db.$transaction(async (tx: any) => {
    const pendingRemovals = new Set(await pendingRemovalRosterIds(tx, input.ids));
    const rows = await tx.seasonTeamPlayer.findMany({
      where: {
        id: { in: input.ids },
        OR: [{ status: 'PENDING' }, { id: { in: [...pendingRemovals] } }],
      },
      select: {
        id: true,
        leagueSeasonId: true,
        seasonTeamId: true,
        teamId: true,
        playerId: true,
        status: true,
        history: {
          where: { action: { in: PROPOSAL_ACTIONS } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { action: true },
        },
      },
    });
    if (!rows.length) return { count: 0 };
    const decisions = rows.map((row: any) => {
      const type = rosterRequestType(row, pendingRemovals);
      if (type === 'REMOVAL')
        return {
          row,
          data: approve ? { status: 'WITHDRAWN', leftAt: new Date() } : null,
          action: approve ? 'ROSTER_REMOVAL_APPROVED' : 'ROSTER_REMOVAL_REJECTED',
        };
      // Rejecting an edit to an existing player must not drop them from the
      // roster; they go back to approved.
      if (type === 'EDIT')
        return {
          row,
          data: { status: 'APPROVED', leftAt: null },
          action: approve ? 'ROSTER_APPROVED' : 'ROSTER_EDIT_REJECTED',
        };
      return {
        row,
        data: approve ? { status: 'APPROVED' } : { status: 'REJECTED', leftAt: new Date() },
        action: approve ? 'ROSTER_APPROVED' : 'ROSTER_REJECTED',
      };
    });
    for (const { row, data } of decisions)
      if (data) await tx.seasonTeamPlayer.update({ where: { id: row.id }, data });
    await tx.seasonRosterHistory.createMany({
      data: decisions.map(({ row, action }: any) => ({
        leagueSeasonId: row.leagueSeasonId,
        playerId: row.playerId,
        seasonTeamId: row.seasonTeamId,
        rosterId: row.id,
        action,
        changedById: input.reviewerId,
      })),
    });
    return { count: rows.length };
  }, { maxWait: 10_000, timeout: 20_000 });
}
