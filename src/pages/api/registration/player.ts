import type { APIRoute } from 'astro';
import { getClientIp } from '../../../lib/getClientIp';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRegistrationOpen } from '../../../lib/registrationGate';
import { sharedSignals } from '../../../features/registration/domain/player-duplicates';
import { processRegistrationEmailJob } from '../../../features/registration/application/process-registration-email-job';
import { findSubmission, submitPlayerRegistration } from '../../../features/registration/data/datasources/public-submission';
import { allowPublicRegistration, genericRegistrationResponse, getIdempotencyKey, isHoneypotTriggered, normalizeEmail, normalizeId, normalizeOptionalText, normalizePhone, normalizeText, releasePublicRegistrationLimit, validatePlayerRegistration } from '../../../lib/publicRegistrationSecurity';
import { registrationWindow, resolvePublicPrivacyPolicySettings, resolvePublicRegistrationSettings, siteSettingsService } from '../../../features/settings';
import { checkPrivacyConsent } from '../../../features/registration/application/privacy-consent';
import { createOperationalNotification } from '../../../features/cms/lib/adminNotifications';

export const prerender = false;


function responseFromStored(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

async function loadRegistrationSettings() {
  try {
    return resolvePublicRegistrationSettings(await siteSettingsService.list('registration'));
  } catch {
    return resolvePublicRegistrationSettings([]);
  }
}

async function loadPrivacyPolicySettings() {
  try {
    return resolvePublicPrivacyPolicySettings(await siteSettingsService.list('privacy'));
  } catch {
    return resolvePublicPrivacyPolicySettings([]);
  }
}

export const POST: APIRoute = async ({ request }) => {
  let consumedLimit: { ip: string; email: string } | null = null;
  try {
    const ip = getClientIp(request);
    const rawData = await request.json();
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return genericRegistrationResponse();
    if (isHoneypotTriggered(rawData.website)) return genericRegistrationResponse();
    const idempotencyKey = getIdempotencyKey(request, rawData);
    if (!idempotencyKey) return new Response(JSON.stringify({ error: 'A valid idempotency key is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const existingSubmission = await findSubmission(idempotencyKey);
    if (existingSubmission?.response) return responseFromStored(existingSubmission.response);
    const registrationSettings = await loadRegistrationSettings();
    if (!registrationSettings.playerMode) return new Response(JSON.stringify({ error: 'Individual player registration is currently disabled.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    if (!registrationWindow(registrationSettings).open) return new Response(JSON.stringify({ error: registrationSettings.closedBody }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    const jerseyNumber = rawData.jerseyNumber === undefined || rawData.jerseyNumber === null || rawData.jerseyNumber === '' ? undefined : Number(rawData.jerseyNumber);
    const data = { ...rawData, firstName: normalizeText(rawData.firstName), lastName: normalizeText(rawData.lastName), email: normalizeEmail(rawData.email), phone: normalizePhone(rawData.phone), position: normalizeText(rawData.position), jerseyNumber, height: normalizeOptionalText(rawData.height), weight: normalizeOptionalText(rawData.weight), teamName: normalizeOptionalText(rawData.teamName), leagueId: normalizeId(rawData.leagueId), seasonId: normalizeId(rawData.seasonId), leagueSeasonId: normalizeId(rawData.leagueSeasonId), additionalInfo: normalizeOptionalText(rawData.additionalInfo) };
    const validationError = validatePlayerRegistration(data);
    if (validationError) return new Response(JSON.stringify({ error: validationError }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const privacyConsent = checkPrivacyConsent(rawData, await loadPrivacyPolicySettings());
    if (!privacyConsent.ok) return new Response(JSON.stringify({ error: privacyConsent.error }), { status: privacyConsent.status, headers: { 'Content-Type': 'application/json' } });
    if (!await allowPublicRegistration('player', ip, data.email)) return genericRegistrationResponse(429);
    consumedLimit = { ip, email: data.email };
    const turnstileToken = String(data['cf-turnstile-token'] ?? '').trim();
    if (!await verifyTurnstile(turnstileToken, ip)) return new Response(JSON.stringify({ error: 'Security check failed. Please refresh and try again.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const gate = await checkRegistrationOpen(data.leagueId, data.seasonId, data.leagueSeasonId, { siteMasterOpen: true });
    if (!gate.open) return new Response(JSON.stringify({ error: gate.message ?? 'Registration is currently closed.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    let teamId: string | undefined;
    if (data.teamName) teamId = (await prisma.team.findUnique({ where: { name: data.teamName }, select: { id: true } }))?.id;
    // Never reject on a repeat email or name: minors often use their coach's
    // email or phone, and names repeat. A same-name player who also shares a
    // phone, email or team is flagged for review; the registration still goes in.
    const sameName = await prisma.player.findMany({
      where: { firstName: data.firstName, lastName: data.lastName, archived: false, mergedIntoId: null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, teamId: true },
      take: 20,
    });
    const incoming = { id: 'incoming', firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, teamId: teamId ?? null };
    const likelyMatch = sameName.map((player) => ({ player, reasons: sharedSignals(incoming, player) })).find(({ reasons }) => reasons.length);
    if (likelyMatch) {
      await createOperationalNotification({
        type: 'REGISTRATION_DUPLICATE',
        message: `Possible duplicate player registration for ${data.firstName} ${data.lastName}`.trim(),
        severity: 'warning',
        metadata: { existingPlayerId: likelyMatch.player.id, reasons: likelyMatch.reasons, action: 'REVIEW_DUPLICATE' },
      }).catch((notificationError) => console.warn('[registration] duplicate notification failed:', notificationError));
    }

    const result = await submitPlayerRegistration({ idempotencyKey, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, position: data.position, jerseyNumber: data.jerseyNumber, height: data.height, weight: data.weight, teamName: data.teamName, teamId, additionalInfo: data.additionalInfo, requireApproval: registrationSettings.approval, entryFee: registrationSettings.fee, consent: privacyConsent.consent });
    consumedLimit = null;
    await logAudit(request, 'PLAYER_REGISTRATION_SUBMITTED', { playerId: result.playerId, name: `${data.firstName} ${data.lastName}`.trim() });
    for (const jobId of result.jobIds) {
      void processRegistrationEmailJob(jobId).catch((error) => console.error('[registration] player email job failed:', error));
    }
    return responseFromStored(result.response, 201);
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes?.('idempotency_key')) {
      const key = request.headers.get('idempotency-key');
      if (key) { const existing = await findSubmission(key); if (existing?.response) return responseFromStored(existing.response); }
      return genericRegistrationResponse();
    }
    if (consumedLimit) await releasePublicRegistrationLimit('player', consumedLimit.ip, consumedLimit.email);
    return handleApiError(error, 'submit player registration', request);
  }
};
