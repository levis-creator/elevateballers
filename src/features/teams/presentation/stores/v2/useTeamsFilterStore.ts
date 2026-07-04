import { create } from "zustand";

/** Client-side directory state for the v2 Teams page (league filter, search, page). */
interface TeamsFilterState {
	league: string;
	query: string;
	page: number;
	setLeague: (league: string) => void;
	setQuery: (query: string) => void;
	setPage: (page: number) => void;
}

export const useTeamsFilterStore = create<TeamsFilterState>((set) => ({
	league: "all",
	query: "",
	page: 1,
	// Changing a filter resets pagination to the first page.
	setLeague: (league) => set({ league, page: 1 }),
	setQuery: (query) => set({ query, page: 1 }),
	setPage: (page) => set({ page }),
}));
