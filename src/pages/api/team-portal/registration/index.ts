import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { listTeamSeasonRegistrationOptions, requestTeamSeasonRegistration } from '@/features/team-portal/application/team-season-registration';
import { normalizeOptionalText, normalizeText } from '@/lib/publicRegistrationSecurity';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const team = (await requireActiveTeamContext(user.id, new URL(request.url).searchParams.get('teamId'))).team;
    return new Response(JSON.stringify(await listTeamSeasonRegistrationOptions(team.id)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'load Team Portal registration options', request); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const body = await request.json();
    const team = (await requireActiveTeamContext(user.id, normalizeText(body?.teamId))).team;
    const leagueSeasonId = normalizeText(body?.leagueSeasonId);
    if (!leagueSeasonId) return new Response(JSON.stringify({ error: 'A season edition is required.' }), { status: 400 });
    const result = await requestTeamSeasonRegistration({ teamId: team.id, teamName: team.name, leagueSeasonId, applicantName: user.name, applicantEmail: user.email, notes: normalizeOptionalText(body?.notes) });
    return new Response(JSON.stringify(result), { status: 201, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'submit Team Portal registration', request); }
};
