import { describe, it, expect } from 'vitest';
import { SetNotificationsSchema, SetCoachTeamsSchema } from '../user-directory';

describe('SetNotificationsSchema', () => {
	it('accepts a boolean', () => {
		expect(SetNotificationsSchema.parse({ emailEnabled: true })).toEqual({ emailEnabled: true });
		expect(SetNotificationsSchema.parse({ emailEnabled: false })).toEqual({ emailEnabled: false });
	});

	it('rejects a non-boolean, matching the old typeof check', () => {
		expect(() => SetNotificationsSchema.parse({ emailEnabled: 'true' })).toThrow();
		expect(() => SetNotificationsSchema.parse({})).toThrow();
	});
});

describe('SetCoachTeamsSchema', () => {
	it('accepts an array of team ids, including empty', () => {
		expect(SetCoachTeamsSchema.parse({ teamIds: [] })).toEqual({ teamIds: [] });
		expect(SetCoachTeamsSchema.parse({ teamIds: ['t1', 't2'] })).toEqual({ teamIds: ['t1', 't2'] });
	});

	it('rejects a non-array, matching the old Array.isArray guard', () => {
		expect(() => SetCoachTeamsSchema.parse({ teamIds: 't1' })).toThrow();
		expect(() => SetCoachTeamsSchema.parse({})).toThrow();
	});
});
