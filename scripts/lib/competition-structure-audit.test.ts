import { describe, expect, it } from "vitest";
import {
	auditCompetitionStructure,
	type CompetitionAuditSnapshot,
} from "./competition-structure-audit";

const valid: CompetitionAuditSnapshot = {
	leagues: [
		{ id: "men", name: "Men's League" },
		{ id: "women", name: "Women's League" },
	],
	seasons: [{ id: "s1", name: "2026", leagueIds: ["men", "women"] }],
	conferences: [{ id: "c1", name: "East", seasonId: "s1" }],
	participations: [
		{
			id: "p1",
			seasonId: "s1",
			leagueId: "men",
			teamId: "t1",
			teamName: "Team One",
			conferenceId: "c1",
		},
	],
	matches: [
		{
			id: "m1",
			slug: "one-v-two",
			seasonId: "s1",
			leagueId: "men",
			team1Id: "t1",
			team2Id: null,
		},
	],
};

describe("auditCompetitionStructure", () => {
	it("accepts a resolvable two-league snapshot", () => {
		const report = auditCompetitionStructure(valid, new Date("2026-07-25T00:00:00Z"));
		expect(report.counts.blockers).toBe(0);
		expect(report.officialLeagues.men?.id).toBe("men");
		expect(report.officialLeagues.women?.id).toBe("women");
	});

	it("flags an empty conference in a two-league season as ambiguous", () => {
		const report = auditCompetitionStructure({
			...valid,
			participations: [],
			matches: [],
		});
		expect(report.findings).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: "CONFERENCE_LEAGUE_AMBIGUOUS", severity: "BLOCKER" }),
			]),
		);
	});

	it("flags a conference whose teams come from both leagues", () => {
		const report = auditCompetitionStructure({
			...valid,
			participations: [
				...valid.participations,
				{
					id: "p2",
					seasonId: "s1",
					leagueId: "women",
					teamId: "t2",
					teamName: "Team Two",
					conferenceId: "c1",
				},
			],
			matches: [],
		});
		expect(report.findings.some((item) => item.code === "CONFERENCE_MIXED_LEAGUES")).toBe(true);
	});

	it("flags matches missing scope or using an unregistered team", () => {
		const report = auditCompetitionStructure({
			...valid,
			matches: [
				{ ...valid.matches[0], seasonId: null },
				{ ...valid.matches[0], id: "m2", team1Id: "unknown" },
			],
		});
		expect(report.findings.some((item) => item.code === "MATCH_MISSING_SCOPE")).toBe(true);
		expect(report.findings.some((item) => item.code === "MATCH_TEAM_NOT_REGISTERED")).toBe(true);
	});
});
