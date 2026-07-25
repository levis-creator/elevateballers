import { create } from "zustand";

/** Client state for the v2 Results page: season + league filters. */
interface ResultsState {
	season: string;
	league: string;
	leagueSeasonId: string;
	conferenceId: string;
	setSeason: (season: string) => void;
	setLeague: (league: string) => void;
	setLeagueSeason: (leagueSeasonId: string) => void;
	setConference: (conferenceId: string) => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
	season: "",
	league: "all",
	leagueSeasonId: "",
	conferenceId: "",
	setLeagueSeason: (leagueSeasonId) => set({ leagueSeasonId, conferenceId: "" }),
	setConference: (conferenceId) => set({ conferenceId }),
	setSeason: (season) => set({ season, league: "all" }),
	setLeague: (league) => set({ league }),
}));
