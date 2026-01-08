import type { APIRoute } from 'astro';
import { getPlayerPlayingTime, getTotalPlayingTime } from '../../../../features/game-tracking/lib/playingTime';

export const prerender = false;

/**
 * GET /api/players/[id]/playing-time
 * Get playing time for a player
 * Query parameters:
 * - matchId: Filter by match ID (required)
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const playerId = params.id;
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId');

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const segments = await getPlayerPlayingTime(matchId, playerId);
    const totalSeconds = await getTotalPlayingTime(matchId, playerId);

    return new Response(
      JSON.stringify({
        segments,
        totalSeconds,
        totalMinutes: Math.floor(totalSeconds / 60),
        formatted: formatPlayingTime(totalSeconds),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching playing time:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch playing time' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Format playing time in MM:SS format
 */
function formatPlayingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
