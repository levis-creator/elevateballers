import { describe, it, expect } from 'vitest';
import { CreateRoleSchema, UpdateRoleSchema, SetRolePermissionsSchema } from '../role-editor';

describe('CreateRoleSchema', () => {
	it('accepts a name with optional description', () => {
		expect(CreateRoleSchema.parse({ name: 'Team Coach' })).toEqual({ name: 'Team Coach' });
		expect(CreateRoleSchema.parse({ name: 'Team Coach', description: 'Manages a club' })).toEqual({
			name: 'Team Coach',
			description: 'Manages a club',
		});
	});

	it('rejects a missing or empty name, matching the old !name check', () => {
		expect(() => CreateRoleSchema.parse({})).toThrow();
		expect(() => CreateRoleSchema.parse({ name: '' })).toThrow();
	});
});

describe('UpdateRoleSchema', () => {
	it('accepts a partial update', () => {
		expect(UpdateRoleSchema.parse({ description: 'Updated' })).toEqual({ description: 'Updated' });
		expect(UpdateRoleSchema.parse({})).toEqual({});
	});

	it('rejects an empty name if provided', () => {
		expect(() => UpdateRoleSchema.parse({ name: '' })).toThrow();
	});
});

describe('SetRolePermissionsSchema', () => {
	it('accepts an array of permission ids, including empty', () => {
		expect(SetRolePermissionsSchema.parse({ permissionIds: [] })).toEqual({ permissionIds: [] });
		expect(SetRolePermissionsSchema.parse({ permissionIds: ['p1'] })).toEqual({ permissionIds: ['p1'] });
	});

	it('rejects a non-array, matching the old Array.isArray guard', () => {
		expect(() => SetRolePermissionsSchema.parse({ permissionIds: 'p1' })).toThrow();
	});
});
