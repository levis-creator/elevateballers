/**
 * v2 Standings data source. Gathers each league's current-season table
 * (getStandings, the same computation v1 uses) and combines them into one list
 * tagged with the league — the UI filters by league and ranks within it.
 */
import { getStandings } from "@/features/standings/lib/getStandings";
import type { StandingsData, StandingRow, StandingTable } from "@/features/standings/domain/entities/standings-v2";
import { getPublicCompetitions } from "@/features/seasons/data/public-competitions";
import { getDisplayImageUrl } from "@/lib/asset-url";

const PLAYOFF_SPOTS = 8;

const initialsOf = (name: string) =>
	name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const toRow = (e: any, league: string): StandingRow => ({
	rank: 0,
	teamId: e.teamId,
	name: e.team,
	nickname: e.nickname ?? null,
	initials: initialsOf(e.team),
	logo: getDisplayImageUrl(e.logo),
	href: e.url || "/teams",
	league,
	p: e.played,
	w: e.won,
	d: e.drawn,
	l: e.lost,
	pf: e.goalsFor,
	pa: e.goalsAgainst,
	diff: e.goalDifference,
	pts: e.points,
});

export async function fetchStandingsData(): Promise<StandingsData | null> {
	try {
		const competitions = await getPublicCompetitions();
		if (!competitions.length) return null;

		const tables = (await Promise.all(competitions.flatMap((competition) => {
			const scopes: (string | null)[] = [
				null,
				...competition.conferences.map((conference) => conference.id),
			];
			return scopes.map(async (conferenceId): Promise<StandingTable> => ({
				leagueSeasonId: competition.id,
				conferenceId,
				rows: (await getStandings({
					leagueSeasonId: competition.id,
					...(conferenceId ? { conferenceId } : {}),
				})).map((entry: any) => toRow(entry, competition.leagueLabel)),
			}));
		}))).filter((table) => table.rows.length > 0);

		return {
			competitions,
			tables,
			defaultLeagueSeasonId: tables[0]?.leagueSeasonId ?? competitions[0].id,
			playoffSpots: PLAYOFF_SPOTS,
		};
	} catch {
		return null;
	}
}
