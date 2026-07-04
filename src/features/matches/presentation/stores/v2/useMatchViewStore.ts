import { create } from "zustand";

/** Client state for the v2 match-detail page: box-score team + play-by-play period. */
interface MatchViewState {
	box: "home" | "away";
	period: string; // "" = default to the latest period with events
	setBox: (box: "home" | "away") => void;
	setPeriod: (period: string) => void;
}

export const useMatchViewStore = create<MatchViewState>((set) => ({
	box: "home",
	period: "",
	setBox: (box) => set({ box }),
	setPeriod: (period) => set({ period }),
}));
