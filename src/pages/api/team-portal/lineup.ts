import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { logAudit } from '@/features/cms/lib/audit';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { getActiveSeasonTeam } from '@/features/team-portal/data/datasources/team-portal-repository';
import {
  isLineupLocked,
  isTeamMatch,
  lineupSubmissionSchema,
  validateLineup,
  MAX_STARTERS,
  MAX_BENCH,
} from '@/features/team-portal/domain/entities/lineup';
import { fmtWhen, homeName, awayName } from '@/features/teams/domain/usecases/match-format';
import { getDisplayImageUrl } from '@/lib/asset-url';
import { diffIdSets } from '@/lib/auditDiff';
import { handleApiError } from '@/lib/apiError';
import { notifyAdminsOfLineup } from '@/features/team-portal/application/lineup-emails';

export const prerender = false;

class LineupLockedError extends Error {}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const matchSelect = {
  id: true,
  slug: true,
  date: true,
  status: true,
  leagueSeasonId: true,
  team1Id: true,
  team2Id: true,
  team1Name: true,
  team2Name: true,
  team1Logo: true,
  team2Logo: true,
  team1: { select: { id: true, name: true, logo: true } },
  team2: { select: { id: true, name: true, logo: true } },
} as const;

const approvedRoster = (seasonTeamId: string) =>
  prisma.seasonTeamPlayer.findMany({
    where: { seasonTeamId, status: 'APPROVED', leftAt: null },
    select: {
      jerseyNumber: true,
      position: true,
      player: {
        select: { id: true, firstName: true, lastName: true, image: true, position: true, jerseyNumber: true },
      },
    },
    orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
  });

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return json({ error: 'Sign-in required.' }, 401);
    const params = new URL(request.url).searchParams;
    const team = (await requireActiveTeamContext(user.id, params.get('teamId'))).team;
    const { season, seasonTeam } = await getActiveSeasonTeam(team.id);
    if (!seasonTeam) return json({ season, registered: false, matches: [], match: null });

    const teamMatchWhere = {
      leagueSeasonId: seasonTeam.leagueSeasonId,
      OR: [{ team1Id: team.id }, { team2Id: team.id }],
    };
    const matches = await prisma.match.findMany({
      where: { ...teamMatchWhere, status: { in: ['UPCOMING', 'LIVE'] } },
      select: matchSelect,
      orderBy: { date: 'asc' },
      take: 20,
    });
    const requestedId = params.get('matchId');
    const match = requestedId
      ? await prisma.match.findFirst({ where: { ...teamMatchWhere, id: requestedId }, select: matchSelect })
      : (matches.find((m) => m.status === 'UPCOMING') ?? matches[0] ?? null);
    if (requestedId && !match) return json({ error: 'Match not found for your team this season.' }, 404);

    const [roster, lineup] = match
      ? await Promise.all([
          approvedRoster(seasonTeam.id),
          prisma.matchPlayer.findMany({
            where: { matchId: match.id, teamId: team.id },
            select: {
              playerId: true,
              started: true,
              jerseyNumber: true,
              player: { select: { firstName: true, lastName: true } },
            },
          }),
        ])
      : [[], []];

    const summarize = (m: (typeof matches)[number]) => {
      const isHome = m.team1Id === team.id;
      return {
        id: m.id,
        href: `/matches/${m.slug || m.id}`,
        when: fmtWhen(m.date),
        status: m.status,
        isHome,
        opponent: {
          name: isHome ? awayName(m) : homeName(m),
          logo: getDisplayImageUrl(isHome ? m.team2?.logo || m.team2Logo : m.team1?.logo || m.team1Logo),
        },
      };
    };

    return json({
      season,
      registered: true,
      maxStarters: MAX_STARTERS,
      maxBench: MAX_BENCH,
      matches: matches.map(summarize),
      match: match ? { ...summarize(match), locked: isLineupLocked(match) } : null,
      roster: roster.map(({ jerseyNumber, position, player }) => ({
        playerId: player.id,
        name: `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'Unnamed player',
        image: getDisplayImageUrl(player.image),
        jerseyNumber: jerseyNumber ?? player.jerseyNumber,
        position: position || player.position,
      })),
      lineup: lineup.map((row) => ({
        playerId: row.playerId,
        started: row.started,
        jerseyNumber: row.jerseyNumber,
        name: `${row.player.firstName ?? ''} ${row.player.lastName ?? ''}`.trim() || 'Unnamed player',
      })),
    });
  } catch (error) {
    return handleApiError(error, 'load Team Portal lineup', request);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return json({ error: 'Sign-in required.' }, 401);
    const parsed = lineupSubmissionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join('.');
      return json({ error: issue ? `${field ? `${field}: ` : ''}${issue.message}` : 'Invalid lineup.' }, 400);
    }
    const { teamId, matchId, players } = parsed.data;
    const { team } = await requireActiveTeamContext(user.id, teamId);
    const { seasonTeam } = await getActiveSeasonTeam(team.id);
    if (!seasonTeam) return json({ error: 'This team is not registered for the active season.' }, 409);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        status: true,
        date: true,
        team1Id: true,
        team2Id: true,
        leagueSeasonId: true,
        team1Name: true,
        team2Name: true,
        team1: { select: { name: true } },
        team2: { select: { name: true } },
      },
    });
    if (!match || !isTeamMatch(match, team.id, seasonTeam.leagueSeasonId))
      return json({ error: 'Match not found for your team this season.' }, 404);
    if (isLineupLocked(match))
      return json(
        {
          error:
            match.status === 'COMPLETED'
              ? 'This match is over, so its lineup can no longer be changed.'
              : 'This match has started, so its lineup can no longer be changed.',
        },
        409
      );

    const roster = await approvedRoster(seasonTeam.id);
    const rosterById = new Map(roster.map((entry) => [entry.player.id, entry]));
    const invalid = validateLineup(players, new Set(rosterById.keys()));
    if (invalid) return json({ error: invalid }, 400);

    const jerseyFor = (entry: (typeof players)[number]) => {
      const rosterEntry = rosterById.get(entry.playerId)!;
      return entry.jerseyNumber ?? rosterEntry.jerseyNumber ?? rosterEntry.player.jerseyNumber ?? null;
    };

    // A fixed handful of queries however big the squad is: one upsert per player
    // pushed the save past the interactive-transaction limit on the remote DB.
    const before = await prisma.$transaction(
      async (tx) => {
        // Re-check inside the transaction so a tip-off that lands mid-save wins.
        const current = await tx.match.findUnique({ where: { id: matchId }, select: { status: true } });
        if (!current || isLineupLocked(current)) throw new LineupLockedError();
        const existing = await tx.matchPlayer.findMany({
          where: { matchId, teamId: team.id },
          select: { playerId: true, started: true },
        });
        const existingIds = new Set(existing.map((row) => row.playerId));
        await tx.matchPlayer.deleteMany({
          where: { matchId, teamId: team.id, playerId: { notIn: players.map((p) => p.playerId) } },
        });
        // Mirrors createMatchPlayer: starters begin the game on the floor.
        for (const started of [true, false]) {
          const ids = players
            .filter((p) => p.started === started && existingIds.has(p.playerId))
            .map((p) => p.playerId);
          if (ids.length)
            await tx.matchPlayer.updateMany({
              where: { matchId, teamId: team.id, playerId: { in: ids } },
              data: { started, isActive: started },
            });
        }
        for (const entry of players)
          if (entry.jerseyNumber !== undefined && existingIds.has(entry.playerId))
            await tx.matchPlayer.updateMany({
              where: { matchId, teamId: team.id, playerId: entry.playerId },
              data: { jerseyNumber: jerseyFor(entry) },
            });
        const added = players.filter((p) => !existingIds.has(p.playerId));
        if (added.length)
          await tx.matchPlayer.createMany({
            data: added.map((entry) => {
              const rosterEntry = rosterById.get(entry.playerId)!;
              return {
                matchId,
                playerId: entry.playerId,
                teamId: team.id,
                started: entry.started,
                isActive: entry.started,
                jerseyNumber: jerseyFor(entry),
                position: rosterEntry.position || rosterEntry.player.position,
              };
            }),
            skipDuplicates: true,
          });
        return existing;
      },
      { maxWait: 10_000, timeout: 20_000 }
    );

    logAudit(request, 'TEAM_PORTAL_LINEUP_SUBMITTED', {
      teamId: team.id,
      matchId,
      players: diffIdSets(
        before.map((row) => row.playerId),
        players.map((p) => p.playerId)
      ),
      starters: diffIdSets(
        before.filter((row) => row.started).map((row) => row.playerId),
        players.filter((p) => p.started).map((p) => p.playerId)
      ),
    });

    const isHome = match.team1Id === team.id;
    const toEmailPlayer = (entry: (typeof players)[number]) => {
      const { player } = rosterById.get(entry.playerId)!;
      return {
        playerId: entry.playerId,
        name: `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'Unnamed player',
        jerseyNumber: jerseyFor(entry),
      };
    };
    await notifyAdminsOfLineup({
      matchId,
      teamId: team.id,
      teamName: team.name,
      coachName: user.name ?? user.email ?? null,
      opponent: isHome ? awayName(match) : homeName(match),
      isHome,
      when: fmtWhen(match.date),
      previous: before,
      starters: players.filter((p) => p.started).map(toEmailPlayer),
      bench: players.filter((p) => !p.started).map(toEmailPlayer),
    });

    return json({
      message: 'Lineup saved.',
      players: players.length,
      starters: players.filter((p) => p.started).length,
    });
  } catch (error) {
    if (error instanceof LineupLockedError)
      return json({ error: 'This match has started, so its lineup can no longer be changed.' }, 409);
    return handleApiError(error, 'save Team Portal lineup', request);
  }
};
