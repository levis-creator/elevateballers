import { describe, it, expect } from 'vitest';
import {
	type SeasonFormValues,
	BRACKET_TYPES,
	EMPTY_SEASON_FORM,
	checklist,
	isStatusLocked,
	isValid,
	previewRange,
	previewStatus,
	toPayload,
	validateSeasonForm,
} from '../season-form';

const NOW = new Date('2026-07-13T12:00:00Z');

const form = (o: Partial<SeasonFormValues> = {}): SeasonFormValues => ({
	...EMPTY_SEASON_FORM,
	name: '2026 Season',
	startDate: '2026-01-01',
	endDate: '2026-12-31',
	...o,
});

describe('validateSeasonForm', () => {
	it('accepts a valid form', () => {
		expect(isValid(validateSeasonForm(form()))).toBe(true);
	});

	it('requires a name', () => {
		expect(validateSeasonForm(form({ name: '  ' })).name).toBeDefined();
	});

	it('requires both dates — the API rejects a season without them', () => {
		expect(validateSeasonForm(form({ startDate: '' })).startDate).toBeDefined();
		expect(validateSeasonForm(form({ endDate: '' })).endDate).toBeDefined();
	});

	it('rejects an end date before the start date', () => {
		expect(validateSeasonForm(form({ startDate: '2026-08-01', endDate: '2026-07-01' })).endDate).toBeDefined();
	});

	it('allows a single-day season (end === start)', () => {
		expect(isValid(validateSeasonForm(form({ startDate: '2026-08-01', endDate: '2026-08-01' })))).toBe(true);
	});

	it('rejects a malformed slug but allows an empty one', () => {
		expect(validateSeasonForm(form({ slug: 'Not A Slug' })).slug).toBeDefined();
		expect(validateSeasonForm(form({ slug: '2026-season' })).slug).toBeUndefined();
		expect(validateSeasonForm(form({ slug: '' })).slug).toBeUndefined();
	});

	it('checks the registration deadline only when the window is on', () => {
		const bad = { registrationOpensAt: '2026-08-01T09:00', registrationClosesAt: '2026-07-01T09:00' };

		// Window off → the stale dates are irrelevant, so no error.
		expect(validateSeasonForm(form({ ...bad, hasRegistrationWindow: false })).registrationClosesAt).toBeUndefined();
		expect(validateSeasonForm(form({ ...bad, hasRegistrationWindow: true })).registrationClosesAt).toBeDefined();
	});
});

describe('toPayload', () => {
	it('trims the name and drops blank optional text', () => {
		const p = toPayload(form({ name: '  2026 Season  ', slug: '', description: '  ', bracketType: '' }));
		expect(p.name).toBe('2026 Season');
		expect(p.slug).toBeUndefined();
		expect(p.description).toBeUndefined();
		expect(p.bracketType).toBeUndefined();
	});

	it('clears both registration dates when the window is switched off', () => {
		// Otherwise turning the toggle off would silently keep a stale window.
		const p = toPayload(
			form({
				hasRegistrationWindow: false,
				registrationOpensAt: '2026-07-01T09:00',
				registrationClosesAt: '2026-08-01T09:00',
			}),
		);
		expect(p.registrationOpensAt).toBeNull();
		expect(p.registrationClosesAt).toBeNull();
	});

	it('sends the registration dates when the window is on', () => {
		const p = toPayload(
			form({
				hasRegistrationWindow: true,
				registrationOpensAt: '2026-07-01T09:00',
				registrationClosesAt: '2026-08-01T09:00',
			}),
		);
		expect(p.registrationOpensAt).toBe('2026-07-01T09:00');
		expect(p.registrationClosesAt).toBe('2026-08-01T09:00');
	});

	it('passes the league links through — an empty array clears them (set semantics)', () => {
		expect(toPayload(form({ leagueIds: ['l1', 'l2'] })).leagueIds).toEqual(['l1', 'l2']);
		expect(toPayload(form({ leagueIds: [] })).leagueIds).toEqual([]);
	});
});

describe('BRACKET_TYPES', () => {
	it('offers only brackets the tournament engine can generate', () => {
		// Round-robin / group-stage are in the mockup but unsupported in code —
		// saving one would produce a bracket that can never be built.
		expect(BRACKET_TYPES.map((b) => b.value)).toEqual(['', 'single', 'double']);
	});
});

describe('previewStatus', () => {
	it('is Live for an active, in-window season', () => {
		expect(previewStatus(form(), NOW)).toBe('Live');
	});

	it('is Upcoming when the start date is in the future', () => {
		expect(previewStatus(form({ startDate: '2026-09-01', endDate: '2026-10-01' }), NOW)).toBe('Upcoming');
	});

	it('is Completed once marked completed (active = false)', () => {
		expect(previewStatus(form({ active: false }), NOW)).toBe('Completed');
	});

	it('reads as Live — not Completed — on an empty form', () => {
		// An unset date must not be parsed as 1970 and previewed as long finished.
		expect(previewStatus(EMPTY_SEASON_FORM, NOW)).toBe('Live');
	});
});

describe('isStatusLocked', () => {
	it('is locked only when the dates alone settle the status', () => {
		expect(isStatusLocked(form({ startDate: '2026-09-01', endDate: '2026-10-01' }), NOW)).toBe(true);
		expect(isStatusLocked(form(), NOW)).toBe(false);
	});
});

describe('previewRange', () => {
	it('formats a complete range', () => {
		expect(previewRange(form())).toBe('Jan 1, 2026 – Dec 31, 2026');
	});

	it('degrades gracefully on a half-filled form', () => {
		expect(previewRange(form({ endDate: '' }))).toBe('From Jan 1, 2026');
		expect(previewRange(form({ startDate: '' }))).toBe('Until Dec 31, 2026');
		expect(previewRange(form({ startDate: '', endDate: '' }))).toBe('Dates not set');
	});
});

describe('checklist', () => {
	it('ticks each item as it is satisfied', () => {
		expect(checklist(EMPTY_SEASON_FORM).every((i) => !i.done)).toBe(true);

		const done = checklist(form({ leagueIds: ['l1'] }));
		expect(done.every((i) => i.done)).toBe(true);
	});

	it('does not require a league — a season may be attached later', () => {
		// The league item is guidance, not validation.
		expect(isValid(validateSeasonForm(form({ leagueIds: [] })))).toBe(true);
		expect(checklist(form({ leagueIds: [] })).find((i) => i.label.includes('league'))?.done).toBe(false);
	});
});
