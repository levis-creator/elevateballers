import { create } from "zustand";

export type FixtureView = "upcoming" | "results";

/** Client state for the v2 Fixtures page: season + view + league filters. */
interface FixturesState {
	season: string; // "" = default to the newest season
	view: FixtureView;
	league: string; // "all" = every league
	setSeason: (season: string) => void;
	setView: (view: FixtureView) => void;
	setLeague: (league: string) => void;
}

export const useFixturesStore = create<FixturesState>((set) => ({
	season: "",
	view: "upcoming",
	league: "all",
	// Changing season resets the league filter — its league list may differ.
	setSeason: (season) => set({ season, league: "all" }),
	setView: (view) => set({ view }),
	setLeague: (league) => set({ league }),
}));
