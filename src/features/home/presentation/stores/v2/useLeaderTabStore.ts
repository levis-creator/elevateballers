import { create } from "zustand";

/** Active category tab for the v2 League Leaders section. */
interface LeaderTabState {
	tab: string;
	setTab: (tab: string) => void;
}

export const useLeaderTabStore = create<LeaderTabState>((set) => ({
	tab: "Points",
	setTab: (tab) => set({ tab }),
}));
