import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRegistrationOpen } from '../../../lib/registrationGate';
import { publishToJob } from '../../../lib/qstash';
import { processRegistrationEmailJob } from '../../../features/registration/application/process-registration-email-job';
import { findSubmission, submitTeamRegistration } from '../../../features/registration/data/datasources/public-submission';
import { allowPublicRegistration, genericRegistrationResponse, getIdempotencyKey, isHoneypotTriggered, normalizeEmail, normalizeId, normalizeOptionalText, normalizePhone, normalizeText, validateTeamRegistration } from '../../../lib/publicRegistrationSecurity';

export const prerender = false;

const getClientIp = (request: Request): string => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';

function responseFromStored(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    const rawData = await request.json();
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return genericRegistrationResponse();
    if (isHoneypotTriggered(rawData.website)) return genericRegistrationResponse();
    const idempotencyKey = getIdempotencyKey(request, rawData);
    if (!idempotencyKey) return new Response(JSON.stringify({ error: 'A valid idempotency key is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const existingSubmission = await findSubmission(idempotencyKey);
    if (existingSubmission?.response) return responseFromStored(existingSubmission.response);

    const data = { ...rawData, name: normalizeText(rawData.name), coachName: normalizeText(rawData.coachName), contactEmail: normalizeEmail(rawData.contactEmail), contactPhone: normalizePhone(rawData.contactPhone), leagueId: normalizeId(rawData.leagueId), seasonId: normalizeId(rawData.seasonId), leagueSeasonId: normalizeId(rawData.leagueSeasonId), additionalInfo: normalizeOptionalText(rawData.additionalInfo) };
    const validationError = validateTeamRegistration(data);
    if (validationError) return new Response(JSON.stringify({ error: validationError }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (!await allowPublicRegistration('team', ip, data.contactEmail)) return genericRegistrationResponse(429);
    const turnstileToken = String(data['cf-turnstile-token'] ?? '').trim();
    if (!await verifyTurnstile(turnstileToken, ip)) return new Response(JSON.stringify({ error: 'Security check failed. Please refresh and try again.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const gate = await checkRegistrationOpen(data.leagueId, data.seasonId, data.leagueSeasonId);
    if (!gate.open) return new Response(JSON.stringify({ error: gate.message ?? 'Registration is currently closed.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    const existingTeam = await prisma.team.findUnique({ where: { name: data.name }, select: { id: true } });
    if (existingTeam) return genericRegistrationResponse();
    let leagueName: string | undefined;
    if (data.leagueId) leagueName = (await prisma.league.findUnique({ where: { id: data.leagueId }, select: { name: true } }))?.name;

    const result = await submitTeamRegistration({ idempotencyKey, name: data.name, coachName: data.coachName, contactEmail: data.contactEmail, contactPhone: data.contactPhone, leagueId: data.leagueId, additionalInfo: data.additionalInfo, leagueName });
    await logAudit(request, 'TEAM_REGISTRATION_SUBMITTED', { teamId: result.teamId, teamName: data.name, coachName: data.coachName });
    for (const jobId of result.jobIds) {
      if (!await publishToJob('/api/jobs/send-email', { registrationJobId: jobId })) void processRegistrationEmailJob(jobId).catch((error) => console.error('[registration] team email job failed:', error));
    }
    return responseFromStored(result.response, 201);
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes?.('idempotency_key')) {
      const key = request.headers.get('idempotency-key');
      if (key) { const existing = await findSubmission(key); if (existing?.response) return responseFromStored(existing.response); }
      return genericRegistrationResponse();
    }
    return handleApiError(error, 'submit team registration', request);
  }
};
