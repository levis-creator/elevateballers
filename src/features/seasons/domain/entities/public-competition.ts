export interface PublicConferenceOption {
	id: string;
	name: string;
}

export interface PublicCompetitionOption {
	id: string;
	seasonId: string;
	seasonLabel: string;
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
