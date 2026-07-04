import { create } from "zustand";

/** Client state for the single-team page: squad tab, recent-match season + page. */
interface TeamViewState {
	tab: "roster" | "stats";
	season: string; // "all" or a season name
	recentPage: number;
	setTab: (tab: "roster" | "stats") => void;
	setSeason: (season: string) => void;
	setRecentPage: (page: number) => void;
}

export const useTeamViewStore = create<TeamViewState>((set) => ({
	tab: "roster",
	// "" = no explicit choice yet → the component defaults to the current season.
	season: "",
	recentPage: 1,
	setTab: (tab) => set({ tab }),
	setSeason: (season) => set({ season, recentPage: 1 }),
	setRecentPage: (recentPage) => set({ recentPage }),
}));
