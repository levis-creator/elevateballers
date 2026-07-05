/**
 * Use-case for the v2 Stat-Leaders page: return live leaders, or fall back to
 * demo data when the query fails or no completed matches exist.
 */
import { fetchLeadersData } from "@/features/stats/data/datasources/leaders-v2";
import { FALLBACK_LEADERS } from "@/features/stats/data/datasources/leaders-v2.fallback";
import type { LeadersData } from "@/features/stats/domain/entities/leaders-v2";

export async function getLeadersData(): Promise<LeadersData> {
	const data = await fetchLeadersData();
	return data ?? FALLBACK_LEADERS;
}
