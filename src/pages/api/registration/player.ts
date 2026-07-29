import type { APIRoute } from 'astro';
import { createPlayer } from '../../../features/cms/lib/mutations';
import { prisma } from '../../../lib/prisma';
import { sendPlayerRegistrationAutoReply, sendAdminNotificationEmail } from '../../../lib/email';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRegistrationOpen } from '../../../lib/registrationGate';
import { allowPublicRegistration, genericRegistrationResponse, isHoneypotTriggered, normalizeEmail, normalizeId, normalizeOptionalText, normalizePhone, normalizeText, validatePlayerRegistration } from '../../../lib/publicRegistrationSecurity';

export const prerender = false;

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'unknown';

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    const rawData = await request.json();
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return genericRegistrationResponse();
    if (isHoneypotTriggered(rawData.website)) return genericRegistrationResponse();
    const jerseyNumber = rawData.jerseyNumber === undefined || rawData.jerseyNumber === null || rawData.jerseyNumber === '' ? undefined : Number(rawData.jerseyNumber);
    const data = {
      ...rawData,
      firstName: normalizeText(rawData.firstName),
      lastName: normalizeText(rawData.lastName),
      email: normalizeEmail(rawData.email),
      phone: normalizePhone(rawData.phone),
      position: normalizeText(rawData.position),
      jerseyNumber,
      height: normalizeOptionalText(rawData.height),
      weight: normalizeOptionalText(rawData.weight),
      teamName: normalizeOptionalText(rawData.teamName),
      leagueId: normalizeId(rawData.leagueId),
      seasonId: normalizeId(rawData.seasonId),
      leagueSeasonId: normalizeId(rawData.leagueSeasonId),
      additionalInfo: normalizeOptionalText(rawData.additionalInfo),
    };
    const validationError = validatePlayerRegistration(data);
    if (validationError) return new Response(JSON.stringify({ error: validationError }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (!await allowPublicRegistration('player', ip, data.email)) return genericRegistrationResponse(429);

    // Cloudflare Turnstile verification
    const turnstileToken = String(data['cf-turnstile-token'] ?? '').trim();
    if (!await verifyTurnstile(turnstileToken, ip)) {
      return new Response(
        JSON.stringify({ error: 'Security check failed. Please refresh and try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enforce the league/season registration window when the form scopes to one
    const gate = await checkRegistrationOpen(
      data.leagueId,
      data.seasonId,
      data.leagueSeasonId,
    );
    if (!gate.open) {
      return new Response(
        JSON.stringify({ error: gate.message ?? 'Registration is currently closed.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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

    const duplicateEmail = await prisma.player.findFirst({ where: { email: data.email }, select: { id: true } });
    const duplicateName = await prisma.player.findFirst({ where: { firstName: data.firstName, lastName: data.lastName, ...(teamId ? { teamId } : {}) }, select: { id: true } });
    if (duplicateEmail || duplicateName) return genericRegistrationResponse();

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

    await logAudit(request, 'PLAYER_REGISTRATION_SUBMITTED', {
      playerId: player.id,
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      teamName: data.teamName || null,
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Player registration submitted successfully',
      player
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'submit player registration', request);
  }
};
