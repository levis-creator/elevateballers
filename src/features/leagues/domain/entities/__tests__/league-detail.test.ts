import { describe, it, expect } from 'vitest';
import { type LeagueDetail, type LeagueSeasonSummary, computeDetailStats } from '../league-detail';
import type { AdminLeague } from '../league';

// seasonStatus/seasonProgress now live in the seasons feature and are covered by
// its own suite — this file only asserts what is specific to a league's detail.

function season(overrides: Partial<LeagueSeasonSummary> = {}): LeagueSeasonSummary {
	return {
		id: 's1',
		name: 'Season 1',
		startDate: '2026-01-01T00:00:00Z',
		endDate: '2026-12-31T00:00:00Z',
		active: true,
		bracketType: null,
		teams: 8,
		matches: 20,
		completed: 5,
		...overrides,
	};
}

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
