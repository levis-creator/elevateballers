import { z } from 'zod';

export type UserStatus = 'Active' | 'Pending' | 'Suspended';

export interface RoleOption {
	id: string;
	name: string;
	description: string | null;
	isSystem: boolean;
}

export interface CoachTeamScope {
	teamId: string;
	teamName: string;
}

export interface UserAccountRow {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	active: boolean;
	activatedAt: string | null;
	createdAt: string;
	updatedAt: string;
	roles: RoleOption[];
	coachTeams: CoachTeamScope[];
	notifyEmail: boolean;
	lastActive: string | null;
	signIns: number;
}

export interface TeamOption {
	id: string;
	name: string;
	league?: string | null;
}

export interface UserDirectoryFilters {
	search: string;
	role: string;
	status: 'All statuses' | UserStatus;
	team: string;
	sort: 'Name A–Z' | 'Name Z–A' | 'Recently active' | 'Newest first';
}

/** Coaches are scoped to the clubs in `coachTeams` rather than the whole league — see TeamOwnership. */
export const COACH_ROLE_NAME = 'Team Coach';
export const MAX_COACH_TEAMS = 2;
export const ADMIN_ROLE_NAME = 'Admin';

export const ALL_ROLES_OPTION = 'All roles';
export const ALL_STATUSES_OPTION = 'All statuses';
export const ALL_TEAMS_OPTION = 'All teams';

export const STATUS_OPTIONS: UserDirectoryFilters['status'][] = [ALL_STATUSES_OPTION as 'All statuses', 'Active', 'Pending', 'Suspended'];
export const SORT_OPTIONS: UserDirectoryFilters['sort'][] = ['Name A–Z', 'Name Z–A', 'Recently active', 'Newest first'];

export const emptyUserDirectoryFilters: UserDirectoryFilters = {
	search: '',
	role: ALL_ROLES_OPTION,
	status: ALL_STATUSES_OPTION,
	team: ALL_TEAMS_OPTION,
	sort: 'Name A–Z',
};

export function getUserStatus(user: Pick<UserAccountRow, 'active' | 'activatedAt'>): UserStatus {
	if (!user.active) return 'Suspended';
	if (!user.activatedAt) return 'Pending';
	return 'Active';
}

export function getUserInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '—';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function isAdminRole(role: Pick<RoleOption, 'name'>): boolean {
	return role.name === ADMIN_ROLE_NAME;
}

export function isCoachRole(role: Pick<RoleOption, 'name'>): boolean {
	return role.name === COACH_ROLE_NAME;
}

export function hasAdminRole(user: Pick<UserAccountRow, 'roles'>): boolean {
	return user.roles.some(isAdminRole);
}

export function hasCoachRole(user: Pick<UserAccountRow, 'roles'>): boolean {
	return user.roles.some(isCoachRole);
}

export function formatLastActive(lastActive: string | null): string {
	if (!lastActive) return 'Never';
	const then = new Date(lastActive).getTime();
	const diffMs = Date.now() - then;
	const minutes = Math.floor(diffMs / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	const days = Math.floor(hours / 24);
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 8) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
	return new Date(lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(dateIso: string): string {
	return new Date(dateIso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function filterAndSortUsers(users: UserAccountRow[], filters: UserDirectoryFilters): UserAccountRow[] {
	const q = filters.search.trim().toLowerCase();
	let list = users.filter((u) => {
		if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false;
		if (filters.role !== ALL_ROLES_OPTION && !u.roles.some((r) => r.name === filters.role)) return false;
		if (filters.status !== ALL_STATUSES_OPTION && getUserStatus(u) !== filters.status) return false;
		if (filters.team !== ALL_TEAMS_OPTION && !u.coachTeams.some((t) => t.teamName === filters.team)) return false;
		return true;
	});
	if (filters.sort.startsWith('Name')) {
		const dir = filters.sort === 'Name Z–A' ? -1 : 1;
		list = [...list].sort((a, b) => dir * a.name.localeCompare(b.name));
	} else if (filters.sort === 'Recently active') {
		list = [...list].sort((a, b) => b.signIns - a.signIns);
	} else if (filters.sort === 'Newest first') {
		list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}
	return list;
}

export interface UserDraft {
	id: string | null;
	first: string;
	last: string;
	email: string;
	phone: string;
	roleIds: string[];
	teamIds: string[];
	notifyEmail: boolean;
	active: boolean;
	activatedAt: string | null;
	createdAt: string;
	lastActive: string | null;
	signIns: number;
}

export function draftFromUser(user: UserAccountRow, roles: RoleOption[]): UserDraft {
	const [first, ...rest] = user.name.split(' ');
	return {
		id: user.id,
		first: first ?? '',
		last: rest.join(' '),
		email: user.email,
		phone: user.phone ?? '',
		roleIds: user.roles.map((r) => r.id).filter((id) => roles.some((role) => role.id === id)),
		teamIds: user.coachTeams.map((t) => t.teamId),
		notifyEmail: user.notifyEmail,
		active: user.active,
		activatedAt: user.activatedAt,
		createdAt: user.createdAt,
		lastActive: user.lastActive,
		signIns: user.signIns,
	};
}

export const emptyUserDraft: UserDraft = {
	id: null,
	first: '',
	last: '',
	email: '',
	phone: '',
	roleIds: [],
	teamIds: [],
	notifyEmail: true,
	active: true,
	activatedAt: null,
	createdAt: '',
	lastActive: null,
	signIns: 0,
};

// ---------------------------------------------------------------------------
// Request validation schemas — source of truth for API route bodies
// ---------------------------------------------------------------------------

export const SetNotificationsSchema = z.object({
	emailEnabled: z.boolean(),
});
export type SetNotificationsInput = z.infer<typeof SetNotificationsSchema>;

export const SetCoachTeamsSchema = z.object({
	teamIds: z.array(z.string()),
});
export type SetCoachTeamsInput = z.infer<typeof SetCoachTeamsSchema>;
