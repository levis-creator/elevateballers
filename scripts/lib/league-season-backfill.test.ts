import { describe, expect, it } from "vitest";
import {
	planLeagueSeasonBackfill,
	type LeagueSeasonBackfillSnapshot,
} from "./league-season-backfill";

const snapshot: LeagueSeasonBackfillSnapshot = {
	leagueSeasons: [
		{
			id: null,
			leagueId: "men",
			seasonId: "2026",
			season: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-06-01"),
				registrationOpensAt: null,
				registrationClosesAt: null,
				bracketType: "single",
				active: true,
			},
		},
	],
	conferences: [
		{
			id: "east",
			name: "East",
			seasonId: "2026",
			leagueSeasonId: null,
			memberLeagueIds: [],
		},
	],
	seasonTeams: [
		{ id: "st1", seasonId: "2026", leagueId: "men", leagueSeasonId: null },
	],
	matches: [{ id: "m1", seasonId: "2026", leagueId: "men", leagueSeasonId: null }],
};

describe("planLeagueSeasonBackfill", () => {
	it("backfills inherited settings and all unambiguous child links", () => {
		const plan = planLeagueSeasonBackfill(snapshot, () => "ls1");
		expect(plan.blockers).toEqual([]);
		expect(plan.leagueSeasons[0]).toMatchObject({
			id: "ls1",
			status: "ACTIVE",
			competitionStructure: "CONFERENCES",
			bracketType: "single",
		});
		expect(plan.conferences).toEqual([{ id: "east", leagueSeasonId: "ls1" }]);
		expect(plan.seasonTeams).toEqual([{ id: "st1", leagueSeasonId: "ls1" }]);
		expect(plan.matches).toEqual([{ id: "m1", leagueSeasonId: "ls1" }]);
	});

	it("preserves an existing league-season id on repeat runs", () => {
		const plan = planLeagueSeasonBackfill(
			{
				...snapshot,
				leagueSeasons: [{ ...snapshot.leagueSeasons[0], id: "existing" }],
			},
			() => "new",
		);
		expect(plan.leagueSeasons[0].id).toBe("existing");
	});

	it("blocks an empty conference in a season with two leagues", () => {
		const plan = planLeagueSeasonBackfill(
			{
				...snapshot,
				leagueSeasons: [
					...snapshot.leagueSeasons,
					{ ...snapshot.leagueSeasons[0], leagueId: "women" },
				],
			},
			(_season, league) => `ls-${league}`,
		);
		expect(plan.blockers.some((item) => item.code === "CONFERENCE_LEAGUE_AMBIGUOUS")).toBe(true);
	});

	it("blocks existing links that disagree with the legacy pair", () => {
		const plan = planLeagueSeasonBackfill(
			{
				...snapshot,
				matches: [{ ...snapshot.matches[0], leagueSeasonId: "wrong" }],
			},
			() => "ls1",
		);
		expect(plan.blockers.some((item) => item.code === "MATCH_LINK_CONFLICT")).toBe(true);
	});

	it("blocks scoped children whose league-season pair does not exist", () => {
		const plan = planLeagueSeasonBackfill(
			{
				...snapshot,
				matches: [{ ...snapshot.matches[0], leagueId: "women" }],
			},
			() => "ls1",
		);
		expect(plan.blockers.some((item) => item.code === "MATCH_PAIR_MISSING")).toBe(true);
	});
});
