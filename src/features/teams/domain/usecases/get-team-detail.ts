/** getTeamDetail — loads a single team for the v2 page. Null → 404. */
import type { TeamDetail } from "@/features/teams/domain/entities/team-detail";
import { fetchTeamDetail } from "@/features/teams/data/datasources/team-detail";

export async function getTeamDetail(slug: string): Promise<TeamDetail | null> {
	try {
		return await fetchTeamDetail(slug);
	} catch {
		return null;
	}
}
