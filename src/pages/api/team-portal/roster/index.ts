import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { handleApiError } from '@/lib/apiError';

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
          select: { id: true, leagueSeason: { select: { league: { select: { name: true } } } } },
        })
      : null;
    const players = seasonTeam
      ? await prisma.seasonTeamPlayer.findMany({
          where: { seasonTeamId: seasonTeam.id, status: 'APPROVED', leftAt: null },
          select: {
            id: true,
            jerseyNumber: true,
            position: true,
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
                position: true,
                jerseyNumber: true,
                email: true,
              },
            },
          },
          orderBy: [{ jerseyNumber: 'asc' }, { createdAt: 'asc' }],
        })
      : [];
    return new Response(
      JSON.stringify({
        team: { id: team.id, name: team.name },
        season,
        seasonTeamId: seasonTeam?.id ?? null,
        leagueName: seasonTeam?.leagueSeason.league.name ?? null,
        players,
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
    const jerseyNumber =
      body?.jerseyNumber === '' || body?.jerseyNumber == null ? null : Number(body.jerseyNumber);

    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: 'First name, last name, and email are required.' }),
        { status: 400 }
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Enter a valid player email address.' }), {
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
      const existing = await tx.player.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, firstName: true, lastName: true },
      });
      const player =
        existing ??
        (await tx.player.create({
          data: { firstName, lastName, email, position, jerseyNumber, approved: false },
          select: { id: true, firstName: true, lastName: true },
        }));
      const roster = await tx.seasonTeamPlayer.upsert({
        where: { seasonTeamId_playerId: { seasonTeamId: seasonTeam.id, playerId: player.id } },
        update: { status: 'PENDING', leftAt: null, jerseyNumber, position },
        create: {
          leagueSeasonId: seasonTeam.leagueSeasonId,
          seasonTeamId: seasonTeam.id,
          teamId: team.id,
          playerId: player.id,
          jerseyNumber,
          position,
          status: 'PENDING',
        },
      });
      await tx.seasonRosterHistory.create({
        data: {
          leagueSeasonId: seasonTeam.leagueSeasonId,
          playerId: player.id,
          seasonTeamId: seasonTeam.id,
          rosterId: roster.id,
          action: 'ROSTER_PROPOSED',
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
