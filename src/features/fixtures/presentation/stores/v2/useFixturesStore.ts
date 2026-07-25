import { create } from "zustand";

export type FixtureView = "upcoming" | "results";

/** Client state for the v2 Fixtures page: season + view + league filters. */
interface FixturesState {
	leagueSeasonId: string;
	seasonId: string;
	conferenceId: string;
	view: FixtureView;
	setLeagueSeason: (leagueSeasonId: string) => void;
	setSeason: (seasonId: string) => void;
	setConference: (conferenceId: string) => void;
	setView: (view: FixtureView) => void;
}

export const useFixturesStore = create<FixturesState>((set) => ({
	leagueSeasonId: "",
	seasonId: "",
	conferenceId: "",
	view: "upcoming",
	setLeagueSeason: (leagueSeasonId) => set({ leagueSeasonId, conferenceId: "" }),
	setSeason: (seasonId) => set({ seasonId, leagueSeasonId: "", conferenceId: "" }),
	setConference: (conferenceId) => set({ conferenceId }),
	setView: (view) => set({ view }),
}));
