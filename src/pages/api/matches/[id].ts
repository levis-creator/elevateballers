import type { APIRoute } from 'astro';
import { getMatchById, getMatchWithFullDetails, getSiteSettingByKey } from '../../../features/cms/lib/queries';
import { updateMatch, deleteMatch } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { json, handleApiError } from '../../../lib/apiError';
import { validatePlayoffMatch } from '../../../features/matches/lib/playoff-rules';
import { resolveLeagueSeasonById } from '../../../features/seasons/data/league-season-scope';
import { getCurrentUser } from '../../../features/cms/lib/auth';
import { canViewMatchBoxScore, resolvePublicMatchPageSettings, siteSettingsService } from '../../../features/settings';

export const prerender = false;

const ALLOW_EDIT_AFTER_COMPLETION_KEY = 'match_allow_edit_after_completion';

async function isPostCompletionEditAllowed(): Promise<boolean> {
  try {
    const setting = await getSiteSettingByKey(ALLOW_EDIT_AFTER_COMPLETION_KEY);
    return setting?.value === 'true';
  } catch {
    // On lookup failure, fall back to the safe default (disallow).
    return false;
  }
}

export const GET: APIRoute = async ({ params, url, request }) => {
  try {
    const includeDetails = url.searchParams.get('includeDetails') === 'true';
    const match = includeDetails
      ? await getMatchWithFullDetails(params.id!)
      : await getMatchById(params.id!);

    if (!match) return json({ error: 'Match not found' }, 404);

    const currentUser = await getCurrentUser(request).catch(() => null);
    const staff = Boolean((currentUser as any)?.userRoles?.length);
    if (match.status === 'COMPLETED' && !(match as any).resultPublishedAt && !staff) {
      return json({ error: 'Match not found' }, 404);
    }
    const matchSettings = resolvePublicMatchPageSettings(
      await siteSettingsService.list('match').catch(() => []),
    );
    const canViewBoxScore = canViewMatchBoxScore(matchSettings.boxScore, Boolean(currentUser), staff);
    const responseMatch = includeDetails && !canViewBoxScore
      ? { ...match, matchPlayers: [] }
      : match;

    // Completed matches are immutable — cache aggressively
    const cacheControl = match.status === 'COMPLETED'
      ? 'public, s-maxage=3600, stale-while-revalidate=300'
      : 'no-store, max-age=0';

    return new Response(JSON.stringify(responseMatch), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    return handleApiError(error, 'fetch match', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'matches:update');

    const existingMatch = await getMatchById(params.id!);
    if (existingMatch?.status === 'COMPLETED' && !(await isPostCompletionEditAllowed())) {
      return json(
        {
          error:
            'Cannot edit a completed match. Enable "Allow editing matches after completion" in Site Settings → Matches to override.',
        },
        403,
      );
    }

    const data = await request.json();

    if (data.status === 'COMPLETED' && existingMatch?.status !== 'COMPLETED') {
      const settings = resolvePublicMatchPageSettings(
        await siteSettingsService.list('match').catch(() => []),
      );
      data.resultPublishedAt = settings.autoPublish ? new Date() : null;
    } else if (data.status && data.status !== 'COMPLETED') {
      data.resultPublishedAt = null;
    }

    if (data.date) data.date = new Date(data.date);

    if (data.stage !== undefined) {
      const s = typeof data.stage === 'string' ? data.stage.trim() : data.stage;
      if (s === '__none' || s === '') data.stage = undefined;
    }

    // Enforce playoff rules against the match's effective state — a partial edit
    // (e.g. just a score) still has to satisfy them, so fall back to the stored
    // values for any field the request doesn't touch.
    const effectiveLeagueSeasonId =
      data.leagueSeasonId !== undefined ? data.leagueSeasonId : existingMatch?.leagueSeasonId;
    const effectiveScope = effectiveLeagueSeasonId
      ? await resolveLeagueSeasonById(effectiveLeagueSeasonId, {
          seasonId: data.seasonId,
          leagueId: data.leagueId,
        })
      : null;
    const effective = {
      stage: data.stage !== undefined ? data.stage : existingMatch?.stage,
      seasonId: effectiveScope?.seasonId,
      team1Id: data.team1Id !== undefined ? data.team1Id : existingMatch?.team1Id,
      team2Id: data.team2Id !== undefined ? data.team2Id : existingMatch?.team2Id,
    };

    // Every match must be categorised with a stage.
    if (!effective.stage) return json({ error: 'Match stage is required' }, 400);
    if (!effectiveScope && effective.stage !== 'EXHIBITION') {
      return json({ error: 'leagueSeasonId is required for competition matches' }, 400);
    }
    if (effectiveScope) {
      data.leagueSeasonId = effectiveScope.leagueSeasonId;
      data.leagueId = effectiveScope.leagueId;
      data.seasonId = effectiveScope.seasonId;
    }

    const playoffError = validatePlayoffMatch(effective);
    if (playoffError) return json({ error: playoffError }, 400);

    const match = await updateMatch(params.id!, data);
    if (!match) return json({ error: 'Match not found' }, 404);

    await logAudit(request, 'MATCH_UPDATED', {
      matchId: match.id,
      leagueId: match.leagueId,
      date: match.date,
      status: match.status,
    });

    return json(match, 200);
  } catch (error) {
    return handleApiError(error, 'update match', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'matches:update');
    const success = await deleteMatch(params.id!);

    if (!success) return json({ error: 'Failed to delete match' }, 500);

    await logAudit(request, 'MATCH_DELETED', { matchId: params.id });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete match', request);
  }
};
