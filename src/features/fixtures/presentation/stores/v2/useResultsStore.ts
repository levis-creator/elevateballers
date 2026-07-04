import { create } from "zustand";

/** Client state for the v2 Results page: season + league filters. */
interface ResultsState {
	season: string; // "" = default to the newest season
	league: string; // "all" = every league
	setSeason: (season: string) => void;
	setLeague: (league: string) => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
	season: "",
	league: "all",
	// Changing season resets the league filter — its league list may differ.
	setSeason: (season) => set({ season, league: "all" }),
	setLeague: (league) => set({ league }),
}));
