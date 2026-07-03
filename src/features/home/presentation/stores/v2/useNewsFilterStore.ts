import { create } from "zustand";

/** Active category filter for the v2 Latest News section. */
interface NewsFilterState {
	category: string;
	setCategory: (category: string) => void;
}

export const useNewsFilterStore = create<NewsFilterState>((set) => ({
	category: "All",
	setCategory: (category) => set({ category }),
}));
