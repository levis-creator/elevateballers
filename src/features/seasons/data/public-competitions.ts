import { prisma } from "@/lib/prisma";
import type { PublicCompetitionOption } from "@/features/seasons/domain/entities/public-competition";

/** Public selector hierarchy: Season -> LeagueSeason -> optional Conference. */
export async function getPublicCompetitions(): Promise<PublicCompetitionOption[]> {
	const rows = await prisma.leagueSeason.findMany({
		where: { status: { not: "DRAFT" }, league: { active: true } },
		include: {
			season: { select: { id: true, name: true } },
			league: { select: { id: true, name: true } },
			conferences: {
				select: { id: true, name: true },
				orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
			},
		},
		orderBy: [{ startDate: "desc" }, { league: { name: "asc" } }],
	});

	return rows.map((row) => ({
		id: row.id,
		seasonId: row.season.id,
		seasonLabel: row.season.name,
		leagueId: row.league.id,
		leagueLabel: row.league.name,
		structure: row.competitionStructure,
		startDate: row.startDate.toISOString(),
		// A SINGLE_TABLE edition never exposes conference controls, even if
		// stale conference rows happen to exist from an earlier configuration.
		conferences:
			row.competitionStructure === "CONFERENCES" ? row.conferences : [],
	}));
}
