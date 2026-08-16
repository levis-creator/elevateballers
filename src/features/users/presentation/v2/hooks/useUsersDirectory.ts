import { useCallback, useEffect, useMemo, useState } from 'react';
import { usersApi } from '../../../data/datasources/users-api';
import {
	ADMIN_ROLE_NAME,
	ALL_ROLES_OPTION,
	ALL_TEAMS_OPTION,
	COACH_ROLE_NAME,
	MAX_COACH_TEAMS,
	draftFromUser,
	emptyUserDirectoryFilters,
	emptyUserDraft,
	filterAndSortUsers,
	getUserStatus,
	hasAdminRole,
	isCoachRole,
	type RoleOption,
	type TeamOption,
	type UserAccountRow,
	type UserDirectoryFilters,
	type UserDraft,
} from '../../../domain/entities/user-directory';

export function useUsersDirectory() {
	const [users, setUsers] = useState<UserAccountRow[]>([]);
	const [roles, setRoles] = useState<RoleOption[]>([]);
	const [teams, setTeams] = useState<TeamOption[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const [filters, setFilters] = useState<UserDirectoryFilters>(emptyUserDirectoryFilters);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [form, setForm] = useState<'create' | 'edit' | null>(null);
	const [draft, setDraft] = useState<UserDraft | null>(null);
	const [teamQuery, setTeamQuery] = useState('');
	const [bulkRoleId, setBulkRoleId] = useState('');
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<string | null>(null);

	const say = useCallback((message: string) => {
		setToast(message);
		setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
	}, []);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError('');
			const [userRows, roleRows, teamRows, me] = await Promise.all([
				usersApi.list(),
				usersApi.roles(),
				usersApi.teams(),
				usersApi.me().catch(() => null),
			]);
			setUsers(userRows);
			setRoles(roleRows);
			setTeams(teamRows);
			setCurrentUserId(me?.id ?? null);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Failed to load users');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const roleOptions = useMemo(() => [ALL_ROLES_OPTION, ...roles.map((r) => r.name)], [roles]);
	const teamOptions = useMemo(
		() => [ALL_TEAMS_OPTION, ...Array.from(new Set(users.flatMap((u) => u.coachTeams.map((t) => t.teamName)))).sort()],
		[users],
	);
	const filtered = useMemo(() => filterAndSortUsers(users, filters), [users, filters]);

	const updateFilter = (key: keyof UserDirectoryFilters, value: string) => setFilters((current) => ({ ...current, [key]: value } as UserDirectoryFilters));
	const resetFilters = () => setFilters(emptyUserDirectoryFilters);

	const toggleSelection = (id: string) =>
		setSelected((current) => {
			const next = new Set(current);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	const toggleAll = () =>
		setSelected((current) => {
			const allSelected = filtered.length > 0 && filtered.every((u) => current.has(u.id));
			return allSelected ? new Set() : new Set(filtered.map((u) => u.id));
		});
	const clearSelection = () => setSelected(new Set());

	const openCreate = () => {
		setDraft({ ...emptyUserDraft });
		setForm('create');
		setTeamQuery('');
	};
	const openEdit = (user: UserAccountRow) => {
		setDraft(draftFromUser(user, roles));
		setForm('edit');
		setTeamQuery('');
	};
	const closeForm = () => {
		setForm(null);
		setDraft(null);
		setTeamQuery('');
	};

	const patchDraft = (patch: Partial<UserDraft>) => setDraft((current) => (current ? { ...current, ...patch } : current));

	const toggleDraftRole = (roleId: string) => {
		if (!draft) return;
		const on = draft.roleIds.includes(roleId);
		patchDraft({ roleIds: on ? draft.roleIds.filter((id) => id !== roleId) : [...draft.roleIds, roleId] });
	};

	const toggleDraftTeam = (teamId: string) => {
		if (!draft) return;
		const on = draft.teamIds.includes(teamId);
		if (!on && draft.teamIds.length >= MAX_COACH_TEAMS) {
			say(`A ${COACH_ROLE_NAME} can hold at most ${MAX_COACH_TEAMS} clubs — remove one first`);
			return;
		}
		patchDraft({ teamIds: on ? draft.teamIds.filter((id) => id !== teamId) : [...draft.teamIds, teamId] });
	};

	const draftIsCoach = draft ? draft.roleIds.some((id) => roles.find((r) => r.id === id && isCoachRole(r))) : false;
	const nameOk = !!(draft && draft.first.trim() && draft.last.trim());
	const emailOk = !!draft && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email || '');
	const dupe = !!draft && users.some((u) => u.email.toLowerCase() === draft.email.toLowerCase() && u.id !== draft.id);
	const rolesOk = !!draft && draft.roleIds.length > 0;
	const scopeOk = !draftIsCoach || (draft ? draft.teamIds.length > 0 : false);
	const canSave = nameOk && emailOk && !dupe && rolesOk && scopeOk && !saving;

	const isLastAdmin = (user: Pick<UserAccountRow, 'id' | 'roles'>) =>
		hasAdminRole(user) && users.filter((u) => u.id !== user.id && hasAdminRole(u)).length === 0;

	const save = async () => {
		if (!draft || !canSave) return;
		setSaving(true);
		try {
			const name = `${draft.first.trim()} ${draft.last.trim()}`.trim();
			if (form === 'create') {
				const created = await usersApi.create({
					name,
					email: draft.email.trim(),
					phone: draft.phone.trim() || undefined,
					roleIds: draft.roleIds,
					teamIds: draftIsCoach ? draft.teamIds : [],
					notifyEmail: draft.notifyEmail,
				});
				setUsers((current) => [created, ...current]);
				say(`Invite sent to ${draft.email.trim()}`);
			} else if (draft.id) {
				// Send the trimmed phone as-is (possibly ''), not `|| undefined` — an
				// omitted key is dropped by JSON.stringify, and the PUT handler only
				// touches phone when the key is present, so clearing the field would
				// otherwise silently leave the old number in place.
				await usersApi.update(draft.id, { name, email: draft.email.trim(), phone: draft.phone.trim(), active: draft.active });
				await usersApi.setRoles(draft.id, draft.roleIds);
				if (draftIsCoach) await usersApi.setTeams(draft.id, draft.teamIds);
				await usersApi.setNotifications(draft.id, draft.notifyEmail);
				say('Changes saved');
				await load();
			}
			closeForm();
			if (form === 'create') await load();
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to save user');
		} finally {
			setSaving(false);
		}
	};

	const sendReset = async (id: string, email: string) => {
		try {
			const result = await usersApi.sendReset(id);
			say(result.isInvite ? `Invite resent to ${email}` : `Password reset sent to ${email}`);
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to send email');
		}
	};

	const removeUser = async () => {
		if (!draft?.id) return;
		const target = users.find((u) => u.id === draft.id);
		if (target && isLastAdmin(target)) {
			say('This is the last admin account — removing it would lock everyone out.');
			return;
		}
		try {
			await usersApi.remove(draft.id);
			setUsers((current) => current.filter((u) => u.id !== draft.id));
			say('User removed');
			closeForm();
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to remove user');
		}
	};

	const bulkSuspend = async () => {
		const ids = Array.from(selected);
		try {
			await Promise.all(ids.map((id) => usersApi.update(id, { active: false })));
			say(`${ids.length} suspended`);
			clearSelection();
			await load();
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to suspend selected users');
		}
	};

	const bulkApplyRole = async () => {
		if (!bulkRoleId) return;
		const ids = Array.from(selected);
		try {
			await Promise.all(
				ids.map((id) => {
					const user = users.find((u) => u.id === id);
					const nextRoleIds = Array.from(new Set([...(user?.roles.map((r) => r.id) ?? []), bulkRoleId]));
					return usersApi.setRoles(id, nextRoleIds);
				}),
			);
			const role = roles.find((r) => r.id === bulkRoleId);
			say(`${role?.name ?? 'Role'} added for ${ids.length} people`);
			setBulkRoleId('');
			clearSelection();
			await load();
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to change roles');
		}
	};

	const teamResults = useMemo(() => {
		const q = teamQuery.trim().toLowerCase();
		if (!q) return [] as TeamOption[];
		return teams.filter((t) => t.name.toLowerCase().includes(q) || (t.league ?? '').toLowerCase().includes(q)).slice(0, 8);
	}, [teamQuery, teams]);

	const counts = {
		total: users.length,
		active: users.filter((u) => getUserStatus(u) === 'Active').length,
		pending: users.filter((u) => getUserStatus(u) === 'Pending').length,
		admins: users.filter(hasAdminRole).length,
		coaches: users.filter((u) => u.roles.some(isCoachRole)).length,
	};

	return {
		loading, error, load, toast,
		users, roles, teams, currentUserId,
		roleOptions, teamOptions, counts,
		filters, updateFilter, resetFilters,
		filtered, selected, toggleSelection, toggleAll, clearSelection,
		form, draft, openCreate, openEdit, closeForm, patchDraft,
		toggleDraftRole, toggleDraftTeam, draftIsCoach,
		nameOk, emailOk, dupe, rolesOk, scopeOk, canSave, saving,
		save, sendReset, removeUser, isLastAdmin,
		bulkSuspend, bulkRoleId, setBulkRoleId, bulkApplyRole,
		teamQuery, setTeamQuery, teamResults,
		ADMIN_ROLE_NAME, COACH_ROLE_NAME, MAX_COACH_TEAMS,
	};
}
