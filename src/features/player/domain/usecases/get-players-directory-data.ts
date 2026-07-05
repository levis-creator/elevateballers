/**
 * Use-case for the v2 Players directory: return the live roster, or fall back to
 * demo data when the query fails or no approved players exist.
 */
import { fetchPlayersDirectory } from "@/features/player/data/datasources/players-directory-v2";
import { FALLBACK_PLAYERS_DIRECTORY } from "@/features/player/data/datasources/players-directory-v2.fallback";
import type { PlayersDirectoryData } from "@/features/player/domain/entities/players-directory-v2";

export async function getPlayersDirectoryData(): Promise<PlayersDirectoryData> {
	const data = await fetchPlayersDirectory();
	return data ?? FALLBACK_PLAYERS_DIRECTORY;
}
