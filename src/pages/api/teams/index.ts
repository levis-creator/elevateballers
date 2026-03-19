import type { APIRoute } from 'astro';
import { getTeams } from '../../../features/cms/lib/queries';
import { createTeam } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendTeamRegistrationAutoReplyBrevo } from '../../../lib/email';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request, url }) => {
  const startTime = Date.now();
  try {
    console.log('[API /teams] GET request received at', new Date().toISOString());
    console.log('[API /teams] Fetching teams from database...');

    // Check if the query parameter explicitly requests approved teams only
    const approvedParam = url.searchParams.get('approved');

    // Try to get admin user, but don't fail if not authenticated
    let includeUnapproved = false;

    // If approved=true is explicitly requested, always filter for approved teams
    if (approvedParam === 'true') {
      includeUnapproved = false;
    } else {
      try {
        await requirePermission(request, 'teams:create');
        includeUnapproved = true; // Admins can see unapproved teams
      } catch {
        // Not an admin, only show approved teams
        includeUnapproved = false;
      }
    }

    // Add a timeout wrapper for the database query
    const queryPromise = getTeams(includeUnapproved);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000)
    );

    const teams = await Promise.race([queryPromise, timeoutPromise]) as any;
    const duration = Date.now() - startTime;
    
    console.log(`[API /teams] Successfully fetched ${teams.length} teams in ${duration}ms`);
    console.log('[API /teams] Teams data:', teams);

    return new Response(JSON.stringify(teams), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API /teams] Error after ${duration}ms:`, error);
    const errorMessage = error?.message || 'Failed to fetch teams';
    console.error('[API /teams] Error details:', {
      message: errorMessage,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'teams:create');
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return new Response(JSON.stringify({ error: 'Team name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if team name already exists
    const existing = await prisma.team.findUnique({
      where: { name: data.name },
      select: {
        id: true,
        name: true,
      },
    });

    if (existing) {
      return new Response(JSON.stringify({ error: 'A team with this name already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const team = await createTeam({
      name: data.name,
      nickname: data.nickname,
      logo: data.logo,
      description: data.description,
      approved: true, // Admin-created teams are approved by default
    });

    if (data.contactEmail) {
      sendTeamRegistrationAutoReplyBrevo({
        coachName: data.coachName || data.contactName || 'there',
        email: data.contactEmail,
        teamName: team.name,
        leagueName: data.leagueName || null,
      }).catch((err) => {
        console.error('Failed to send team admin-create auto-reply (Brevo):', err);
      });
    }

    await logAudit(request, 'TEAM_CREATED', {
      teamId: team.id,
      name: team.name,
    });

    return new Response(JSON.stringify(team), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create team' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
