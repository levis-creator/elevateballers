import type { APIRoute } from 'astro';
import { createPlayer } from '../../../features/cms/lib/mutations';
import { prisma } from '../../../lib/prisma';
import { sendPlayerRegistrationAutoReply, sendAdminNotificationEmail } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.position) {
      return new Response(
        JSON.stringify({ error: 'First name, last name, email, phone, and position are required' }),
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

    // Create player with bio excluding private contact info
    const bioParts = [
      data.additionalInfo && `Additional Info: ${data.additionalInfo}`,
    ]
      .filter(Boolean)
      .join('\n');

    const player = await createPlayer({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      height: data.height,
      weight: data.weight,
      position: data.position,
      jerseyNumber: data.jerseyNumber,
      teamId: teamId,
      bio: bioParts || undefined,
      approved: false, // Public registrations are unapproved by default
    });

    // Create notification for player registration
    try {
      await prisma.registrationNotification.create({
        data: {
          type: 'PLAYER_REGISTERED',
          playerId: player.id,
          teamId: teamId || undefined,
          message: `New player registration: ${data.firstName} ${data.lastName}${teamId ? ` (Team: ${data.teamName})` : data.teamName ? ` (Pending team: ${data.teamName})` : ''}`,
          metadata: {
            playerName: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            teamName: data.teamName || null,
            teamLinked: !!teamId,
          },
        },
      });
      const adminUrl = `${process.env.SITE_URL || 'https://elevateballers.com'}/admin/players/${player.id}`;
      sendAdminNotificationEmail({
        type: 'player_registered',
        title: 'New Player Registration',
        message: `${data.firstName} ${data.lastName} submitted a player registration.`,
        actionUrl: adminUrl,
        actionText: 'Review Player',
      }).catch((err) => {
        console.error('Failed to send admin notification email:', err);
      });
    } catch (error: any) {
      console.error('Error creating player registration notification:', error);
      // Don't fail the registration if notification creation fails
    }

    // Send auto-reply email (fire-and-forget)
    sendPlayerRegistrationAutoReply({
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      teamName: data.teamName || null,
    }).catch((err) => {
      console.error('Failed to send player registration auto-reply:', err);
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
