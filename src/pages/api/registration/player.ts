import type { APIRoute } from 'astro';
import { createPlayer } from '../../../features/cms/lib/mutations';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      return new Response(
        JSON.stringify({ error: 'First name, last name, email, and phone are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Find team by name if provided
    let teamId: string | undefined;
    if (data.teamName) {
      const team = await prisma.team.findUnique({
        where: { name: data.teamName },
        select: { id: true },
      });
      teamId = team?.id;
    }

    // Create player with bio including registration info
    const bioParts = [
      data.email && `Email: ${data.email}`,
      data.phone && `Phone: ${data.phone}`,
      data.teamName && `Team: ${data.teamName}`,
      data.additionalInfo && `Additional Info: ${data.additionalInfo}`,
    ]
      .filter(Boolean)
      .join('\n');

    const player = await createPlayer({
      firstName: data.firstName,
      lastName: data.lastName,
      height: data.height,
      weight: data.weight,
      position: data.position,
      jerseyNumber: data.jerseyNumber,
      teamId: teamId,
      bio: bioParts || undefined,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Player registration submitted successfully',
      player 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating player registration:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit player registration' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

