export interface PermissionOption {
	id: string;
	resource: string;
	action: string;
	description: string | null;
	category: string | null;
}

export interface RoleRow {
	id: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	permissionCount: number;
	userCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface RoleDetail {
	id: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	userCount: number;
	permissions: PermissionOption[];
	createdAt: string;
	updatedAt: string;
}

/** The action vocabulary common enough across resources to earn a fixed matrix column. Anything else renders as a per-row extra. */
export const STANDARD_ACTIONS = [
	{ key: 'read', label: 'View' },
	{ key: 'create', label: 'Create' },
	{ key: 'update', label: 'Edit' },
	{ key: 'delete', label: 'Delete' },
	{ key: 'manage', label: 'Manage' },
] as const;
export type StandardActionKey = (typeof STANDARD_ACTIONS)[number]['key'];
const STANDARD_ACTION_KEYS = new Set<string>(STANDARD_ACTIONS.map((a) => a.key));

const RESOURCE_LABELS: Record<string, string> = {
	news_articles: 'News articles',
	page_contents: 'Pages',
	potw: 'Player of the Week',
	site_settings: 'Settings',
	registration_notifications: 'Registration alerts',
	game_rules: 'Game rules',
	contact_messages: 'Contact messages',
	audit_logs: 'Audit logs',
};

export function humanizeResource(resource: string): string {
	return RESOURCE_LABELS[resource] ?? resource.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function humanizeAction(action: string): string {
	return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface MatrixRow {
	resource: string;
	label: string;
	category: string;
	standard: Partial<Record<StandardActionKey, PermissionOption>>;
	extras: PermissionOption[];
}

export interface MatrixGroup {
	category: string;
	rows: MatrixRow[];
}

export function buildPermissionMatrix(catalogue: PermissionOption[]): MatrixRow[] {
	const byResource = new Map<string, PermissionOption[]>();
	catalogue.forEach((p) => {
		const list = byResource.get(p.resource) ?? [];
		list.push(p);
		byResource.set(p.resource, list);
	});
	const rows: MatrixRow[] = [];
	byResource.forEach((perms, resource) => {
		const standard: Partial<Record<StandardActionKey, PermissionOption>> = {};
		const extras: PermissionOption[] = [];
		perms.forEach((p) => {
			if (STANDARD_ACTION_KEYS.has(p.action)) standard[p.action as StandardActionKey] = p;
			else extras.push(p);
		});
		rows.push({
			resource,
			label: humanizeResource(resource),
			category: perms[0]?.category ?? 'Other',
			standard,
			extras: extras.sort((a, b) => a.action.localeCompare(b.action)),
		});
	});
	return rows.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
}

export function groupMatrixByCategory(rows: MatrixRow[]): MatrixGroup[] {
	const groups: MatrixGroup[] = [];
	rows.forEach((row) => {
		let group = groups.find((g) => g.category === row.category);
		if (!group) {
			group = { category: row.category, rows: [] };
			groups.push(group);
		}
		group.rows.push(row);
	});
	return groups;
}

export function filterMatrixRows(rows: MatrixRow[], query: string): MatrixRow[] {
	const q = query.trim().toLowerCase();
	if (!q) return rows;
	return rows.filter((r) => r.label.toLowerCase().includes(q) || r.resource.includes(q) || r.category.toLowerCase().includes(q));
}

export interface RoleDraft {
	id: string | null;
	name: string;
	description: string;
	permissionIds: string[];
}

export function draftFromRole(role: RoleDetail): RoleDraft {
	return { id: role.id, name: role.name, description: role.description ?? '', permissionIds: role.permissions.map((p) => p.id) };
}

export const emptyRoleDraft: RoleDraft = { id: null, name: '', description: '', permissionIds: [] };

export type RoleKindFilter = 'All' | 'System' | 'Custom';
export const ROLE_KIND_FILTERS: RoleKindFilter[] = ['All', 'System', 'Custom'];

export function filterRoles(roles: RoleRow[], search: string, kind: RoleKindFilter): RoleRow[] {
	const q = search.trim().toLowerCase();
	return roles.filter((r) => {
		if (q && !(r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q))) return false;
		if (kind === 'System' && !r.isSystem) return false;
		if (kind === 'Custom' && r.isSystem) return false;
		return true;
	});
}
