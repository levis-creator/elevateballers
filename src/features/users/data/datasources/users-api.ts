import type { RoleOption, TeamOption, UserAccountRow } from '../../domain/entities/user-directory';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body.error || `Request failed (${response.status})`);
	}
	return response.json() as Promise<T>;
}

export interface CreateUserPayload {
	name: string;
	email: string;
	phone?: string;
	roleIds: string[];
	teamIds?: string[];
	notifyEmail?: boolean;
}

export interface UpdateUserPayload {
	name?: string;
	email?: string;
	phone?: string;
	active?: boolean;
}

export const usersApi = {
	list: () => getJson<UserAccountRow[]>('/api/users'),
	roles: () => getJson<{ roles: RoleOption[] }>('/api/roles').then((r) => r.roles),
	teams: () => getJson<TeamOption[]>('/api/teams'),
	me: () => getJson<{ user: { id: string } }>('/api/auth/me').then((r) => r.user),

	create: (payload: CreateUserPayload) =>
		getJson<{ user: UserAccountRow }>('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then((r) => r.user),

	update: (id: string, payload: UpdateUserPayload) =>
		getJson<UserAccountRow>(`/api/users/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}),

	setRoles: (id: string, roleIds: string[]) =>
		getJson(`/api/users/${id}/role`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ roleIds }),
		}),

	setTeams: (id: string, teamIds: string[]) =>
		getJson(`/api/users/${id}/teams`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ teamIds }),
		}),

	setNotifications: (id: string, emailEnabled: boolean) =>
		getJson(`/api/users/${id}/notifications`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ emailEnabled }),
		}),

	sendReset: (id: string) => getJson<{ ok: true; isInvite: boolean }>(`/api/users/${id}/send-reset`, { method: 'POST' }),

	remove: (id: string) => getJson<{ success: true }>(`/api/users/${id}`, { method: 'DELETE' }),
};
