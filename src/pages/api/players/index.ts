import type { APIRoute } from 'astro';
import { getPlayers } from '../../../features/player/lib/queries/player';
import { createPlayer } from '../../../features/player/lib/mutations/player';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { sendPlayerRegistrationAutoReplyBrevo } from '../../../lib/email/templates/registration';
import { logAudit } from '../../../features/audit/lib/audit';
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

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get('teamId') || undefined;

    // Try to get admin user, but don't fail if not authenticated
    let includeUnapproved = false;
    try {
      await requirePermission(request, 'players:create');
      includeUnapproved = true; // Admins can see unapproved players
    } catch {
      // Not an admin, only show approved players
      includeUnapproved = false;
    }

    const players = await getPlayers(teamId, includeUnapproved);

    return new Response(JSON.stringify(players), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch players', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'players:create');

    const data = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName) {
      return new Response(JSON.stringify({ error: 'First name and last name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let stats: Record<string, number> | null = null;
    try {
      stats = sanitizeStats(data.stats);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Invalid stats' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const player = await createPlayer({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      height: data.height,
      weight: data.weight,
      image: data.image,
      bio: data.bio,
      teamId: data.teamId || undefined,
      position: data.position,
      jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber) : undefined,
      stats,
      approved: true, // Admin-created players are approved by default
    });

    if (data.email) {
      sendPlayerRegistrationAutoReplyBrevo({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        teamName: data.teamName || null,
      }).catch((err) => {
        console.error('Failed to send player admin-create auto-reply (Brevo):', err);
      });
    }

    await logAudit(request, 'PLAYER_CREATED', {
      playerId: player.id,
      name: `${player.firstName} ${player.lastName}`.trim(),
      teamId: player.teamId || null,
    });

    return new Response(JSON.stringify(player), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create player', request);
  }
};
