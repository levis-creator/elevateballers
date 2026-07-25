import { create } from "zustand";

export type FixtureView = "upcoming" | "results";

/** Client state for the v2 Fixtures page: season + view + league filters. */
interface FixturesState {
	leagueSeasonId: string;
	conferenceId: string;
	view: FixtureView;
	setLeagueSeason: (leagueSeasonId: string) => void;
	setConference: (conferenceId: string) => void;
	setView: (view: FixtureView) => void;
}

export const useFixturesStore = create<FixturesState>((set) => ({
	leagueSeasonId: "",
	conferenceId: "",
	view: "upcoming",
	setLeagueSeason: (leagueSeasonId) => set({ leagueSeasonId, conferenceId: "" }),
	setConference: (conferenceId) => set({ conferenceId }),
	setView: (view) => set({ view }),
}));
