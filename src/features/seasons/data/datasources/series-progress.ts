import { prisma } from "@/lib/prisma";
import { resolvePublicFixturesSettings, siteSettingsService } from "@/features/settings";
import {
	SERIES_STAGES,
	type KnockoutGame,
	type SeriesFormat,
} from "@/features/seasons/domain/entities/season";

/** The Fixtures "Playoff format" setting; its defaults when settings can't load. */
export async function loadSeriesFormat(): Promise<SeriesFormat> {
	const records = await siteSettingsService.list("fixtures").catch(() => []);
	return resolvePublicFixturesSettings(records).playoffFormat;
}

/**
 * Quarterfinal, semifinal and final games matching `where`, grouped by season,
 * for `seriesAwareProgress`. Games with no season are left out.
 */
export async function knockoutGamesBySeason(where: {
	seasonId?: string;
	leagueId?: string;
}): Promise<Map<string, KnockoutGame[]>> {
	const rows = await prisma.match.findMany({
		where: { ...where, seasonId: where.seasonId ?? { not: null }, stage: { in: SERIES_STAGES } },
		select: {
			seasonId: true,
			stage: true,
			status: true,
			team1Id: true,
			team2Id: true,
			team1Score: true,
			team2Score: true,
			winnerId: true,
		},
	});
	const bySeason = new Map<string, KnockoutGame[]>();
	for (const { seasonId, ...game } of rows) {
		if (!seasonId) continue;
		bySeason.set(seasonId, [...(bySeason.get(seasonId) ?? []), game]);
	}
	return bySeason;
}
