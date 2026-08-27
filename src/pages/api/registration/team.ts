import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRegistrationOpen } from '../../../lib/registrationGate';
import { publishToJob } from '../../../lib/qstash';
import { processRegistrationEmailJob } from '../../../features/registration/application/process-registration-email-job';
import {
  findSubmission,
  submitTeamRegistration,
} from '../../../features/registration/data/datasources/public-submission';
import {
  allowPublicRegistration,
  genericRegistrationResponse,
  getIdempotencyKey,
  isHoneypotTriggered,
  normalizeEmail,
  normalizeId,
  normalizeOptionalText,
  normalizePhone,
  normalizeText,
  releasePublicRegistrationLimit,
  validateTeamRegistration,
} from '../../../lib/publicRegistrationSecurity';
import {
  registrationWindow,
  resolvePublicRegistrationSettings,
  siteSettingsService,
} from '../../../features/settings';

export const prerender = false;

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'unknown';

function responseFromStored(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function loadRegistrationSettings() {
  try {
    return resolvePublicRegistrationSettings(await siteSettingsService.list('registration'));
  } catch {
    return resolvePublicRegistrationSettings([]);
  }
}

async function safeCount(
  model: { count?: (args: unknown) => Promise<number> } | undefined,
  args: unknown
): Promise<number> {
  try {
    return model?.count ? await model.count(args) : 0;
  } catch {
    return 0;
  }
}

export const POST: APIRoute = async ({ request }) => {
  let consumedLimit: { ip: string; email: string } | null = null;
  try {
    const ip = getClientIp(request);
    const rawData = await request.json();
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData))
      return genericRegistrationResponse();
    if (isHoneypotTriggered(rawData.website)) return genericRegistrationResponse();
    const idempotencyKey = getIdempotencyKey(request, rawData);
    if (!idempotencyKey)
      return new Response(JSON.stringify({ error: 'A valid idempotency key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    const existingSubmission = await findSubmission(idempotencyKey);
    if (existingSubmission?.response) return responseFromStored(existingSubmission.response);
    const registrationSettings = await loadRegistrationSettings();
    if (!registrationWindow(registrationSettings).open)
      return new Response(JSON.stringify({ error: registrationSettings.closedBody }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });

    const data = {
      ...rawData,
      name: normalizeText(rawData.name),
      coachName: normalizeText(rawData.coachName),
      contactEmail: normalizeEmail(rawData.contactEmail),
      contactPhone: normalizePhone(rawData.contactPhone),
      leagueId: normalizeId(rawData.leagueId),
      seasonId: normalizeId(rawData.seasonId),
      leagueSeasonId: normalizeId(rawData.leagueSeasonId),
      additionalInfo: normalizeOptionalText(rawData.additionalInfo),
    };
    const validationError = validateTeamRegistration(data);
    if (validationError)
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    if (!(await allowPublicRegistration('team', ip, data.contactEmail)))
      return genericRegistrationResponse(429);
    consumedLimit = { ip, email: data.contactEmail };
    const turnstileToken = String(data['cf-turnstile-token'] ?? '').trim();
    if (!(await verifyTurnstile(turnstileToken, ip)))
      return new Response(
        JSON.stringify({ error: 'Security check failed. Please refresh and try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );

    // Public team registration always belongs to the one active season. The
    // client may display the active option, but it must not be trusted to
    // choose an historical or inactive season.
    const activeEdition = data.leagueId
      ? await prisma.leagueSeason.findFirst({
          where: { leagueId: data.leagueId, season: { active: true } },
          select: { id: true, leagueId: true, seasonId: true },
          orderBy: { startDate: 'desc' },
        })
      : null;
    if (!activeEdition)
      return new Response(
        JSON.stringify({ error: 'No active season is available for this league.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    if (data.leagueSeasonId && data.leagueSeasonId !== activeEdition.id)
      return new Response(
        JSON.stringify({ error: 'Registration must be submitted to the active season.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    if (data.seasonId && data.seasonId !== activeEdition.seasonId)
      return new Response(
        JSON.stringify({ error: 'Registration must be submitted to the active season.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );

    const registrationData = {
      ...data,
      seasonId: activeEdition.seasonId,
      leagueSeasonId: activeEdition.id,
    };
    const gate = await checkRegistrationOpen(
      registrationData.leagueId,
      registrationData.seasonId,
      registrationData.leagueSeasonId,
      { siteMasterOpen: true }
    );
    if (!gate.open)
      return new Response(
        JSON.stringify({ error: gate.message ?? 'Registration is currently closed.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    const [seasonTeams, pendingApplications] = await Promise.all([
      safeCount((prisma as any).seasonTeam, {
        where: { leagueSeasonId: registrationData.leagueSeasonId },
      }),
      safeCount((prisma as any).seasonRegistrationApplication, {
        where: {
          leagueSeasonId: registrationData.leagueSeasonId,
          status: { in: ['PENDING', 'OWNERSHIP_VERIFICATION'] },
        },
      }),
    ]);
    const occupiedSlots = seasonTeams + pendingApplications;
    if (occupiedSlots >= registrationSettings.slots)
      return new Response(
        JSON.stringify({ error: 'All team registration slots for this season have been filled.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    const existingTeam = await prisma.team.findUnique({
      where: { name: data.name },
      select: { id: true },
    });
    if (existingTeam) return genericRegistrationResponse();
    let leagueName: string | undefined;
    if (data.leagueId)
      leagueName = (
        await prisma.league.findUnique({ where: { id: data.leagueId }, select: { name: true } })
      )?.name;

    const result = await submitTeamRegistration({
      idempotencyKey,
      name: data.name,
      coachName: data.coachName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      leagueId: registrationData.leagueId,
      seasonId: registrationData.seasonId,
      leagueSeasonId: registrationData.leagueSeasonId,
      additionalInfo: data.additionalInfo,
      leagueName,
      requireApproval: registrationSettings.approval,
      entryFee: registrationSettings.fee,
    });
    consumedLimit = null;
    await logAudit(request, 'TEAM_REGISTRATION_SUBMITTED', {
      teamId: result.teamId,
      teamName: data.name,
      coachName: data.coachName,
    });
    for (const jobId of result.jobIds) {
      if (!(await publishToJob('/api/jobs/send-email', { registrationJobId: jobId })))
        void processRegistrationEmailJob(jobId).catch((error) =>
          console.error('[registration] team email job failed:', error)
        );
    }
    return responseFromStored(result.response, 201);
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes?.('idempotency_key')) {
      const key = request.headers.get('idempotency-key');
      if (key) {
        const existing = await findSubmission(key);
        if (existing?.response) return responseFromStored(existing.response);
      }
      return genericRegistrationResponse();
    }
    if (consumedLimit)
      await releasePublicRegistrationLimit('team', consumedLimit.ip, consumedLimit.email);
    return handleApiError(error, 'submit team registration', request);
  }
};
