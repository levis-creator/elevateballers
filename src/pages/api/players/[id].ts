import type { APIRoute } from 'astro';
import { getPlayerById } from '../../../features/cms/lib/queries';
import { updatePlayer, deletePlayer } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

const ALLOWED_STAT_KEYS = new Set([
  'ppg',
  'rpg',
  'apg',
  'spg',
  'bpg',
  'fgPercent',
  'ftPercent',
  'threePointPercent',
  'eff',
]);

function sanitizeStats(input: any): Record<string, number> | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'object') {
    throw new Error('Invalid stats format');
  }

  const result: Record<string, number> = {};
  for (const key of Object.keys(input)) {
    if (!ALLOWED_STAT_KEYS.has(key)) continue;
    const raw = input[key];
    if (raw === '' || raw === null || raw === undefined) continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      throw new Error(`Invalid value for ${key}`);
    }
    result[key] = num;
  }

  return Object.keys(result).length > 0 ? result : null;
}

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Try to get admin user to decide whether to include contact info
    let isAdmin = false;
    try {
      await requirePermission(request, 'players:update');
      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    const player = await getPlayerById(params.id!, isAdmin);

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'PLAYER_UPDATED', {
      playerId: player.id,
      name: `${player.firstName} ${player.lastName}`.trim(),
    });

    return new Response(JSON.stringify(player), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch player', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:update');
    const data = await request.json();

    // Convert jerseyNumber to number if provided
    if (data.jerseyNumber !== undefined) {
      data.jerseyNumber = data.jerseyNumber ? parseInt(data.jerseyNumber) : null;
    }

    // Handle teamId - convert empty string to undefined
    if (data.teamId === '') {
      data.teamId = undefined;
    }

    if ('stats' in data) {
      try {
        data.stats = sanitizeStats(data.stats);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Invalid stats' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const player = await updatePlayer(params.id!, data);

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(player), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update player', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:update');
    const success = await deletePlayer(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete player' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'PLAYER_DELETED', {
      playerId: params.id,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete player', request);
  }
};
