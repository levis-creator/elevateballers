import { prisma } from '../../../../lib/prisma';
import type { RosterDecision } from '../../application/roster-request-emails';
import { approvePendingSeasonRegistrations } from './public-submission';
import { markRosterDroppedOut } from '../../../player/data/datasources/dropout-repository';

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
  if (row.status === 'APPROVED' && pendingRemovals.has(row.id))
    return row.dropoutRequestedAt ? 'DROPOUT' : 'REMOVAL';
  if (row.history[0]?.action === 'ROSTER_EDIT_PROPOSED') return 'EDIT';
  return 'NEW';
}

export type RosterRequest = {
  id: string;
  requestType: 'NEW' | 'EDIT' | 'REMOVAL' | 'DROPOUT';
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
        dropoutRequestedAt: true,
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

export type ReviewQueueFilters = {
  kind?: string;
  status?: string;
  search?: string;
  leagueId?: string;
  seasonId?: string;
  teamId?: string;
  /** Inclusive submitted-date range, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
};

/** Reads the queue filters from a request URL; blank values mean "any". */
export function reviewQueueFiltersFromUrl(url: URL): ReviewQueueFilters {
  const get = (name: string) => url.searchParams.get(name)?.trim() || undefined;
  return {
    kind: get('kind'),
    status: get('status'),
    search: get('search'),
    leagueId: get('leagueId'),
    seasonId: get('seasonId'),
    teamId: get('teamId'),
    from: get('from'),
    to: get('to'),
  };
}

function parseDay(value: string | undefined, endOfDay: boolean): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function registrationStatusWhere(status?: string) {
  if (status === 'APPROVED') return { approved: true };
  if (status === 'REJECTED') return { reviewStatus: 'REJECTED' };
  if (status === 'NEEDS_CHANGES') return { approved: false, reviewStatus: 'NEEDS_CHANGES' };
  if (status === 'PENDING') return { approved: false, OR: [{ reviewStatus: null }, { reviewStatus: 'PENDING' }] };
  return {};
}

/** The where clauses for each queue section, built from the same filters so the queue and its export agree. */
async function buildReviewQueueWhere(db: any, input: ReviewQueueFilters) {
  const from = parseDay(input.from, false);
  const to = parseDay(input.to, true);
  const createdAt = from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : null;
  const edition = {
    ...(input.leagueId && { leagueId: input.leagueId }),
    ...(input.seasonId && { seasonId: input.seasonId }),
  };
  const hasEdition = Boolean(input.leagueId || input.seasonId);

  const playerWhere: any = {
    AND: [
      registrationStatusWhere(input.status),
      ...(input.search ? [{ OR: [
        { firstName: { contains: input.search } },
        { lastName: { contains: input.search } },
        { email: { contains: input.search } },
      ] }] : []),
      ...(hasEdition ? [{ OR: [
        { seasonTeamPlayers: { some: { leagueSeason: edition } } },
        { team: { seasonTeams: { some: edition } } },
      ] }] : []),
      ...(input.teamId
        ? [{ OR: [{ teamId: input.teamId }, { seasonTeamPlayers: { some: { teamId: input.teamId } } }] }]
        : []),
      ...(createdAt ? [createdAt] : []),
    ],
  };
  const teamWhere: any = {
    AND: [
      registrationStatusWhere(input.status),
      ...(input.search
        ? [{ OR: [{ name: { contains: input.search } }, { contactEmail: { contains: input.search } }] }]
        : []),
      ...(hasEdition ? [{ OR: [
        { seasonTeams: { some: edition } },
        { seasonRegistrationApplications: { some: { leagueSeason: edition } } },
      ] }] : []),
      ...(input.teamId ? [{ id: input.teamId }] : []),
      ...(createdAt ? [createdAt] : []),
    ],
  };

  const includePlayers = !input.kind || input.kind === 'PLAYER';
  const includeTeams = !input.kind || input.kind === 'TEAM';
  // Coach roster requests have no "needs changes" step; they are approved or rejected.
  const includeRoster = (!input.kind || input.kind === 'ROSTER') && input.status !== 'NEEDS_CHANGES';
  const pendingRemovals: string[] = includeRoster ? await pendingRemovalRosterIds(db) : [];
  const rosterWhere: any = {
    AND: [
      ...(input.search ? [{ OR: [
        { player: { firstName: { contains: input.search } } },
        { player: { lastName: { contains: input.search } } },
        { player: { email: { contains: input.search } } },
        { team: { name: { contains: input.search } } },
      ] }] : []),
      input.status === 'PENDING' || !input.status
        ? { OR: [{ status: 'PENDING' }, { id: { in: pendingRemovals } }] }
        : { status: input.status },
      ...(hasEdition ? [{ leagueSeason: edition }] : []),
      ...(input.teamId ? [{ teamId: input.teamId }] : []),
      ...(createdAt ? [createdAt] : []),
    ],
  };
  return { playerWhere, teamWhere, rosterWhere, includePlayers, includeTeams, includeRoster, pendingRemovals };
}

const ROSTER_INCLUDE = {
  player: true,
  team: true,
  leagueSeason: { include: { season: true, league: true } },
  history: {
    where: { action: { in: PROPOSAL_ACTIONS } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
};

/**
 * Other teams registered with the same coach email. A coach may run several
 * teams, so this is context for the reviewer, never a duplicate.
 */
async function sameCoachTeams(db: any, teams: any[]) {
  const byEmail = new Map<string, { id: string; name: string }[]>();
  const emails = [
    ...new Set(teams.map((team) => team.contactEmail?.trim().toLowerCase()).filter(Boolean)),
  ];
  if (!emails.length) return byEmail;
  const matches = await db.team.findMany({
    where: { contactEmail: { in: emails } },
    select: { id: true, name: true, contactEmail: true },
    orderBy: { name: 'asc' },
  });
  for (const match of matches) {
    const email = match.contactEmail.trim().toLowerCase();
    byEmail.set(email, [...(byEmail.get(email) ?? []), { id: match.id, name: match.name }]);
  }
  return byEmail;
}

export async function getRegistrationReviewQueue(
  input: ReviewQueueFilters & { page: number; limit: number }
) {
  const db = prisma as any;
  const { playerWhere, teamWhere, rosterWhere, includePlayers, includeTeams, includeRoster, pendingRemovals } =
    await buildReviewQueueWhere(db, input);
  const skip = (input.page - 1) * input.limit;
  const [players, teams, playerTotal, teamTotal, rosterProposals, rosterTotal] = await Promise.all([
    includePlayers
      ? db.player.findMany({
          where: playerWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take: input.limit,
          include: { team: true },
        })
      : [],
    includeTeams
      ? db.team.findMany({ where: teamWhere, orderBy: { createdAt: 'desc' }, skip, take: input.limit })
      : [],
    includePlayers ? db.player.count({ where: playerWhere }) : 0,
    includeTeams ? db.team.count({ where: teamWhere }) : 0,
    includeRoster
      ? db.seasonTeamPlayer.findMany({
          where: rosterWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take: input.limit,
          include: ROSTER_INCLUDE,
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
  const [proposers, coachTeams] = await Promise.all([
    proposerIds.length
      ? db.user.findMany({
          where: { id: { in: proposerIds } },
          select: { id: true, name: true, email: true },
        })
      : [],
    sameCoachTeams(db, teams),
  ]);
  const proposerById = new Map(proposers.map((user: any) => [user.id, user]));
  const pendingRemovalSet = new Set(pendingRemovals);
  const mappedRosterProposals = rosterProposals.map((row: any) => ({
    ...row,
    requestType: rosterRequestType(row, pendingRemovalSet),
    note: row.history[0]?.reason ?? null,
    proposedBy: proposerById.get(row.history[0]?.changedById) ?? null,
    proposedAt: row.history[0]?.createdAt ?? row.createdAt,
  }));
  const mappedTeams = teams.map((team: any) => ({
    ...team,
    sameCoachTeams: (coachTeams.get(team.contactEmail?.trim().toLowerCase()) ?? []).filter(
      (other) => other.id !== team.id
    ),
  }));
  const duplicates = await db.player.findMany({
    where: {
      archived: false,
      mergedIntoId: null,
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
  const duplicateGroups = [...duplicateKeys.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([matchKey, ids]) => ({ matchKey, ids }));
  const duplicateReviews = duplicateGroups.length
    ? await db.playerDuplicateReview.findMany({
        where: { matchKey: { in: duplicateGroups.map(({ matchKey }) => matchKey) } },
        select: { matchKey: true, resolution: true },
      })
    : [];
  const reviewByKey = new Map(duplicateReviews.map((review: any) => [review.matchKey, review.resolution]));

  // Each section is paged on its own, so the page count follows the largest one.
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(playerTotal, teamTotal, rosterTotal) / input.limit)
  );
  return {
    players,
    teams: mappedTeams,
    rosterProposals: mappedRosterProposals,
    duplicates: duplicateGroups
      .filter(({ matchKey }) => reviewByKey.get(matchKey) !== 'NOT_DUPLICATE')
      .map(({ matchKey, ids }) => ({ key: matchKey, ids, resolution: reviewByKey.get(matchKey) ?? 'OPEN' })),
    page: input.page,
    limit: input.limit,
    total: playerTotal + teamTotal + rosterTotal,
    totalPages,
  };
}

const EXPORT_BATCH = 500;

/** Reads every page of a query; exports must not stop at a fixed row count. */
export async function readAllPages<T>(fetchPage: (skip: number, take: number) => Promise<T[]>): Promise<T[]> {
  const rows: T[] = [];
  for (let skip = 0; ; skip += EXPORT_BATCH) {
    const page = await fetchPage(skip, EXPORT_BATCH);
    rows.push(...page);
    if (page.length < EXPORT_BATCH) return rows;
  }
}

/** Every row matching the queue filters, with no row cap. */
export async function exportRegistrationReviewQueue(input: ReviewQueueFilters) {
  const db = prisma as any;
  const { playerWhere, teamWhere, rosterWhere, includePlayers, includeTeams, includeRoster, pendingRemovals } =
    await buildReviewQueueWhere(db, input);
  // A stable id tiebreak keeps rows from repeating or vanishing between batches.
  const orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
  const [players, teams, roster] = await Promise.all([
    includePlayers
      ? readAllPages((skip, take) =>
          db.player.findMany({ where: playerWhere, orderBy, skip, take, include: { team: true } })
        )
      : [],
    includeTeams
      ? readAllPages((skip, take) => db.team.findMany({ where: teamWhere, orderBy, skip, take }))
      : [],
    includeRoster
      ? readAllPages((skip, take) =>
          db.seasonTeamPlayer.findMany({ where: rosterWhere, orderBy, skip, take, include: ROSTER_INCLUDE })
        )
      : [],
  ]);
  const removals = new Set(pendingRemovals);
  return {
    players: players as any[],
    teams: teams as any[],
    rosterProposals: (roster as any[]).map((row: any) => ({
      ...row,
      requestType: rosterRequestType(row, removals),
    })),
  };
}

/**
 * Sends player or team registrations back to the applicant with a note. They
 * leave the pending list until an admin approves or rejects them.
 */
export async function requestRegistrationChanges(input: {
  kind: 'PLAYER' | 'TEAM';
  ids: string[];
  note: string;
}): Promise<{ count: number; ids: string[] }> {
  const db = prisma as any;
  const model = input.kind === 'PLAYER' ? db.player : db.team;
  const where = { id: { in: input.ids }, approved: false };
  const rows = await model.findMany({ where, select: { id: true } });
  const ids = rows.map((row: any) => row.id);
  if (!ids.length) return { count: 0, ids };
  const { count } = await model.updateMany({
    where: { id: { in: ids } },
    data: { reviewStatus: 'NEEDS_CHANGES', reviewNotes: input.note },
  });
  return { count, ids };
}

export async function bulkReviewRegistrations(input: {
  kind: 'PLAYER' | 'TEAM';
  ids: string[];
  action: 'APPROVE' | 'REJECT';
}) {
  const db = prisma as any;
  const approved = input.action === 'APPROVE';
  const reviewStatus = approved ? 'APPROVED' : 'REJECTED';
  if (input.kind === 'PLAYER')
    return db.player.updateMany({ where: { id: { in: input.ids } }, data: { approved, reviewStatus } });
  const result = await db.team.updateMany({ where: { id: { in: input.ids } }, data: { approved, reviewStatus } });
  // Same follow-up as the Teams page approval: enter the team into the season
  // it applied for and give its coach portal access.
  if (approved && result.count) await approvePendingSeasonRegistrations(input.ids);
  return result;
}

export async function bulkReviewRosterProposals(input: {
  ids: string[];
  action: 'APPROVE' | 'REJECT';
  reviewerId: string;
}): Promise<{ count: number; decisions: RosterDecision[] }> {
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
        dropoutRequestedAt: true,
        player: { select: { firstName: true, lastName: true } },
        team: { select: { name: true } },
        history: {
          where: { action: { in: PROPOSAL_ACTIONS } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { action: true, changedById: true, reason: true },
        },
      },
    });
    if (!rows.length) return { count: 0, decisions: [] as RosterDecision[] };
    const decisions = rows.map((row: any) => {
      const type = rosterRequestType(row, pendingRemovals);
      // A dropout is a removal the coach flagged as the player leaving the
      // league; approving it also records the dropout (see below).
      if (type === 'DROPOUT')
        return {
          row,
          type,
          data: approve ? null : { dropoutRequestedAt: null },
          action: approve ? 'ROSTER_REMOVAL_APPROVED' : 'ROSTER_REMOVAL_REJECTED',
        };
      if (type === 'REMOVAL')
        return {
          row,
          type,
          data: approve ? { status: 'WITHDRAWN', leftAt: new Date() } : null,
          action: approve ? 'ROSTER_REMOVAL_APPROVED' : 'ROSTER_REMOVAL_REJECTED',
        };
      // Rejecting an edit to an existing player must not drop them from the
      // roster; they go back to approved.
      if (type === 'EDIT')
        return {
          row,
          type,
          data: { status: 'APPROVED', leftAt: null },
          action: approve ? 'ROSTER_APPROVED' : 'ROSTER_EDIT_REJECTED',
        };
      return {
        row,
        type,
        data: approve ? { status: 'APPROVED' } : { status: 'REJECTED', leftAt: new Date() },
        action: approve ? 'ROSTER_APPROVED' : 'ROSTER_REJECTED',
      };
    });
    for (const { row, type, data } of decisions) {
      if (data) await tx.seasonTeamPlayer.update({ where: { id: row.id }, data });
      if (type === 'DROPOUT' && approve)
        await markRosterDroppedOut(tx, row.id, {
          reason: row.history[0]?.reason ?? null,
          changedById: input.reviewerId,
        });
    }
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
    return {
      count: rows.length,
      decisions: decisions.map(({ row, type }: any): RosterDecision => ({
        rosterId: row.id,
        playerId: row.playerId,
        type,
        approved: approve,
        playerName: `${row.player?.firstName ?? ''} ${row.player?.lastName ?? ''}`.trim() || 'A player',
        teamId: row.teamId,
        teamName: row.team?.name ?? 'your team',
        coachId: row.history[0]?.changedById ?? null,
      })),
    };
  }, { maxWait: 10_000, timeout: 20_000 });
}
