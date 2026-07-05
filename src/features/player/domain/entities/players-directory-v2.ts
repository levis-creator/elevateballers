/**
 * v2 Players-directory entities. A `PlayerCard` is a display-ready roster tile;
 * the island filters by search / team / position, sorts and paginates purely
 * from this list, so no stat logic lives on the client.
 */

/** Coarse position bucket used by the position tabs. `?` = unspecified. */
export type PosCode = "G" | "F" | "C" | "?";

export interface PlayerCard {
	id: string;
	name: string;
	team: string;
	/** For the position-tab filter. */
	posCode: PosCode;
	/** Display label, e.g. "Point Guard" or "—". */
	posLabel: string;
	/** Jersey number, or "—". */
	number: string;
	initials: string;
	/** Player detail link (`/players/{slug|id}`). */
	href: string;
	/** Resolved photo URL, or null → render the striped-initials placeholder. */
	image: string | null;
	ppg: number;
	rpg: number;
	apg: number;
}

export interface PlayersDirectoryData {
	players: PlayerCard[];
	/** `["All Teams", ...team names sorted]`. */
	teams: string[];
	/** Registered player count (before filtering). */
	total: number;
}
