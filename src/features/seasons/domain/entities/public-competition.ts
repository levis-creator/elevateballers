export interface PublicConferenceOption {
	id: string;
	name: string;
}

export interface PublicCompetitionOption {
	id: string;
	seasonId: string;
	seasonLabel: string;
	/** Whether the edition's season is the active one — what public filters open on. */
	seasonActive?: boolean;
	leagueId: string;
	leagueLabel: string;
	leagueCode?: string;
	structure: "SINGLE_TABLE" | "CONFERENCES";
	startDate: string;
	/** Competition lifecycle (REGISTRATION, SCHEDULED, ACTIVE, PLAYOFFS, COMPLETED). */
	status?: string;
	/** Display date range in the league timezone, e.g. "14 Mar – 15 Nov 2026". */
	dateRange?: string;
	conferences: PublicConferenceOption[];
}

/** The first edition of the active season, or undefined when no season is active. */
export function activeCompetition<T extends Pick<PublicCompetitionOption, "seasonActive">>(competitions: readonly T[]): T | undefined {
	return competitions.find((competition) => competition.seasonActive);
}
