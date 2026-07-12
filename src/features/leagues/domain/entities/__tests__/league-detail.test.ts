import { describe, it, expect } from 'vitest';
import {
	type LeagueDetail,
	type LeagueSeasonSummary,
	computeDetailStats,
	seasonBadge,
	seasonProgress,
} from '../league-detail';
import type { AdminLeague } from '../league';

const NOW = new Date('2026-07-12T12:00:00Z');

function season(overrides: Partial<LeagueSeasonSummary> = {}): LeagueSeasonSummary {
	return {
		id: 's1',
		name: 'Season 1',
		startDate: '2026-01-01T00:00:00Z',
		endDate: '2026-12-31T00:00:00Z',
		active: true,
		teams: 8,
		matches: 20,
		completed: 5,
		...overrides,
	};
}

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

describe('seasonBadge', () => {
	it('is Upcoming before the season starts', () => {
		expect(seasonBadge(season({ startDate: '2026-09-01T00:00:00Z' }), NOW)).toBe('Upcoming');
	});

	it('is Completed after the season ends', () => {
		expect(seasonBadge(season({ endDate: '2026-05-01T00:00:00Z' }), NOW)).toBe('Completed');
	});

	it('is Active inside the window when the season is flagged active', () => {
		expect(seasonBadge(season(), NOW)).toBe('Active');
	});

	it('is Completed inside the window when the season is not active', () => {
		expect(seasonBadge(season({ active: false }), NOW)).toBe('Completed');
	});
});

describe('computeDetailStats', () => {
	it('takes match totals from the league, so matches with no season are not dropped', () => {
		const detail = {
			league: { _count: { matches: 25, leagueSeasons: 2 } } as AdminLeague,
			currentSeason: null,
			completedMatches: 9,
			// The seasons only account for 20 of the league's 25 matches.
			seasons: [season({ id: 'a', matches: 12, completed: 6 }), season({ id: 'b', matches: 8, completed: 3 })],
			teams: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
			recentMatches: [],
			standings: [],
		} as unknown as LeagueDetail;

		expect(computeDetailStats(detail)).toEqual({ seasons: 2, teams: 3, matches: 25, completed: 9 });
	});

	it('returns zeroes for an empty league', () => {
		const detail = {
			league: { _count: { matches: 0, leagueSeasons: 0 } } as AdminLeague,
			currentSeason: null,
			completedMatches: 0,
			seasons: [],
			teams: [],
			recentMatches: [],
			standings: [],
		} as unknown as LeagueDetail;

		expect(computeDetailStats(detail)).toEqual({ seasons: 0, teams: 0, matches: 0, completed: 0 });
	});
});
