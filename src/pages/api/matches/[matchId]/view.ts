import type { APIRoute } from "astro";
import { getMatchView } from "@/features/matches/domain/usecases/get-match-view";

export const prerender = false;

/**
 * GET /api/matches/[matchId]/view
 * Public, read-only. Returns the computed v2 match view model (scoreboard,
 * quarters, box scores, play-by-play, …). The match-detail island polls this
 * while a match is LIVE to refresh in place. `matchId` may be a slug or cuid.
 */
export const GET: APIRoute = async ({ params }) => {
	const id = params.matchId;
	if (!id) {
		return new Response(JSON.stringify({ error: "Match ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const view = await getMatchView(id);
	if (!view) {
		return new Response(JSON.stringify({ error: "Match not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify(view), {
		headers: {
			"Content-Type": "application/json",
			// Short edge cache — dedupes concurrent live pollers without a
			// user-visible lag against the ~15s client poll interval.
			"Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
		},
	});
};
