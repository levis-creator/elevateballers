import type { PermissionOption, RoleDetail, RoleRow } from '../../domain/entities/role-editor';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body.error || `Request failed (${response.status})`);
	}
	return response.json() as Promise<T>;
}

export const rolesApi = {
	list: () => getJson<{ roles: RoleRow[] }>('/api/roles').then((r) => r.roles),
	catalogue: () => getJson<{ permissions: PermissionOption[] }>('/api/permissions').then((r) => r.permissions),
	get: (id: string) => getJson<{ role: RoleDetail }>(`/api/roles/${id}`).then((r) => r.role),

	create: (payload: { name: string; description?: string }) =>
		getJson<{ role: { id: string; name: string; description: string | null; isSystem: boolean } }>('/api/roles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then((r) => r.role),

	update: (id: string, payload: { name?: string; description?: string }) =>
		getJson(`/api/roles/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}),

	setPermissions: (id: string, permissionIds: string[]) =>
		getJson(`/api/roles/${id}/permissions`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ permissionIds }),
		}),

	remove: (id: string) => getJson<{ message: string }>(`/api/roles/${id}`, { method: 'DELETE' }),
	permissionSyncPreview: () => getJson<{
		canonicalCount: number;
		missingCount: number;
		canApply: boolean;
		permissions: Array<{ resource: string; action: string; description: string | null; category: string | null }>;
	}>('/api/roles/permission-sync'),
	applyPermissionSync: () => getJson<{ applied: boolean; createdCount: number; roleAssignmentsChanged: number }>('/api/roles/permission-sync', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ confirm: true }),
	}),
};
