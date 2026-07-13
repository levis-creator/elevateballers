import { describe, it, expect } from 'vitest';
import {
	type SeasonDetail,
	type SeasonFixture,
	computeSeasonStats,
	fixtureDay,
	fixtureResult,
	fixtureScore,
} from '../season-detail';
import type { AdminSeason } from '../season';

function fixture(overrides: Partial<SeasonFixture> = {}): SeasonFixture {
	return {
		id: 'm1',
		// 2026-07-13 is a Monday; 14:30 UTC.
		date: '2026-07-13T14:30:00Z',
		status: 'COMPLETED',
		team1: 'CBA Jets',
		team2: 'City Hawks',
		team1Score: 78,
		team2Score: 74,
		...overrides,
	};
}

function detail(season: Partial<AdminSeason>, teamCount: number): SeasonDetail {
	return {
		season: {
			id: 's1',
			name: '2026 Season',
			slug: '2026-season',
			description: null,
			startDate: '2026-01-01T00:00:00Z',
			endDate: '2026-12-31T00:00:00Z',
			active: true,
			bracketType: null,
			leagues: [],
			matches: 0,
			completed: 0,
			...season,
		},
		fixtures: [],
		standings: [],
		teams: Array.from({ length: teamCount }, (_, i) => ({
			id: `t${i}`,
			name: `Team ${i}`,
			slug: `team-${i}`,
			logo: null,
			played: 0,
			won: 0,
			lost: 0,
		})),
	};
}

describe('computeSeasonStats', () => {
	it('derives played and remaining from the season totals', () => {
		expect(computeSeasonStats(detail({ matches: 17, completed: 6 }, 8))).toEqual({
			matches: 17,
			played: 6,
			remaining: 11,
			teams: 8,
		});
	});

	it('clamps remaining at 0 rather than showing a negative count', () => {
		// Defensive: more completed than scheduled should never happen, but if the
		// counts ever disagree the rail must not render "-3 matches remaining".
		expect(computeSeasonStats(detail({ matches: 5, completed: 8 }, 4)).remaining).toBe(0);
	});

	it('handles a season with no fixtures and no teams', () => {
		expect(computeSeasonStats(detail({ matches: 0, completed: 0 }, 0))).toEqual({
			matches: 0,
			played: 0,
			remaining: 0,
			teams: 0,
		});
	});
});

describe('fixtureResult', () => {
	it('maps the MatchStatus enum', () => {
		expect(fixtureResult({ status: 'COMPLETED' })).toBe('Final');
		expect(fixtureResult({ status: 'LIVE' })).toBe('Live');
		expect(fixtureResult({ status: 'UPCOMING' })).toBe('Upcoming');
	});

	it('treats an unknown status as Upcoming rather than throwing', () => {
		expect(fixtureResult({ status: 'WHATEVER' })).toBe('Upcoming');
	});
});

describe('fixtureScore', () => {
	it('shows the scoreline for a played match', () => {
		expect(fixtureScore(fixture())).toBe('78–74');
	});

	it('shows a dash — not 0–0 — for a completed match with no score recorded', () => {
		expect(fixtureScore(fixture({ team1Score: null, team2Score: null }))).toBe('—');
	});

	it('shows the tip-off time for an upcoming match', () => {
		const score = fixtureScore(fixture({ status: 'UPCOMING', team1Score: null, team2Score: null }));
		expect(score).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
	});

	it('shows a dash for an unparseable date instead of "Invalid Date"', () => {
		expect(fixtureScore(fixture({ status: 'UPCOMING', date: 'nope', team1Score: null, team2Score: null }))).toBe('—');
	});
});

describe('fixtureDay', () => {
	it('formats the compact weekday + day column', () => {
		expect(fixtureDay({ date: '2026-07-13T14:30:00Z' })).toMatch(/^[A-Z]{3} \d{1,2}$/);
	});

	it('shows a dash for an unparseable date', () => {
		expect(fixtureDay({ date: 'nope' })).toBe('—');
	});
});
