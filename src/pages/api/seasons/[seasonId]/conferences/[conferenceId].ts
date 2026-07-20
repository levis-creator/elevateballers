import type { APIRoute } from 'astro';
import { updateConference, deleteConference } from '../../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../../features/rbac/middleware';
import { logAudit } from '../../../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../../../lib/apiError';

export const prerender = false;

/**
 * PATCH /api/seasons/[seasonId]/conferences/[conferenceId] — rename a conference
 * and/or replace its team membership. Body: { name?: string, teamIds?: string[] }.
 * Both are optional; send only what changed.
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const body = await request.json().catch(() => ({}));

    const changes: { name?: string; teamIds?: string[] } = {};
    if (body?.name !== undefined) {
      const name = String(body.name ?? '').trim();
      if (!name) return json({ error: 'Conference name cannot be empty' }, 400);
      changes.name = name;
    }
    if (body?.teamIds !== undefined) {
      if (!Array.isArray(body.teamIds)) return json({ error: 'teamIds must be an array' }, 400);
      changes.teamIds = body.teamIds.filter((id: unknown) => typeof id === 'string');
    }

    const updated = await updateConference(params.seasonId!, params.conferenceId!, changes);
    if (!updated) return json({ error: 'Conference not found in this season' }, 404);

    await logAudit(request, 'SEASON_CONFERENCE_UPDATED', {
      seasonId: params.seasonId,
      conferenceId: params.conferenceId,
      renamed: changes.name !== undefined,
      teams: changes.teamIds?.length,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'update conference', request);
  }
};

/**
 * DELETE /api/seasons/[seasonId]/conferences/[conferenceId] — remove a
 * conference. Its teams are unassigned (SetNull), not deleted.
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const removed = await deleteConference(params.seasonId!, params.conferenceId!);
    if (!removed) return json({ error: 'Conference not found in this season' }, 404);

    await logAudit(request, 'SEASON_CONFERENCE_DELETED', {
      seasonId: params.seasonId,
      conferenceId: params.conferenceId,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete conference', request);
  }
};
