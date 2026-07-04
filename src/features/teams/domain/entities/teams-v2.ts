/**
 * Domain entities for the v2 Teams directory.
 * View-oriented shapes; the data layer maps Prisma DTOs into these.
 */
export interface TeamCard {
	id: string;
	slug: string;
	name: string;
	initials: string;
	/** Resolved logo URL, or null → render the initials crest. */
	logo: string | null;
	/** League display name, or "Unaffiliated". */
	league: string;
	/** Hex colour assigned to the league (stable per league). */
	leagueColor: string;
	/** Head coach name, or "—" when unknown. */
	coach: string;
	players: number;
	href: string;
}

export interface LeagueTab {
	label: string;
	/** "all" or a league name. */
	value: string;
}

export interface TeamsData {
	teams: TeamCard[];
	leagues: LeagueTab[];
	totalCount: number;
	leagueCount: number;
}
