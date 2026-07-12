import { describe, it, expect } from 'vitest';
import {
	type AdminLeague,
	isRegistrationOpen,
	leagueStatus,
	matchesFilter,
	matchesSearch,
	computeStats,
} from '../league';

const NOW = new Date('2026-07-12T12:00:00Z');

function league(overrides: Partial<AdminLeague> = {}): AdminLeague {
	return {
		id: 'l1',
		name: 'Nairobi Premier',
		slug: 'nairobi-premier',
		description: 'Top flight',
		logo: null,
		active: true,
		registrationOpen: true,
		registrationOpensAt: null,
		registrationClosesAt: null,
		createdAt: '2026-01-01T00:00:00Z',
		_count: { matches: 0, leagueSeasons: 0 },
		...overrides,
	};
}

describe('isRegistrationOpen', () => {
	it('is open when the switch is on and no window is set', () => {
		expect(isRegistrationOpen(league(), NOW)).toBe(true);
	});

	it('is closed when the master switch is off, even inside the window', () => {
		const l = league({
			registrationOpen: false,
			registrationOpensAt: '2026-07-01T00:00:00Z',
			registrationClosesAt: '2026-08-01T00:00:00Z',
		});
		expect(isRegistrationOpen(l, NOW)).toBe(false);
	});

	it('is closed for an archived league', () => {
		expect(isRegistrationOpen(league({ active: false }), NOW)).toBe(false);
	});

	it('is closed before the window opens', () => {
		expect(isRegistrationOpen(league({ registrationOpensAt: '2026-08-01T00:00:00Z' }), NOW)).toBe(false);
	});

	it('is closed after the window closes', () => {
		expect(isRegistrationOpen(league({ registrationClosesAt: '2026-07-01T00:00:00Z' }), NOW)).toBe(false);
	});

	it('is open inside the window', () => {
		const l = league({
			registrationOpensAt: '2026-07-01T00:00:00Z',
			registrationClosesAt: '2026-08-01T00:00:00Z',
		});
		expect(isRegistrationOpen(l, NOW)).toBe(true);
	});

	it('treats an unparseable bound as unbounded rather than closing registration', () => {
		expect(isRegistrationOpen(league({ registrationOpensAt: 'not-a-date' }), NOW)).toBe(true);
	});
});

describe('leagueStatus', () => {
	it('reports Archived for an inactive league', () => {
		expect(leagueStatus(league({ active: false }), NOW)).toBe('Archived');
	});

	it('reports Registering when registration is genuinely open', () => {
		expect(leagueStatus(league(), NOW)).toBe('Registering');
	});

	it('reports Active when the league runs but registration is shut', () => {
		expect(leagueStatus(league({ registrationOpen: false }), NOW)).toBe('Active');
	});
});

describe('matchesFilter', () => {
	it('keeps everything under All', () => {
		expect(matchesFilter(league({ active: false }), 'All')).toBe(true);
	});

	it('splits Active from Archived on the active flag', () => {
		expect(matchesFilter(league({ active: true }), 'Active')).toBe(true);
		expect(matchesFilter(league({ active: true }), 'Archived')).toBe(false);
		expect(matchesFilter(league({ active: false }), 'Archived')).toBe(true);
	});
});

describe('matchesSearch', () => {
	it('matches an empty query', () => {
		expect(matchesSearch(league(), '  ')).toBe(true);
	});

	it('matches name, slug and description case-insensitively', () => {
		expect(matchesSearch(league(), 'NAIROBI')).toBe(true);
		expect(matchesSearch(league(), 'nairobi-prem')).toBe(true);
		expect(matchesSearch(league(), 'top flight')).toBe(true);
		expect(matchesSearch(league(), 'mombasa')).toBe(false);
	});

	it('tolerates a null description', () => {
		expect(matchesSearch(league({ description: null }), 'nairobi')).toBe(true);
	});
});

describe('computeStats', () => {
	it('counts totals, active, registering and summed matches', () => {
		const stats = computeStats(
			[
				league({ id: 'a', _count: { matches: 10, leagueSeasons: 2 } }),
				league({ id: 'b', registrationOpen: false, _count: { matches: 5, leagueSeasons: 1 } }),
				league({ id: 'c', active: false, _count: { matches: 3, leagueSeasons: 1 } }),
			],
			NOW,
		);
		expect(stats).toEqual({ total: 3, active: 2, registering: 1, matches: 18 });
	});

	it('returns zeroes for an empty list', () => {
		expect(computeStats([], NOW)).toEqual({ total: 0, active: 0, registering: 0, matches: 0 });
	});
});
