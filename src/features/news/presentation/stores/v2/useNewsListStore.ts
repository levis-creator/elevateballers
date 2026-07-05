import { create } from "zustand";

/** Client state for the v2 News list: category filter + search + page. */
interface NewsListState {
	cat: string; // "All" = every category
	query: string;
	page: number;
	setCat: (cat: string) => void;
	setQuery: (query: string) => void;
	setPage: (page: number) => void;
}

export const useNewsListStore = create<NewsListState>((set) => ({
	cat: "All",
	query: "",
	page: 1,
	// Changing category or search resets to page 1.
	setCat: (cat) => set({ cat, page: 1 }),
	setQuery: (query) => set({ query, page: 1 }),
	setPage: (page) => set({ page }),
}));
