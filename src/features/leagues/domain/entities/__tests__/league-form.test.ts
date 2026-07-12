import { describe, it, expect } from 'vitest';
import {
	type LeagueFormValues,
	EMPTY_LEAGUE_FORM,
	isValid,
	slugify,
	toDateTimeLocal,
	toPayload,
	validateLeagueForm,
} from '../league-form';

const form = (o: Partial<LeagueFormValues> = {}): LeagueFormValues => ({
	...EMPTY_LEAGUE_FORM,
	name: 'Ballers League',
	...o,
});

describe('slugify', () => {
	it('lowercases and hyphenates', () => {
		expect(slugify('Ballers League')).toBe('ballers-league');
		expect(slugify("Women's League")).toBe('women-s-league');
	});

	it('trims leading and trailing hyphens', () => {
		expect(slugify('  !Junior Ballers!  ')).toBe('junior-ballers');
	});
});

describe('validateLeagueForm', () => {
	it('accepts a valid form', () => {
		expect(isValid(validateLeagueForm(form()))).toBe(true);
	});

	it('requires a name', () => {
		expect(validateLeagueForm(form({ name: '   ' })).name).toBeDefined();
	});

	it('rejects a malformed slug but allows an empty one', () => {
		expect(validateLeagueForm(form({ slug: 'Not A Slug' })).slug).toBeDefined();
		expect(validateLeagueForm(form({ slug: 'ballers-league-2' })).slug).toBeUndefined();
		expect(validateLeagueForm(form({ slug: '' })).slug).toBeUndefined();
	});

	it('rejects a deadline that is not after the opening date', () => {
		const bad = form({
			registrationOpensAt: '2026-08-01T09:00',
			registrationClosesAt: '2026-07-01T09:00',
		});
		expect(validateLeagueForm(bad).registrationClosesAt).toBeDefined();

		const equal = form({
			registrationOpensAt: '2026-08-01T09:00',
			registrationClosesAt: '2026-08-01T09:00',
		});
		expect(validateLeagueForm(equal).registrationClosesAt).toBeDefined();
	});

	it('accepts a deadline after the opening date', () => {
		const ok = form({
			registrationOpensAt: '2026-07-01T09:00',
			registrationClosesAt: '2026-08-01T09:00',
		});
		expect(isValid(validateLeagueForm(ok))).toBe(true);
	});

	it('does not complain when only one bound is set', () => {
		expect(isValid(validateLeagueForm(form({ registrationOpensAt: '2026-07-01T09:00' })))).toBe(true);
		expect(isValid(validateLeagueForm(form({ registrationClosesAt: '2026-07-01T09:00' })))).toBe(true);
	});
});

describe('toPayload', () => {
	it('trims the name and drops blank optional text so it is left alone', () => {
		const p = toPayload(form({ name: '  Ballers League  ', description: '  ', logo: '', slug: '' }));
		expect(p.name).toBe('Ballers League');
		expect(p.slug).toBeUndefined();
		expect(p.description).toBeUndefined();
		expect(p.logo).toBeUndefined();
	});

	it('sends null — not undefined — for blank dates, so they are cleared', () => {
		const p = toPayload(form({ registrationOpensAt: '', registrationClosesAt: '' }));
		expect(p.registrationOpensAt).toBeNull();
		expect(p.registrationClosesAt).toBeNull();
	});

	it('passes the flags straight through', () => {
		const p = toPayload(form({ active: false, registrationOpen: false }));
		expect(p.active).toBe(false);
		expect(p.registrationOpen).toBe(false);
	});
});

describe('toDateTimeLocal', () => {
	it('formats a date for a datetime-local input', () => {
		expect(toDateTimeLocal(new Date(2026, 6, 12, 9, 5))).toBe('2026-07-12T09:05');
	});

	it('returns "" for empty or unparseable input', () => {
		expect(toDateTimeLocal(null)).toBe('');
		expect(toDateTimeLocal('')).toBe('');
		expect(toDateTimeLocal('not-a-date')).toBe('');
	});
});
