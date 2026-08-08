import type { APIRoute } from "astro";
import { getMatchView } from "@/features/matches/domain/usecases/get-match-view";
import { canViewMatchBoxScore, resolvePublicMatchPageSettings, siteSettingsService } from "@/features/settings";
import { getCurrentUser } from "@/features/cms/lib/auth";

export const prerender = false;

/**
 * GET /api/matches/[matchId]/view
 * Public, read-only. Returns the computed v2 match view model (scoreboard,
 * quarters, box scores, play-by-play, …). The match-detail island polls this
 * while a match is LIVE to refresh in place. `matchId` may be a slug or cuid.
 */
export const GET: APIRoute = async ({ params, request }) => {
	const id = params.matchId;
	if (!id) {
		return new Response(JSON.stringify({ error: "Match ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const [view, records, currentUser] = await Promise.all([
		getMatchView(id),
		siteSettingsService.list("match").catch(() => []),
		getCurrentUser(request).catch(() => null),
	]);
	if (!view) {
		return new Response(JSON.stringify({ error: "Match not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const settings = resolvePublicMatchPageSettings(records);
	const staff = Boolean((currentUser as any)?.userRoles?.length);
	if (view.state === "final" && !view.resultPublished && !staff) {
		return new Response(JSON.stringify({ error: "Match not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}
	const canViewBox = canViewMatchBoxScore(settings.boxScore, Boolean(currentUser), staff);
	const publicView = canViewBox ? view : { ...view, box: { home: [], away: [] } };
	const cacheSeconds = Math.max(1, settings.delay);
	return new Response(JSON.stringify(publicView), {
		headers: {
			"Content-Type": "application/json",
			// Short edge cache — dedupes concurrent live pollers without a
			// user-visible lag against the ~15s client poll interval.
			"Cache-Control": currentUser ? "private, no-store" : `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`,
		},
	});
};
