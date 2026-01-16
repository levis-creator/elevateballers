import type { APIRoute } from 'astro';
import { getPlayers } from '../../../features/cms/lib/queries';
import { createPlayer } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get('teamId') || undefined;

    // Try to get admin user, but don't fail if not authenticated
    let includeUnapproved = false;
    try {
      await requireAdmin(request);
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
    console.error('Error fetching players:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch players' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const data = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName) {
      return new Response(JSON.stringify({ error: 'First name and last name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const player = await createPlayer({
      firstName: data.firstName,
      lastName: data.lastName,
      height: data.height,
      weight: data.weight,
      image: data.image,
      bio: data.bio,
      teamId: data.teamId || undefined,
      position: data.position,
      jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber) : undefined,
      stats: data.stats,
      approved: true, // Admin-created players are approved by default
    });

    return new Response(JSON.stringify(player), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating player:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create player' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

