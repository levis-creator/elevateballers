/**
 * League domain types + rules for the admin board. Pure — no framework, no I/O,
 * so the rules below are unit-testable on their own.
 */

export interface AdminLeague {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	logo: string | null;
	active: boolean;
	registrationOpen: boolean;
	registrationOpensAt: string | null;
	registrationClosesAt: string | null;
	createdAt: string;
	_count: { matches: number; leagueSeasons: number };
	/** Distinct teams; the API only resolves it when asked (`?counts=teams`). */
	teamCount?: number;
}

export type LeagueStatus = "Registering" | "Active" | "Archived";

/**
 * `registrationOpen` is the master switch; the opens/closes timestamps are an
 * optional window on top of it. Registration is only genuinely open when the
 * switch is on AND we are inside the window (an absent bound is unbounded).
 */
export function isRegistrationOpen(league: AdminLeague, now: Date = new Date()): boolean {
	if (!league.active || !league.registrationOpen) return false;

	const opensAt = league.registrationOpensAt ? new Date(league.registrationOpensAt) : null;
	if (opensAt && !Number.isNaN(opensAt.getTime()) && now < opensAt) return false;

	const closesAt = league.registrationClosesAt ? new Date(league.registrationClosesAt) : null;
	if (closesAt && !Number.isNaN(closesAt.getTime()) && now > closesAt) return false;

	return true;
}

export function leagueStatus(league: AdminLeague, now: Date = new Date()): LeagueStatus {
	if (!league.active) return "Archived";
	return isRegistrationOpen(league, now) ? "Registering" : "Active";
}

export type LeagueFilter = "All" | "Active" | "Archived";
export const LEAGUE_FILTERS: LeagueFilter[] = ["All", "Active", "Archived"];

export function matchesFilter(league: AdminLeague, filter: LeagueFilter): boolean {
	if (filter === "Active") return league.active;
	if (filter === "Archived") return !league.active;
	return true;
}

export function matchesSearch(league: AdminLeague, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return `${league.name} ${league.slug} ${league.description ?? ""}`.toLowerCase().includes(q);
}

export interface LeagueStats {
	total: number;
	active: number;
	registering: number;
	matches: number;
}

export function computeStats(leagues: AdminLeague[], now: Date = new Date()): LeagueStats {
	let active = 0;
	let registering = 0;
	let matches = 0;

	for (const league of leagues) {
		if (league.active) active++;
		if (isRegistrationOpen(league, now)) registering++;
		matches += league._count?.matches ?? 0;
	}

	return { total: leagues.length, active, registering, matches };
}
