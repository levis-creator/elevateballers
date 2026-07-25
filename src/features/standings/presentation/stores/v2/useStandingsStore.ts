import { create } from "zustand";

/** Client state for the v2 Standings page: league filter + table search. */
interface StandingsState {
	leagueSeasonId: string;
	conferenceId: string;
	query: string;
	setLeagueSeason: (leagueSeasonId: string) => void;
	setConference: (conferenceId: string) => void;
	setQuery: (query: string) => void;
}

export const useStandingsStore = create<StandingsState>((set) => ({
	leagueSeasonId: "",
	conferenceId: "",
	query: "",
	setLeagueSeason: (leagueSeasonId) => set({ leagueSeasonId, conferenceId: "", query: "" }),
	setConference: (conferenceId) => set({ conferenceId, query: "" }),
	setQuery: (query) => set({ query }),
}));
