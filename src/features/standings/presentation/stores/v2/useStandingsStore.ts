import { create } from "zustand";

/** Client state for the v2 Standings page: league filter + table search. */
interface StandingsState {
	league: string; // "" = default to the first league
	query: string;
	setLeague: (league: string) => void;
	setQuery: (query: string) => void;
}

export const useStandingsStore = create<StandingsState>((set) => ({
	league: "",
	query: "",
	// Switching league clears any active search so the full new table shows.
	setLeague: (league) => set({ league, query: "" }),
	setQuery: (query) => set({ query }),
}));
