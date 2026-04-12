import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { calculatePlayerStatistics } from '../../../features/player/lib/playerStats';
import { resolveAssetUrl } from '../../../lib/asset-url';
import { handleApiError } from '../../../lib/apiError';
import { cacheGet, cacheSet } from '../../../lib/cache';

export const prerender = false;

type ComputedStats = {
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  totalMatches: number;
};

// Maps query-param category names → computed stat field names
const CATEGORY_MAP: Record<string, keyof ComputedStats> = {
  points:            'pointsPerGame',
  rebounds:          'reboundsPerGame',
  assists:           'assistsPerGame',
  steals:            'stealsPerGame',
  blocks:            'blocksPerGame',
  fgPercentage:      'fieldGoalPercentage',
  threePtPercentage: 'threePointPercentage',
  ftPercentage:      'freeThrowPercentage',
};

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  image: string | null;
  slug: string | null;
  team: { id: string; name: string; logo: string | null } | null;
};

type MatchRow = {
  id: string;
  status: string;
  events: Array<{ eventType: any; playerId: string | null; assistPlayerId: string | null; isUndone: boolean }>;
};

/**
 * Build a leader entry for a single player by deriving stats from completed
 * match events.  Returns null if the player hasn't appeared in any match.
 */
async function buildLeader(player: PlayerRow, matches: MatchRow[]) {
  const stats = calculatePlayerStatistics(matches, player.id);
  if (stats.totalMatches === 0) return null;

  const computedStats: ComputedStats = {
    pointsPerGame:        Math.round(stats.pointsPerGame * 10) / 10,
    reboundsPerGame:      Math.round(stats.reboundsPerGame * 10) / 10,
    assistsPerGame:       Math.round(stats.assistsPerGame * 10) / 10,
    stealsPerGame:        Math.round(stats.stealsPerGame * 10) / 10,
    blocksPerGame:        Math.round(stats.blocksPerGame * 10) / 10,
    fieldGoalPercentage:  Math.round(stats.fieldGoalPercentage * 10) / 10,
    threePointPercentage: Math.round(stats.threePointPercentage * 10) / 10,
    freeThrowPercentage:  Math.round(stats.freeThrowPercentage * 10) / 10,
    totalMatches:         stats.totalMatches,
  };

  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    jerseyNumber: player.jerseyNumber,
    // Resolve image to an absolute path so client-side <img> always works
    image: resolveAssetUrl(player.image) ?? null,
    slug: player.slug,
    team: player.team
      ? {
          id: player.team.id,
          name: player.team.name,
          logo: resolveAssetUrl(player.team.logo) ?? null,
        }
      : null,
    computedStats,
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url      = new URL(request.url);
    const category = url.searchParams.get('category') || 'points';
    const limit    = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));

    const statField = CATEGORY_MAP[category] ?? 'pointsPerGame';

    // Check cache first
    const cacheKey = `leaders:${category}:${limit}`;
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
        },
      });
    }

    // Fetch all approved players with their team
    const players = await prisma.player.findMany({
      where: { approved: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        jerseyNumber: true,
        image: true,
        slug: true,
        team: { select: { id: true, name: true, logo: true } },
      },
    });

    if (players.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all completed matches with events in a single query
    const matches = await prisma.match.findMany({
      where: { status: 'COMPLETED' },
      select: {
        id: true,
        status: true,
        events: {
          where: { isUndone: false },
          select: {
            eventType: true,
            playerId: true,
            assistPlayerId: true,
            isUndone: true,
          },
        },
      },
    });

    // Compute a leader entry for each player (skip those with no match activity)
    const leaderEntries = (
      await Promise.all(players.map((p) => buildLeader(p, matches)))
    ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // Sort descending by the requested stat and take the top N
    const sorted = leaderEntries
      .sort((a, b) => b.computedStats[statField] - a.computedStats[statField])
      .slice(0, limit);

    // Flatten response: expose the requested stat at the top level as `stats[category]`
    // so the existing carousel component (`stats[category]`) still works.
    const response = sorted.map((entry) => ({
      id:           entry.id,
      firstName:    entry.firstName,
      lastName:     entry.lastName,
      position:     entry.position,
      jerseyNumber: entry.jerseyNumber,
      image:        entry.image,
      slug:         entry.slug,
      team:         entry.team,
      // Top-level stat value that the carousel reads as `stats[category]`
      stats: {
        [category]: entry.computedStats[statField],
        ...Object.fromEntries(
          Object.entries(CATEGORY_MAP).map(([k, v]) => [k, entry.computedStats[v]])
        ),
      },
    }));

    await cacheSet(cacheKey, response, 1800); // 30 min TTL — invalidated on game end

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return handleApiError(error, 'fetch stats leaders', request);
  }
};
