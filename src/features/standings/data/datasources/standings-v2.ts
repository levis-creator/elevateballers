/**
 * v2 Standings data source. Gathers each league's current-season table
 * (getStandings, the same computation v1 uses) and combines them into one list
 * tagged with the league — the UI filters by league and ranks within it.
 */
import { getLeagues, getSeasons } from "@/features/cms/lib/queries";
import { getStandings } from "@/features/standings/lib/getStandings";
import type { StandingsData, StandingRow } from "@/features/standings/domain/entities/standings-v2";

const PLAYOFF_SPOTS = 8;

const initialsOf = (name: string) =>
	name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const toRow = (e: any, league: string): StandingRow => ({
	rank: 0,
	teamId: e.teamId,
	name: e.team,
	initials: initialsOf(e.team),
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
		const leagues = await getLeagues();

		const perLeague: { name: string; rows: StandingRow[] }[] = [];
		let seasonLabel = "";
		await Promise.all(
			leagues.map(async (lg: any) => {
				const seasons = await getSeasons(false, lg.id); // startDate desc
				if (!seasons.length) return;
				const season = seasons.find((s: any) => s.active) ?? seasons[0];
				// getStandings returns every approved team (played=0 for non-participants);
				// keep only teams that actually played that league-season.
				const rows = (await getStandings({ leagueId: lg.id, seasonId: season.id }))
					.filter((e: any) => e.played > 0)
					.map((e: any) => toRow(e, lg.name));
				if (rows.length) {
					perLeague.push({ name: lg.name, rows });
					seasonLabel = season.name;
				}
			}),
		);

		if (!perLeague.length) return null;

		// Largest league first, then flatten into one combined list.
		perLeague.sort((a, b) => b.rows.length - a.rows.length);
		const rows = perLeague.flatMap((g) => g.rows);
		const leagueNames = perLeague.map((g) => g.name);

		return { rows, leagues: leagueNames, seasonLabel, playoffSpots: PLAYOFF_SPOTS };
	} catch {
		return null;
	}
}
