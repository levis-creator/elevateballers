import { create } from "zustand";
import type { StatKey } from "@/features/stats/domain/entities/leaders-v2";
import { ALL_LEAGUES } from "@/features/stats/domain/entities/leaders-v2";

/** Client state for the v2 Stat-Leaders page: stat category + league + season.
 *  `season === ""` means "use the data's default season". */
interface LeadersState {
	stat: StatKey;
	league: string;
	season: string;
	setStat: (stat: StatKey) => void;
	setLeague: (league: string) => void;
	setSeason: (season: string) => void;
}

export const useLeadersStore = create<LeadersState>((set) => ({
	stat: "Points",
	league: ALL_LEAGUES,
	season: "",
	setStat: (stat) => set({ stat }),
	setLeague: (league) => set({ league }),
	setSeason: (season) => set({ season }),
}));
