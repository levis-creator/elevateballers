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
	conferences: PublicConferenceOption[];
}
