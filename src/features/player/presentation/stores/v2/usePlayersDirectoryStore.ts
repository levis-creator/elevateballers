import { create } from "zustand";
import type { PosCode } from "@/features/player/domain/entities/players-directory-v2";

export type PlayerSort = "ppg" | "rpg" | "apg" | "name";
/** "All" = every position; otherwise a `PosCode`. */
export type PosFilter = "All" | PosCode;

/** Client state for the v2 Players directory: search + team + position + sort + page. */
interface PlayersDirectoryState {
	q: string;
	team: string; // "All Teams" = every team
	pos: PosFilter;
	sort: PlayerSort;
	page: number;
	setQ: (q: string) => void;
	setTeam: (team: string) => void;
	setPos: (pos: PosFilter) => void;
	setSort: (sort: PlayerSort) => void;
	setPage: (page: number) => void;
}

export const usePlayersDirectoryStore = create<PlayersDirectoryState>((set) => ({
	q: "",
	team: "All Teams",
	pos: "All",
	sort: "ppg",
	page: 1,
	// Any filter/sort change resets to page 1.
	setQ: (q) => set({ q, page: 1 }),
	setTeam: (team) => set({ team, page: 1 }),
	setPos: (pos) => set({ pos, page: 1 }),
	setSort: (sort) => set({ sort, page: 1 }),
	setPage: (page) => set({ page }),
}));
