/** Domain entities for the v2 Standings page. */
export interface StandingRow {
	rank: number; // assigned per active league filter
	teamId: string;
	name: string;
	initials: string;
	href: string;
	league: string; // league name (used for the filter)
	p: number; // played
	w: number; // won
	d: number; // drawn
	l: number; // lost
	pf: number; // points for
	pa: number; // points against
	diff: number; // differential
	pts: number; // table points
}

export interface StandingsData {
	/** All teams across every league for the current season (unranked here — the
	 *  island ranks within the active league filter). */
	rows: StandingRow[];
	/** League names, for the filter tabs. */
	leagues: string[];
	/** Season name shown in the hero (e.g. "2026 Season"). */
	seasonLabel: string;
	/** Top N teams that qualify for the playoffs (cut-line). */
	playoffSpots: number;
}
