import { create } from "zustand";

/** Active type tab for the v2 Featured Media section. */
interface MediaTabState {
	tab: string;
	setTab: (tab: string) => void;
}

export const useMediaTabStore = create<MediaTabState>((set) => ({
	tab: "All",
	setTab: (tab) => set({ tab }),
}));
