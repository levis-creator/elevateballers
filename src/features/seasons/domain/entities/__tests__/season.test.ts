import { describe, it, expect } from 'vitest';
import {
	type AdminSeason,
	assertSingleActiveSeason,
	SEASON_FILTERS,
	computeStats,
	countByFilter,
	formatRange,
	matchesFilter,
	matchesSearch,
	seasonProgress,
	seasonStage,
	decidedSeriesLeftovers,
	seriesAwareProgress,
	type KnockoutGame,
	seasonStatus,
} from '../season';

const NOW = new Date('2026-07-12T12:00:00Z');

describe('assertSingleActiveSeason', () => {
	it('allows activation when no other season is active', () => {
		expect(() => assertSingleActiveSeason(0, true)).not.toThrow();
	});

	it('rejects activation when another season is active', () => {
		expect(() => assertSingleActiveSeason(1, true)).toThrow(/Only one active season is allowed/);
	});

	it('allows completing a season even when another active season exists', () => {
		expect(() => assertSingleActiveSeason(1, false)).not.toThrow();
	});
});

function season(overrides: Partial<AdminSeason> = {}): AdminSeason {
	return {
		id: 's1',
		name: '2026 Season',
		slug: '2026-season',
		description: '2026 basketball season for Ballers League',
		startDate: '2026-01-01T00:00:00Z',
		endDate: '2026-12-31T00:00:00Z',
		active: true,
		bracketType: null,
		leagues: [{ id: 'l1', name: 'Ballers League' }],
		matches: 20,
		completed: 5,
		...overrides,
	};
}

describe('seasonStatus', () => {
	it('is Upcoming before the season starts', () => {
		expect(seasonStatus(season({ startDate: '2026-09-01T00:00:00Z' }), NOW)).toBe('Upcoming');
	});

	it('is Completed after the season ends', () => {
		expect(seasonStatus(season({ endDate: '2026-05-01T00:00:00Z' }), NOW)).toBe('Completed');
	});

	it('is Live inside the window when the season is active', () => {
		expect(seasonStatus(season(), NOW)).toBe('Live');
	});

	it('is Completed inside the window once marked completed (active = false)', () => {
		expect(seasonStatus(season({ active: false }), NOW)).toBe('Completed');
	});

	it('ignores an unparseable bound rather than trusting it', () => {
		// A junk start date must not make an in-window season read as Upcoming.
		expect(seasonStatus(season({ startDate: 'not-a-date' }), NOW)).toBe('Live');
		expect(seasonStatus(season({ endDate: 'not-a-date' }), NOW)).toBe('Live');
	});
});

describe('seasonProgress', () => {
	it('is the played share, rounded', () => {
		expect(seasonProgress({ matches: 20, completed: 5 })).toBe(25);
		expect(seasonProgress({ matches: 3, completed: 1 })).toBe(33);
	});

	it('is 0 — not NaN — for a season with no fixtures', () => {
		expect(seasonProgress({ matches: 0, completed: 0 })).toBe(0);
	});

	it('is 100 when every match is played', () => {
		expect(seasonProgress({ matches: 12, completed: 12 })).toBe(100);
	});
});

describe('matchesFilter', () => {
	it('All keeps everything', () => {
		expect(matchesFilter(season({ active: false }), 'All', NOW)).toBe(true);
	});

	it('narrows to the matching status', () => {
		const live = season();
		const upcoming = season({ startDate: '2026-09-01T00:00:00Z' });

		expect(matchesFilter(live, 'Live', NOW)).toBe(true);
		expect(matchesFilter(live, 'Upcoming', NOW)).toBe(false);
		expect(matchesFilter(upcoming, 'Upcoming', NOW)).toBe(true);
		expect(matchesFilter(upcoming, 'Live', NOW)).toBe(false);
	});
});

describe('matchesSearch', () => {
	it('matches the season name, case-insensitively', () => {
		expect(matchesSearch(season(), 'SEASON')).toBe(true);
	});

	it('matches a league name — the mockup searches "seasons or leagues"', () => {
		expect(matchesSearch(season(), 'ballers')).toBe(true);
		expect(matchesSearch(season({ leagues: [{ id: 'l2', name: "Women's League" }] }), 'women')).toBe(true);
	});

	it('matches the description', () => {
		expect(matchesSearch(season(), 'basketball')).toBe(true);
	});

	it('an empty query keeps everything', () => {
		expect(matchesSearch(season(), '   ')).toBe(true);
	});

	it('rejects a genuine miss', () => {
		expect(matchesSearch(season(), 'hockey')).toBe(false);
	});

	it('does not blow up on a season with no leagues or description', () => {
		expect(matchesSearch(season({ leagues: [], description: null }), 'hockey')).toBe(false);
	});
});

describe('computeStats', () => {
	it('counts live and upcoming by derived status, and sums every match', () => {
		const seasons = [
			season({ id: 'a', matches: 17 }), // live
			season({ id: 'b', matches: 13 }), // live
			season({ id: 'c', startDate: '2026-09-01T00:00:00Z', endDate: '2026-10-01T00:00:00Z', matches: 0 }), // upcoming
			season({ id: 'd', endDate: '2026-05-01T00:00:00Z', matches: 22 }), // completed
		];

		expect(computeStats(seasons, NOW)).toEqual({ total: 4, live: 2, upcoming: 1, matches: 52 });
	});

	it('returns zeroes for no seasons', () => {
		expect(computeStats([], NOW)).toEqual({ total: 0, live: 0, upcoming: 0, matches: 0 });
	});
});

describe('countByFilter', () => {
	it('counts each status, with All as the total', () => {
		const seasons = [
			season({ id: 'a' }),
			season({ id: 'b', startDate: '2026-09-01T00:00:00Z', endDate: '2026-10-01T00:00:00Z' }),
			season({ id: 'c', endDate: '2026-05-01T00:00:00Z' }),
			season({ id: 'd', active: false }),
		];

		expect(countByFilter(seasons, NOW)).toEqual({ All: 4, Live: 1, Upcoming: 1, Completed: 2 });
	});

	it('has a key for every filter, so no tab renders a blank count', () => {
		const counts = countByFilter([], NOW);
		for (const filter of SEASON_FILTERS) expect(counts[filter]).toBe(0);
	});
});

describe('formatRange', () => {
	it('formats both bounds', () => {
		expect(formatRange('2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z')).toBe('Jan 1, 2026 – Dec 31, 2026');
	});

	it('shows an em dash for an unparseable bound instead of "Invalid Date"', () => {
		expect(formatRange('nope', '2026-12-31T00:00:00Z')).toBe('— – Dec 31, 2026');
	});
});

describe('seasonStage', () => {
	const t = (stage: string | null, status: string, count: number) => ({ stage, status, count });

	it('has no stage without matches', () => {
		expect(seasonStage([])).toBeNull();
		expect(seasonStage([t('REGULAR_SEASON', 'UPCOMING', 0)])).toBeNull();
	});

	it('stays in the regular season while any regular game is unplayed', () => {
		expect(seasonStage([t('REGULAR_SEASON', 'COMPLETED', 20), t(null, 'UPCOMING', 1)])).toBe('Regular season');
		// A bracket generated early does not skip the remaining regular games.
		expect(
			seasonStage([t('REGULAR_SEASON', 'LIVE', 1), t('QUARTER_FINALS', 'UPCOMING', 4)])
		).toBe('Regular season');
	});

	it('reports the regular season complete before a bracket exists', () => {
		expect(seasonStage([t('REGULAR_SEASON', 'COMPLETED', 30)])).toBe('Regular season complete');
	});

	it('follows the earliest knockout round with games left', () => {
		const bracket = (qf: string, sf: string, final: string) => [
			t('REGULAR_SEASON', 'COMPLETED', 30),
			t('QUARTER_FINALS', qf, 4),
			t('SEMI_FINALS', sf, 2),
			t('CHAMPIONSHIP', final, 1),
		];
		expect(seasonStage(bracket('UPCOMING', 'UPCOMING', 'UPCOMING'))).toBe('Quarterfinals');
		expect(seasonStage(bracket('COMPLETED', 'UPCOMING', 'UPCOMING'))).toBe('Semifinals');
		expect(seasonStage(bracket('COMPLETED', 'COMPLETED', 'LIVE'))).toBe('Final');
		expect(seasonStage(bracket('COMPLETED', 'COMPLETED', 'COMPLETED'))).toBe('Season complete');
	});

	it('names an opening round before the quarterfinals as Playoffs', () => {
		expect(seasonStage([t('PLAYOFF', 'UPCOMING', 8), t('QUARTER_FINALS', 'UPCOMING', 4)])).toBe('Playoffs');
	});

	it('ignores exhibition and preseason games', () => {
		expect(
			seasonStage([t('SEMI_FINALS', 'UPCOMING', 2), t('EXHIBITION', 'UPCOMING', 1), t('PRESEASON', 'UPCOMING', 1)])
		).toBe('Semifinals');
		expect(seasonStage([t('EXHIBITION', 'COMPLETED', 2)])).toBeNull();
	});
});

describe('series-aware progress', () => {
	const format = { QF: 3, SF: 3, F: 1 };
	const game = (stage: string, status: string, a: string | null, b: string | null, winner: string | null = null): KnockoutGame => ({
		stage,
		status,
		team1Id: a,
		team2Id: b,
		team1Score: null,
		team2Score: null,
		winnerId: winner,
	});
	// Two quarterfinal series scheduled as full best-of-3s.
	const quarterfinals = (thirdA: string, thirdB: string) => [
		game('QUARTER_FINALS', 'COMPLETED', 'a', 'b', 'a'),
		game('QUARTER_FINALS', 'COMPLETED', 'b', 'a', 'a'),
		game('QUARTER_FINALS', thirdA, 'a', 'b'),
		game('QUARTER_FINALS', 'COMPLETED', 'c', 'd', 'c'),
		game('QUARTER_FINALS', 'COMPLETED', 'd', 'c', 'd'),
		game('QUARTER_FINALS', thirdB, 'c', 'd'),
	];

	it('drops the unplayed game of a series already won 2–0', () => {
		expect(decidedSeriesLeftovers(quarterfinals('UPCOMING', 'UPCOMING'), format)).toEqual([
			{ stage: 'QUARTER_FINALS', status: 'UPCOMING', count: 1 },
		]);
	});

	it('keeps the round open while a series is level, then moves on once all are decided', () => {
		const tallies = [
			{ stage: 'REGULAR_SEASON', status: 'COMPLETED', count: 20 },
			{ stage: 'QUARTER_FINALS', status: 'COMPLETED', count: 4 },
			{ stage: 'QUARTER_FINALS', status: 'UPCOMING', count: 2 },
			{ stage: 'SEMI_FINALS', status: 'UPCOMING', count: 3 },
		];
		expect(seriesAwareProgress(tallies, quarterfinals('UPCOMING', 'UPCOMING'), format)).toEqual({
			matches: 28,
			completed: 24,
			stage: 'Quarterfinals',
		});

		const decided = [
			...tallies.slice(0, 1),
			{ stage: 'QUARTER_FINALS', status: 'COMPLETED', count: 5 },
			{ stage: 'QUARTER_FINALS', status: 'UPCOMING', count: 1 },
			tallies[3],
		];
		const games = quarterfinals('UPCOMING', 'COMPLETED');
		games[5] = { ...games[5], status: 'COMPLETED', team1Score: 70, team2Score: 64 };
		expect(seriesAwareProgress(decided, games, format)).toEqual({
			matches: 28,
			completed: 25,
			stage: 'Semifinals',
		});
	});

	it('reaches 100% when the only unplayed games are surplus series games', () => {
		const tallies = [
			{ stage: 'QUARTER_FINALS', status: 'COMPLETED', count: 2 },
			{ stage: 'QUARTER_FINALS', status: 'UPCOMING', count: 1 },
		];
		const games = quarterfinals('UPCOMING', 'UPCOMING').slice(0, 3);
		expect(seriesAwareProgress(tallies, games, format)).toEqual({
			matches: 2,
			completed: 2,
			stage: 'Season complete',
		});
	});

	it('never treats games with a TBD team as a decided series', () => {
		const games = [
			game('SEMI_FINALS', 'COMPLETED', 'a', null, 'a'),
			game('SEMI_FINALS', 'COMPLETED', 'a', null, 'a'),
			game('SEMI_FINALS', 'UPCOMING', 'a', null),
		];
		expect(decidedSeriesLeftovers(games, format)).toEqual([]);
	});

	it('uses the configured length: a single-game final is decided by one win', () => {
		const games = [game('CHAMPIONSHIP', 'COMPLETED', 'a', 'c', 'a'), game('CHAMPIONSHIP', 'UPCOMING', 'a', 'c')];
		expect(decidedSeriesLeftovers(games, format)).toEqual([{ stage: 'CHAMPIONSHIP', status: 'UPCOMING', count: 1 }]);
		expect(decidedSeriesLeftovers(games, { ...format, F: 3 })).toEqual([]);
	});
});
