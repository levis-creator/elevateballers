import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { handleApiError } from '@/lib/apiError';
import { calculatePlayerStatistics } from '@/features/player/lib/playerStats';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const team = (
      await requireActiveTeamContext(user.id, new URL(request.url).searchParams.get('teamId'))
    ).team;
    const season = await prisma.season.findFirst({
      where: { active: true },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true },
    });
    const seasonTeam = season
      ? await prisma.seasonTeam.findFirst({
          where: { teamId: team.id, seasonId: season.id },
          select: {
            id: true,
            leagueSeasonId: true,
            leagueSeason: { select: { league: { select: { name: true } } } },
          },
        })
      : null;
    const [players, matches] = seasonTeam
      ? await Promise.all([
          prisma.seasonTeamPlayer.findMany({
            where: {
              seasonTeamId: seasonTeam.id,
              status: { in: ['APPROVED', 'PENDING'] },
              leftAt: null,
            },
            select: {
              id: true,
              status: true,
              jerseyNumber: true,
              position: true,
              proposalNote: true,
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  image: true,
                  position: true,
                  jerseyNumber: true,
                  email: true,
                  dateOfBirth: true,
                  phone: true,
                },
              },
            },
            orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
          }),
          prisma.match.findMany({
            where: { leagueSeasonId: seasonTeam.leagueSeasonId, status: 'COMPLETED' },
            select: {
              id: true,
              status: true,
              events: {
                where: { isUndone: false },
                select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
              },
            },
          }),
        ])
      : [[], []];
    const statsByPlayer = new Map(
      players.map((entry) => {
        const stats = calculatePlayerStatistics(matches as any, entry.player.id);
        return [
          entry.player.id,
          {
            gp: stats.totalMatches,
            ppg: stats.pointsPerGame,
            reb: stats.reboundsPerGame,
            ast: stats.assistsPerGame,
          },
        ];
      })
    );
    return new Response(
      JSON.stringify({
        team: { id: team.id, name: team.name },
        season,
        seasonTeamId: seasonTeam?.id ?? null,
        leagueName: seasonTeam?.leagueSeason.league.name ?? null,
        players: players.map((entry) => ({
          ...entry,
          stats: entry.status === 'APPROVED' ? statsByPlayer.get(entry.player.id) : null,
        })),
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'load Team Portal roster', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const body = await request.json().catch(() => ({}));
    const { team } = await requireActiveTeamContext(user.id, body?.teamId);
    const firstName = String(body?.firstName ?? '').trim();
    const lastName = String(body?.lastName ?? '').trim();
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase();
    const position = String(body?.position ?? '').trim() || null;
    const phone = String(body?.phone ?? '').trim() || null;
    const note = String(body?.note ?? '').trim() || null;
    const dateOfBirthValue = String(body?.dateOfBirth ?? '').trim();
    const dateOfBirth = dateOfBirthValue ? new Date(`${dateOfBirthValue}T00:00:00.000Z`) : null;
    const jerseyNumber =
      body?.jerseyNumber === '' || body?.jerseyNumber == null ? null : Number(body.jerseyNumber);

    if (!body?.rosterId && (!firstName || !lastName || !email)) {
      return new Response(
        JSON.stringify({ error: 'First name, last name, and email are required.' }),
        { status: 400 }
      );
    }
    if (!body?.rosterId && !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Enter a valid player email address.' }), {
        status: 400,
      });
    }
    if (
      !body?.rosterId &&
      (!dateOfBirthValue || !dateOfBirth || Number.isNaN(dateOfBirth.getTime()))
    ) {
      return new Response(JSON.stringify({ error: 'A valid date of birth is required.' }), {
        status: 400,
      });
    }
    if (
      jerseyNumber !== null &&
      (!Number.isInteger(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 99)
    ) {
      return new Response(JSON.stringify({ error: 'Jersey number must be between 0 and 99.' }), {
        status: 400,
      });
    }

    const season = await prisma.season.findFirst({
      where: { active: true },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true },
    });
    if (!season)
      return new Response(JSON.stringify({ error: 'No active season is available.' }), {
        status: 409,
      });
    const seasonTeam = await prisma.seasonTeam.findFirst({
      where: { teamId: team.id, seasonId: season.id },
      select: { id: true, leagueSeasonId: true },
    });
    if (!seasonTeam)
      return new Response(
        JSON.stringify({ error: 'This team is not registered for the active season.' }),
        { status: 409 }
      );

    const result = await prisma.$transaction(async (tx) => {
      if (body?.rosterId) {
        const current = await tx.seasonTeamPlayer.findFirst({
          where: { id: String(body.rosterId), seasonTeamId: seasonTeam.id },
          select: { id: true, playerId: true },
        });
        if (!current) throw new Error('Roster entry not found for the active season.');
        const roster = await tx.seasonTeamPlayer.update({
          where: { id: current.id },
          data: { status: 'PENDING', leftAt: null, jerseyNumber, position, proposalNote: note },
        });
        await tx.seasonRosterHistory.create({
          data: {
            leagueSeasonId: seasonTeam.leagueSeasonId,
            playerId: current.playerId,
            seasonTeamId: seasonTeam.id,
            rosterId: roster.id,
            action: 'ROSTER_EDIT_PROPOSED',
            reason: note,
            changedById: user.id,
          },
        });
        return { player: null, roster };
      }
      const existing = await tx.player.findFirst({
        // The MySQL database collation handles email comparisons
        // case-insensitively; Prisma's `mode` filter is not supported by this
        // provider.
        where: { email },
        select: { id: true, firstName: true, lastName: true },
      });
      const player =
        existing ??
        (await tx.player.create({
          data: {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            position,
            jerseyNumber,
            approved: false,
          },
          select: { id: true, firstName: true, lastName: true },
        }));
      const roster = await tx.seasonTeamPlayer.upsert({
        where: { seasonTeamId_playerId: { seasonTeamId: seasonTeam.id, playerId: player.id } },
        update: { status: 'PENDING', leftAt: null, jerseyNumber, position, proposalNote: note },
        create: {
          leagueSeasonId: seasonTeam.leagueSeasonId,
          seasonTeamId: seasonTeam.id,
          teamId: team.id,
          playerId: player.id,
          jerseyNumber,
          position,
          status: 'PENDING',
          proposalNote: note,
        },
      });
      await tx.seasonRosterHistory.create({
        data: {
          leagueSeasonId: seasonTeam.leagueSeasonId,
          playerId: player.id,
          seasonTeamId: seasonTeam.id,
          rosterId: roster.id,
          action: 'ROSTER_PROPOSED',
          reason: note,
          changedById: user.id,
        },
      });
      return { player, roster };
    });

    return new Response(
      JSON.stringify({
        message: 'Player proposal sent for admin approval.',
        player: result.player,
        rosterId: result.roster.id,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'propose Team Portal roster player', request);
  }
};
