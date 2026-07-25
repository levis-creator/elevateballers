import type { LeagueSeasonStatus } from "@prisma/client";

export interface FixtureCompetitionWindow {
	startDate: Date | string;
	endDate: Date | string;
	status: LeagueSeasonStatus;
}

export class FixtureScopeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FixtureScopeError";
	}
}

const schedulableStatuses = new Set<LeagueSeasonStatus>([
	"DRAFT",
	"SCHEDULED",
	"ACTIVE",
	"PLAYOFFS",
]);

function dateKey(value: Date | string): string {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** Returns a user-facing error, or null when the fixture may be scheduled. */
export function fixtureSchedulingError(
	competition: FixtureCompetitionWindow,
	fixtureDate: Date | string,
): string | null {
	if (!schedulableStatuses.has(competition.status)) {
		return `Fixtures cannot be scheduled while the competition is ${competition.status.toLowerCase()}.`;
	}
	const fixture = dateKey(fixtureDate);
	const start = dateKey(competition.startDate);
	const end = dateKey(competition.endDate);
	if (!fixture || !start || !end) return "Fixture and competition dates must be valid.";
	if (fixture < start || fixture > end) {
		return `Fixture date must fall between ${start} and ${end}.`;
	}
	return null;
}
