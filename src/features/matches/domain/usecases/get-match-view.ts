/**
 * getMatchView — resolves the v2 match-detail view model by slug or id.
 * Returns null when the match doesn't exist so the route can 404/redirect.
 */
import type { MatchView } from "@/features/matches/domain/entities/match-detail-v2";
import { fetchMatchView } from "@/features/matches/data/datasources/match-detail-v2";

export async function getMatchView(slugOrId: string): Promise<MatchView | null> {
	if (!slugOrId) return null;
	return fetchMatchView(slugOrId);
}
