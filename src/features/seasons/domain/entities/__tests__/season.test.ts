import { describe, it, expect } from 'vitest';
import {
	type AdminSeason,
	SEASON_FILTERS,
	computeStats,
	countByFilter,
	formatRange,
	matchesFilter,
	matchesSearch,
	seasonProgress,
	seasonStatus,
} from '../season';

const NOW = new Date('2026-07-12T12:00:00Z');

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
