/**
 * v2 Player-detail entity. `PlayerView` is a fully display-ready view model —
 * the datasource resolves the player, derives season averages, per-game splits,
 * game log, shooting %, and season highs from real match events, so the page
 * only renders.
 */

export interface BioItem {
	k: string;
	v: string;
}

/** A season-average tile. `accent` → brand colour (else ink). */
export interface AvgTile {
	value: string;
	label: string;
	accent: boolean;
}

export interface SplitRow {
	label: string;
	gp: number;
	pts: string;
	reb: string;
	ast: string;
	stl: string;
	fg: string;
}

export interface GameLogRow {
	/** "vs" (home) or "@" (away). */
	va: string;
	opp: string;
	res: string; // "W" | "L" | "—"
	resWin: boolean;
	pts: number;
	reb: number;
	ast: number;
	tp: number;
	href: string;
}

export interface ShootingBar {
	label: string;
	pct: string;
	/** 0–100 for the bar width. */
	value: number;
	accent: boolean;
}

export interface HighItem {
	label: string;
	value: number;
	opp: string;
}

/** An efficiency ring (FG / 2PT / 3PT / FT). `accent` → brand ring colour. */
export interface EfficiencyRing {
	label: string;
	pct: number; // 0-100
	made: number;
	att: number;
	accent: boolean;
}

/** One slice of the shot diet (share of field-goal attempts by type). */
export interface ShotDietItem {
	label: string;
	att: number;
	share: number; // 0-100
	accent: boolean;
}

/** Coordinate-free shooting breakdown (the data tracks outcomes, not positions). */
export interface ShootingBreakdown {
	fgm: number;
	fga: number;
	fgPct: number;
	rings: EfficiencyRing[];
	efgPct: number;
	pointsFromField: number;
	shotDiet: ShotDietItem[];
	/** true when there is at least one field-goal or free-throw attempt. */
	hasShooting: boolean;
}

export interface PlayerView {
	id: string;
	/** Canonical slug — the route 301s an id URL to this. */
	slug: string | null;
	hero: {
		first: string;
		last: string;
		number: string;
		team: string;
		teamHref: string;
		league: string;
		image: string | null;
		backHref: string;
		backLabel: string;
	};
	bio: BioItem[];
	seasonLabel: string;
	averages: AvgTile[];
	splits: SplitRow[];
	gamelog: GameLogRow[];
	shooting: ShootingBar[];
	highs: HighItem[];
	breakdown: ShootingBreakdown;
	/** true when the player has ≥1 completed game — else the page shows an empty state. */
	hasStats: boolean;
}
