/**
 * Playoff series for the public bracket. Each round's tie length comes from
 * the Fixtures "Playoff format" setting (e.g. best of 3: the same two teams
 * meet up to three times and the first to two wins advances). Series winners are projected into the next round's slots
 * before those games are scheduled, so the bracket fills itself in.
 */
import type { FixtureMatch, PlayoffStage } from "@/features/fixtures/domain/entities/fixtures-v2";
import type { PlayoffFormat } from "@/features/settings/application/fixturesSettings";

export interface SeriesSide {
	id: string;
	name: string;
	logo: string | null;
	abbr: string;
	wins: number;
}

export interface Series {
	key: string;
	stage: PlayoffStage;
	/** [first-listed team, opponent]; null = not decided yet (TBD). */
	sides: [SeriesSide | null, SeriesSide | null];
	/** Games in the series, oldest first. */
	games: FixtureMatch[];
	/** Games in the tie (1 = single game, 3 = best of 3, …). */
	bestOf: number;
	winsNeeded: number;
	winner: SeriesSide | null;
	/** Live game, else the next scheduled one. */
	nextGame: FixtureMatch | null;
	/** True when built from previous-round winners rather than real games. */
	projected: boolean;
}

export interface BracketRound {
	stage: PlayoffStage;
	series: Series[];
}

/** Knockout rounds in order; the first round drawn is the earliest one with games. */
const MAIN_ROUNDS: PlayoffStage[] = ["QF", "SF", "F"];
const MIN_SLOTS: Record<PlayoffStage, number> = { PO: 0, QF: 4, SF: 2, F: 1 };

export const DEFAULT_PLAYOFF_FORMAT: PlayoffFormat = { QF: 3, SF: 3, F: 1 };

/** Games per tie for a round; legacy generic playoff games are single games. */
export const bestOfFor = (stage: PlayoffStage, format: PlayoffFormat) => (stage === "PO" ? 1 : format[stage]);

/** Wins that decide a tie: a majority of its games (best of 3 → 2, of 5 → 3). */
export const winsNeeded = (bestOf: number) => Math.floor(bestOf / 2) + 1;

const homeKey = (m: FixtureMatch) => m.homeTeamId ?? `name:${m.home}`;
const awayKey = (m: FixtureMatch) => m.awayTeamId ?? `name:${m.away}`;

/** Groups one round's games into series by the pair of teams playing. */
export function buildSeries(games: FixtureMatch[], stage: PlayoffStage, format: PlayoffFormat = DEFAULT_PLAYOFF_FORMAT): Series[] {
	const bestOf = bestOfFor(stage, format);
	const groups = new Map<string, FixtureMatch[]>();
	for (const m of [...games].sort((a, b) => a.ts - b.ts)) {
		const key = [homeKey(m), awayKey(m)].sort().join("|");
		const list = groups.get(key) ?? [];
		list.push(m);
		groups.set(key, list);
	}

	const order = (ms: FixtureMatch[]) => {
		const positions = ms.map((m) => m.bracketPosition).filter((p): p is number => p != null);
		return positions.length ? Math.min(...positions) : Number.MAX_SAFE_INTEGER;
	};

	return [...groups.entries()]
		.sort(([, a], [, b]) => order(a) - order(b) || a[0].ts - b[0].ts)
		.map(([key, ms]) => {
			const first = ms[0];
			const a: SeriesSide = { id: homeKey(first), name: first.home, logo: first.homeLogo, abbr: first.homeAbbr, wins: 0 };
			const b: SeriesSide = { id: awayKey(first), name: first.away, logo: first.awayLogo, abbr: first.awayAbbr, wins: 0 };
			for (const m of ms) {
				if (m.status !== "done") continue;
				const winnerKey = m.homeWin ? homeKey(m) : m.awayWin ? awayKey(m) : null;
				if (winnerKey === a.id) a.wins += 1;
				else if (winnerKey === b.id) b.wins += 1;
			}
			const needed = winsNeeded(bestOf);
			const winner = a.wins >= needed ? a : b.wins >= needed ? b : null;
			const nextGame = winner ? null : ms.find((m) => m.status === "live") ?? ms.find((m) => m.status === "upcoming") ?? null;
			return { key, stage, sides: [a, b], games: ms, bestOf, winsNeeded: needed, winner, nextGame, projected: false };
		});
}

const advancing = (s: Series | undefined): SeriesSide | null =>
	s?.winner ? { ...s.winner, wins: 0 } : null;

/** Slots for a round: real series sit where their teams were projected to go;
 *  remaining slots are filled with the previous round's (pending) winners. */
function placeRound(stage: PlayoffStage, real: Series[], previous: Series[] | null, format: PlayoffFormat): Series[] {
	const bestOf = bestOfFor(stage, format);
	const empty = { games: [], bestOf, winsNeeded: winsNeeded(bestOf), winner: null, nextGame: null, projected: true };
	const slots = Math.max(real.length, previous ? Math.ceil(previous.length / 2) : MIN_SLOTS[stage]);
	const unplaced = [...real];
	const placed: (Series | null)[] = [];

	for (let i = 0; i < slots; i += 1) {
		const pair: [SeriesSide | null, SeriesSide | null] = previous
			? [advancing(previous[2 * i]), advancing(previous[2 * i + 1])]
			: [null, null];
		const known = pair.filter((side): side is SeriesSide => Boolean(side)).map((side) => side.id);
		const matchIndex = known.length
			? unplaced.findIndex((s) => s.sides.some((side) => side && known.includes(side.id)))
			: -1;
		if (matchIndex !== -1) {
			placed.push(unplaced.splice(matchIndex, 1)[0]);
		} else if (known.length) {
			placed.push({ key: `${stage}-projected-${i}`, stage, sides: pair, ...empty });
		} else {
			placed.push(null);
		}
	}

	// Real series that didn't line up with a projection take the open slots.
	const open = (i: number): Series => ({ key: `${stage}-open-${i}`, stage, sides: [null, null], ...empty });
	const filled = placed.map((slot, i) => slot ?? unplaced.shift() ?? open(i));
	return filled.concat(unplaced);
}

/** Bracket for one competition, or null when it has no knockout games. Starts
 *  at the earliest round with games (a league entering at the semifinals
 *  shows Semifinals → Final) and always runs through to the Final. */
export function buildBracket(games: FixtureMatch[], format: PlayoffFormat = DEFAULT_PLAYOFF_FORMAT): { rounds: BracketRound[]; champion: SeriesSide | null } | null {
	const knockout = games.filter((m) => m.stage);
	if (!knockout.length) return null;

	const rounds: BracketRound[] = [];
	const legacy = knockout.filter((m) => m.stage === "PO");
	if (legacy.length) rounds.push({ stage: "PO", series: buildSeries(legacy, "PO", format) });

	const firstIndex = MAIN_ROUNDS.findIndex((stage) => knockout.some((m) => m.stage === stage));
	let previous: Series[] | null = null;
	for (const stage of MAIN_ROUNDS.slice(firstIndex === -1 ? 0 : firstIndex)) {
		const series = placeRound(stage, buildSeries(knockout.filter((m) => m.stage === stage), stage, format), previous, format);
		rounds.push({ stage, series });
		previous = series;
	}

	const final = rounds[rounds.length - 1]?.series[0];
	return { rounds, champion: final?.stage === "F" ? final.winner : null };
}

/** Series lookup by game id, for labelling individual playoff game cards. */
export function seriesByGame(rounds: BracketRound[]): Map<string, { series: Series; gameNumber: number }> {
	const out = new Map<string, { series: Series; gameNumber: number }>();
	for (const round of rounds) {
		for (const series of round.series) {
			series.games.forEach((game, index) => out.set(game.id, { series, gameNumber: index + 1 }));
		}
	}
	return out;
}
