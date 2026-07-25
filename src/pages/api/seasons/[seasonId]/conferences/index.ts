import type { APIRoute } from 'astro';
import { createConference } from '../../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../../features/rbac/middleware';
import { logAudit } from '../../../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../../../lib/apiError';

export const prerender = false;

/**
 * POST /api/seasons/[seasonId]/conferences — create a conference on the season
 * and optionally seed its team membership. Body: { name, teamIds?: string[] }.
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const body = await request.json().catch(() => ({}));

    const name = String(body?.name ?? '').trim();
    if (!name) return json({ error: 'Conference name is required' }, 400);

    const teamIds = Array.isArray(body?.teamIds) ? body.teamIds.filter((id: unknown) => typeof id === 'string') : [];

    const leagueSeasonId =
      typeof body?.leagueSeasonId === 'string' ? body.leagueSeasonId : undefined;
    const conference = await createConference(
      params.seasonId!,
      name,
      teamIds,
      leagueSeasonId,
    );
    await logAudit(request, 'SEASON_CONFERENCE_CREATED', {
      seasonId: params.seasonId,
      conferenceId: conference.id,
      name: conference.name,
      teams: teamIds.length,
      leagueSeasonId,
    });
    return json(conference, 201);
  } catch (error) {
    return handleApiError(error, 'create conference', request);
  }
};
