/** Domain entities for the v2 Standings page. */
export interface StandingRow {
	rank: number; // assigned per active league filter
	teamId: string;
	name: string;
	nickname?: string | null;
	initials: string;
	logo?: string | null;
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

import type { PublicCompetitionOption } from "@/features/seasons/domain/entities/public-competition";

export interface StandingTable {
	leagueSeasonId: string;
	conferenceId: string | null;
	rows: StandingRow[];
}

export interface StandingsData {
	competitions: PublicCompetitionOption[];
	tables: StandingTable[];
	defaultLeagueSeasonId: string;
	/** Top N teams that qualify for the playoffs (cut-line). */
	playoffSpots: number;
}
