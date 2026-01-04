import type { APIRoute } from 'astro';
import { createTeam, createStaff, assignStaffToTeam } from '../../../features/cms/lib/mutations';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

/**
 * Parse a full name into firstName and lastName
 * Handles single names, two-part names, and multi-part names
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 1) {
    // Single name - use as first name, empty last name
    return { firstName: parts[0], lastName: '' };
  } else if (parts.length === 2) {
    // Two parts - first and last
    return { firstName: parts[0], lastName: parts[1] };
  } else {
    // Multiple parts - first part is first name, rest is last name
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.coachName || !data.contactEmail || !data.contactPhone) {
      return new Response(
        JSON.stringify({ error: 'Team name, coach name, contact email, and contact phone are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if team name already exists
    const existing = await prisma.team.findUnique({
      where: { name: data.name },
      select: { id: true, name: true },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A team with this name already exists' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get league name if leagueId is provided
    let leagueName: string | undefined;
    if (data.leagueId) {
      const league = await prisma.league.findUnique({
        where: { id: data.leagueId },
        select: { name: true },
      });
      leagueName = league?.name;
    }

    // Create team with description including registration info
    const description = [
      leagueName && `League: ${leagueName}`,
      data.coachName && `Coach: ${data.coachName}`,
      data.contactEmail && `Contact Email: ${data.contactEmail}`,
      data.contactPhone && `Contact Phone: ${data.contactPhone}`,
      data.additionalInfo && `Additional Info: ${data.additionalInfo}`,
    ]
      .filter(Boolean)
      .join('\n');

    const team = await createTeam({
      name: data.name,
      description: description || undefined,
      approved: false, // Public registrations are unapproved by default
    });

    // Parse coach name and create staff member
    const { firstName, lastName } = parseName(data.coachName);
    
    // Check if staff with same email already exists
    let coachStaff = await prisma.staff.findFirst({
      where: {
        email: data.contactEmail,
      },
    });

    // Create staff if doesn't exist
    if (!coachStaff) {
      coachStaff = await createStaff({
        firstName,
        lastName: lastName || firstName, // Use firstName as lastName if lastName is empty
        email: data.contactEmail,
        phone: data.contactPhone,
        role: 'COACH',
        bio: data.additionalInfo || undefined,
      });
    }

    // Assign coach to team
    try {
      await assignStaffToTeam({
        teamId: team.id,
        staffId: coachStaff.id,
        role: 'COACH',
      });
    } catch (error: any) {
      // If staff is already assigned, that's okay - continue
      if (!error.message.includes('already assigned')) {
        console.error('Error assigning coach to team:', error);
        // Don't fail the registration if assignment fails, but log it
      }
    }

    // Auto-link players who registered with this team name
    let linkedPlayersCount = 0;
    try {
      // Find players who registered with this team name but aren't linked yet
      const playersToLink = await prisma.player.findMany({
        where: {
          teamId: null,
          OR: [
            {
              bio: {
                contains: `Team: ${team.name}`,
              },
            },
            {
              bio: {
                contains: team.name,
              },
            },
          ],
        },
      });

      if (playersToLink.length > 0) {
        await prisma.player.updateMany({
          where: {
            id: {
              in: playersToLink.map(p => p.id),
            },
          },
          data: {
            teamId: team.id,
          },
        });

        linkedPlayersCount = playersToLink.length;

        // Create notifications for auto-linked players
        for (const player of playersToLink) {
          await prisma.registrationNotification.create({
            data: {
              type: 'PLAYER_AUTO_LINKED',
              playerId: player.id,
              teamId: team.id,
              message: `Player ${player.firstName} ${player.lastName} was automatically linked to team ${team.name}`,
              metadata: {
                playerName: `${player.firstName} ${player.lastName}`,
                teamName: team.name,
              },
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Error auto-linking players:', error);
      // Don't fail the registration if auto-linking fails
    }

    // Create notification for team registration
    try {
      await prisma.registrationNotification.create({
        data: {
          type: 'TEAM_REGISTERED',
          teamId: team.id,
          staffId: coachStaff.id,
          message: `New team registration: ${team.name} (Coach: ${data.coachName})`,
          metadata: {
            teamName: team.name,
            coachName: data.coachName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            leagueName: leagueName,
            linkedPlayersCount: linkedPlayersCount,
          },
        },
      });
    } catch (error: any) {
      console.error('Error creating team registration notification:', error);
      // Don't fail the registration if notification creation fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Team registration submitted successfully',
      team,
      coach: coachStaff,
      linkedPlayers: linkedPlayersCount,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating team registration:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit team registration' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

