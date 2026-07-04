/**
 * getPlayerView — resolves the v2 player-detail view model by slug or id.
 * Returns null when the player doesn't exist so the route can 404/redirect.
 */
import type { PlayerView } from "@/features/player/domain/entities/player-detail-v2";
import { fetchPlayerView } from "@/features/player/data/datasources/player-detail-v2";

export async function getPlayerView(slugOrId: string): Promise<PlayerView | null> {
	if (!slugOrId) return null;
	return fetchPlayerView(slugOrId);
}
