import { describe, expect, it } from "vitest";
import { buildBracket, buildSeries, seriesByGame, winsNeeded } from "../playoff-series";
import type { FixtureMatch, PlayoffStage } from "@/features/fixtures/domain/entities/fixtures-v2";

let seq = 0;
/** Game between team ids h and a; hs/as given → completed. */
function game(stage: PlayoffStage, h: string, a: string, day: number, hs?: number, as?: number, extra: Partial<FixtureMatch> = {}): FixtureMatch {
	const done = hs != null && as != null;
	seq += 1;
	return {
		id: `g${seq}`, href: `/matches/g${seq}`, league: "EBL", season: "2026", seasonId: "s", leagueSeasonId: "ls",
		conferenceIds: [], homeTeamId: h, awayTeamId: a, venue: null, round: stage, stage,
		ts: Date.UTC(2026, 9, day), isoDate: `2026-10-${day}`, day: String(day), mon: "Oct", weekday: "Sunday", year: 2026, time: "10:00 AM",
		status: done ? "done" : "upcoming", home: h.toUpperCase(), away: a.toUpperCase(), homeAbbr: h, awayAbbr: a, homeLogo: null, awayLogo: null,
		score: done ? `${hs} – ${as}` : "", homeScore: done ? hs! : null, awayScore: done ? as! : null,
		homeWin: done && hs! > as!, awayWin: done && as! > hs!, ...extra,
	};
}

describe("winsNeeded", () => {
	it("needs a majority of the games in the tie", () => {
		expect(winsNeeded(1)).toBe(1);
		expect(winsNeeded(3)).toBe(2);
		expect(winsNeeded(5)).toBe(3);
		expect(winsNeeded(7)).toBe(4);
	});
});

describe("playoff format setting", () => {
	it("makes a best-of-5 quarterfinal need 3 wins", () => {
		const [series] = buildSeries([
			game("QF", "a", "b", 1, 80, 70), game("QF", "b", "a", 2, 60, 70),
		], "QF", { QF: 5, SF: 3, F: 1 });
		expect(series.bestOf).toBe(5);
		expect(series.winner).toBeNull();
	});

	it("decides a single-game quarterfinal on that game", () => {
		const [series] = buildSeries([game("QF", "a", "b", 1, 80, 70)], "QF", { QF: 1, SF: 3, F: 1 });
		expect(series.winner?.id).toBe("a");
	});

	it("needs a series win in a best-of-3 final", () => {
		const bracket = buildBracket([game("F", "a", "b", 1, 90, 80)], { QF: 3, SF: 3, F: 3 })!;
		expect(bracket.champion).toBeNull();
	});
});

describe("buildSeries", () => {
	it("groups home-and-away games between the same pair into one series", () => {
		const series = buildSeries([
			game("QF", "jas", "out", 11, 88, 61),
			game("QF", "out", "jas", 18, 70, 75),
			game("QF", "don", "dot", 11, 55, 60),
		], "QF");
		expect(series).toHaveLength(2);
		expect(series[0].games).toHaveLength(2);
		expect(series[0].sides.map((s) => s?.wins)).toEqual([2, 0]);
		expect(series[0].winner?.id).toBe("jas");
	});

	it("keeps a 1–1 series open and points at game 3", () => {
		const g3 = game("QF", "kss", "kar", 25);
		const [series] = buildSeries([game("QF", "kss", "kar", 11, 45, 65), game("QF", "kar", "kss", 18, 60, 70), g3], "QF");
		expect(series.winner).toBeNull();
		expect(series.sides.map((s) => s?.wins)).toEqual([1, 1]);
		expect(series.nextGame?.id).toBe(g3.id);
	});

	it("orders series by bracket position when set", () => {
		const series = buildSeries([
			game("QF", "a", "b", 11, 1, 0, { bracketPosition: 2 }),
			game("QF", "c", "d", 11, 1, 0, { bracketPosition: 1 }),
		], "QF");
		expect(series.map((s) => s.sides[0]?.id)).toEqual(["c", "a"]);
	});
});

describe("buildBracket", () => {
	it("advances series winners into projected semifinal slots", () => {
		const bracket = buildBracket([
			game("QF", "a", "b", 11, 80, 70), game("QF", "b", "a", 18, 60, 70), // a wins 2–0
			game("QF", "c", "d", 11, 80, 70), game("QF", "d", "c", 18, 75, 70), game("QF", "c", "d", 25), // 1–1
			game("QF", "e", "f", 11, 50, 70), game("QF", "f", "e", 18, 80, 70), // f wins 2–0
			game("QF", "g", "h", 11, 90, 70), game("QF", "h", "g", 18, 60, 70), // g wins 2–0
		])!;
		expect(bracket.rounds.map((r) => r.stage)).toEqual(["QF", "SF", "F"]);
		const [sf1, sf2] = bracket.rounds[1].series;
		expect(sf1.projected).toBe(true);
		expect(sf1.sides.map((s) => s?.id ?? null)).toEqual(["a", null]);
		expect(sf2.sides.map((s) => s?.id ?? null)).toEqual(["f", "g"]);
		expect(bracket.rounds[2].series).toHaveLength(1);
		expect(bracket.champion).toBeNull();
	});

	it("puts real semifinal games in the slot their teams advanced to", () => {
		const bracket = buildBracket([
			game("QF", "a", "b", 11, 80, 70), game("QF", "a", "b", 18, 80, 70),
			game("QF", "c", "d", 11, 80, 70), game("QF", "c", "d", 18, 80, 70),
			game("QF", "e", "f", 11, 80, 70), game("QF", "e", "f", 18, 80, 70),
			game("QF", "g", "h", 11, 80, 70), game("QF", "g", "h", 18, 80, 70),
			game("SF", "g", "e", 25),
		])!;
		const [sf1, sf2] = bracket.rounds[1].series;
		expect(sf1.sides.map((s) => s?.id)).toEqual(["a", "c"]);
		expect(sf1.projected).toBe(true);
		expect(sf2.projected).toBe(false);
		expect(sf2.games).toHaveLength(1);
	});

	it("starts at the semifinals for a league with no quarterfinals", () => {
		const bracket = buildBracket([game("SF", "mal", "cba", 1), game("SF", "mas", "dyn", 1)])!;
		expect(bracket.rounds.map((r) => r.stage)).toEqual(["SF", "F"]);
		expect(bracket.rounds[1].series[0].sides).toEqual([null, null]);
	});

	it("crowns the final winner", () => {
		const bracket = buildBracket([game("F", "a", "b", 1, 90, 80)])!;
		expect(bracket.champion?.id).toBe("a");
	});

	it("returns null without knockout games", () => {
		expect(buildBracket([{ ...game("QF", "a", "b", 1), stage: null }])).toBeNull();
	});

	it("numbers games within their series", () => {
		const g1 = game("QF", "a", "b", 11, 1, 0);
		const g2 = game("QF", "b", "a", 18);
		const lookup = seriesByGame(buildBracket([g1, g2])!.rounds);
		expect(lookup.get(g2.id)?.gameNumber).toBe(2);
	});
});
