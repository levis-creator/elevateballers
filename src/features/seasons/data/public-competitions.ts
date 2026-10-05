import { prisma } from "@/lib/prisma";
import { getZonedDateParts } from "@/features/matches/domain/usecases/utils";
import type { PublicCompetitionOption } from "@/features/seasons/domain/entities/public-competition";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "14 Mar – 15 Nov 2026" (year shown on both ends only when they differ). */
function formatDateRange(start: Date, end: Date): string {
	const a = getZonedDateParts(start);
	const b = getZonedDateParts(end);
	const left = `${a.day} ${MON[a.month - 1]}${a.year === b.year ? "" : ` ${a.year}`}`;
	return `${left} – ${b.day} ${MON[b.month - 1]} ${b.year}`;
}

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
		status: row.status,
		dateRange: formatDateRange(row.startDate, row.endDate),
		// A SINGLE_TABLE edition never exposes conference controls, even if
		// stale conference rows happen to exist from an earlier configuration.
		conferences:
			row.competitionStructure === "CONFERENCES" ? row.conferences : [],
	}));
}
