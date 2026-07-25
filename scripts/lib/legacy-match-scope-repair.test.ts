import { describe, expect, it } from "vitest";
import { planLegacyMatchScopeRepair } from "./legacy-match-scope-repair";

const leagueSeasons = [
	{
		id: null,
		seasonId: "s2026",
		leagueId: "men",
		startDate: new Date("2026-01-01"),
		endDate: new Date("2026-12-31"),
	},
];
const participations = [
	{ teamId: "a", seasonId: "s2026", leagueId: "men" },
	{ teamId: "b", seasonId: "s2026", leagueId: "men" },
];

describe("planLegacyMatchScopeRepair", () => {
	it("proposes one season when league, date, and both teams agree", () => {
		const result = planLegacyMatchScopeRepair(
			[
				{
					id: "m1",
					date: new Date("2026-07-01"),
					seasonId: null,
					leagueId: "men",
					leagueSeasonId: null,
					team1Id: "a",
					team2Id: "b",
				},
			],
			leagueSeasons,
			participations,
		);
		expect(result.blockers).toEqual([]);
		expect(result.updates).toEqual([
			{
				matchId: "m1",
				expectedLeagueId: "men",
				seasonId: "s2026",
				leagueSeasonId: null,
			},
		]);
	});

	it("refuses to overwrite a match that already has a season", () => {
		const result = planLegacyMatchScopeRepair(
			[
				{
					id: "m1",
					date: new Date("2026-07-01"),
					seasonId: "existing",
					leagueId: "men",
					leagueSeasonId: null,
					team1Id: "a",
					team2Id: "b",
				},
			],
			leagueSeasons,
			participations,
		);
		expect(result.updates).toEqual([]);
		expect(result.blockers).toHaveLength(1);
	});

	it("refuses inference when either team is not registered", () => {
		const result = planLegacyMatchScopeRepair(
			[
				{
					id: "m1",
					date: new Date("2026-07-01"),
					seasonId: null,
					leagueId: "men",
					leagueSeasonId: null,
					team1Id: "a",
					team2Id: "unknown",
				},
			],
			leagueSeasons,
			participations,
		);
		expect(result.updates).toEqual([]);
		expect(result.blockers[0].candidateCount).toBe(0);
	});
});
