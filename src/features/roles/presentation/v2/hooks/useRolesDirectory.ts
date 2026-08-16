import { useCallback, useEffect, useMemo, useState } from 'react';
import { rolesApi } from '../../../data/datasources/roles-api';
import {
	buildPermissionMatrix,
	draftFromRole,
	emptyRoleDraft,
	filterMatrixRows,
	filterRoles,
	groupMatrixByCategory,
	type PermissionOption,
	type RoleDraft,
	type RoleKindFilter,
	type RoleRow,
} from '../../../domain/entities/role-editor';

export function useRolesDirectory() {
	const [roles, setRoles] = useState<RoleRow[]>([]);
	const [catalogue, setCatalogue] = useState<PermissionOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const [search, setSearch] = useState('');
	const [kind, setKind] = useState<RoleKindFilter>('All');

	const [editing, setEditing] = useState<'new' | string | null>(null);
	const [draft, setDraft] = useState<RoleDraft | null>(null);
	const [originalPermissionIds, setOriginalPermissionIds] = useState<string[]>([]);
	const [editorLoading, setEditorLoading] = useState(false);
	const [permQuery, setPermQuery] = useState('');
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<string | null>(null);

	const say = useCallback((message: string) => {
		setToast(message);
		setTimeout(() => setToast((current) => (current === message ? null : current)), 2500);
	}, []);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError('');
			const [roleRows, perms] = await Promise.all([rolesApi.list(), rolesApi.catalogue()]);
			setRoles(roleRows);
			setCatalogue(perms);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Failed to load roles');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => filterRoles(roles, search, kind), [roles, search, kind]);
	const matrixRows = useMemo(() => filterMatrixRows(buildPermissionMatrix(catalogue), permQuery), [catalogue, permQuery]);
	const matrixGroups = useMemo(() => groupMatrixByCategory(matrixRows), [matrixRows]);
	const totalPermissions = catalogue.length;

	const editingRole = editing && editing !== 'new' ? roles.find((r) => r.id === editing) ?? null : null;
	const creating = editing === 'new';

	const openCreate = () => {
		setEditing('new');
		setDraft({ ...emptyRoleDraft });
		setOriginalPermissionIds([]);
		setPermQuery('');
	};

	const openEdit = async (role: RoleRow) => {
		setEditing(role.id);
		setDraft(null);
		setPermQuery('');
		setEditorLoading(true);
		try {
			const detail = await rolesApi.get(role.id);
			const nextDraft = draftFromRole(detail);
			setDraft(nextDraft);
			setOriginalPermissionIds(nextDraft.permissionIds);
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to load role');
			setEditing(null);
		} finally {
			setEditorLoading(false);
		}
	};

	const closeEditor = () => {
		setEditing(null);
		setDraft(null);
		setOriginalPermissionIds([]);
		setPermQuery('');
	};

	const patchDraft = (patch: Partial<RoleDraft>) => setDraft((current) => (current ? { ...current, ...patch } : current));

	const togglePermission = (permissionId: string) => {
		if (!draft) return;
		const on = draft.permissionIds.includes(permissionId);
		patchDraft({ permissionIds: on ? draft.permissionIds.filter((id) => id !== permissionId) : [...draft.permissionIds, permissionId] });
	};

	const toggleRow = (permissionIds: string[]) => {
		if (!draft) return;
		const allOn = permissionIds.length > 0 && permissionIds.every((id) => draft.permissionIds.includes(id));
		patchDraft({
			permissionIds: allOn
				? draft.permissionIds.filter((id) => !permissionIds.includes(id))
				: Array.from(new Set([...draft.permissionIds, ...permissionIds])),
		});
	};

	const nameTrim = draft?.name.trim() ?? '';
	const nameTaken = creating && !!draft && roles.some((r) => r.name.trim().toLowerCase() === nameTrim.toLowerCase());
	const createOk = creating && !!draft && !!nameTrim && draft.permissionIds.length > 0 && !nameTaken;

	const added = draft ? draft.permissionIds.filter((id) => !originalPermissionIds.includes(id)).length : 0;
	const removed = draft ? originalPermissionIds.filter((id) => !draft.permissionIds.includes(id)).length : 0;
	const descriptionChanged = !!(draft && editingRole && draft.description !== (editingRole.description ?? ''));
	const nameChanged = !!(draft && editingRole && !editingRole.isSystem && draft.name.trim() !== editingRole.name);
	const editDirty = added > 0 || removed > 0 || descriptionChanged || nameChanged;
	const dirty = creating ? createOk : editDirty;
	const canSave = dirty && !saving && !editorLoading;

	const isEverything = !!draft && totalPermissions > 0 && draft.permissionIds.length === totalPermissions;
	const applyPreset = () => {
		if (!draft) return;
		if (isEverything) {
			patchDraft({ permissionIds: [] });
			say('All permissions cleared — not saved yet');
			return;
		}
		const readIds = catalogue.filter((p) => p.action === 'read').map((p) => p.id);
		patchDraft({ permissionIds: Array.from(new Set([...draft.permissionIds, ...readIds])) });
		say('View access granted across every area');
	};

	const save = async () => {
		if (!draft || !canSave) return;
		setSaving(true);
		try {
			if (creating) {
				const created = await rolesApi.create({ name: draft.name.trim(), description: draft.description.trim() || undefined });
				if (draft.permissionIds.length) await rolesApi.setPermissions(created.id, draft.permissionIds);
				say(`"${draft.name.trim()}" created with ${draft.permissionIds.length} permission${draft.permissionIds.length === 1 ? '' : 's'}`);
			} else if (draft.id) {
				const payload: { name?: string; description?: string } = { description: draft.description.trim() };
				if (!editingRole?.isSystem) payload.name = draft.name.trim();
				await rolesApi.update(draft.id, payload);
				await rolesApi.setPermissions(draft.id, draft.permissionIds);
				say(`Role saved · ${[added ? `+${added} granted` : '', removed ? `−${removed} revoked` : ''].filter(Boolean).join(', ') || 'details updated'}`);
			}
			closeEditor();
			await load();
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to save role');
		} finally {
			setSaving(false);
		}
	};

	const removeRole = async (role: RoleRow) => {
		if (role.isSystem) {
			say('System roles cannot be deleted');
			return;
		}
		if (role.userCount > 0) {
			say(`Cannot delete — ${role.userCount} ${role.userCount === 1 ? 'person holds' : 'people hold'} this role`);
			return;
		}
		try {
			await rolesApi.remove(role.id);
			say(`"${role.name}" deleted`);
			if (editing === role.id) closeEditor();
			await load();
		} catch (cause) {
			say(cause instanceof Error ? cause.message : 'Failed to delete role');
		}
	};

	return {
		loading, error, load, toast,
		roles, catalogue, totalPermissions,
		search, setSearch, kind, setKind,
		filtered,
		editing, editingRole, creating, draft, editorLoading,
		openCreate, openEdit, closeEditor, patchDraft,
		permQuery, setPermQuery, matrixGroups,
		togglePermission, toggleRow,
		nameTaken, createOk, added, removed, dirty, canSave, saving,
		isEverything, applyPreset,
		save, removeRole,
	};
}
