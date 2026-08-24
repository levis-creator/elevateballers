import { Lock, Plus, Search } from 'lucide-react';
import './roles-v2.css';
import { PermissionProvider } from '@/features/rbac/usePermissions';
import { ROLE_KIND_FILTERS, type RoleRow } from '../../domain/entities/role-editor';
import { useRolesDirectory } from './hooks/useRolesDirectory';
import RoleEditorDrawer from './RoleEditorDrawer';
import PermissionSyncPanel from './PermissionSyncPanel';

export default function RolesPageV2() {
	return (
		<PermissionProvider>
			<RolesPageContent />
		</PermissionProvider>
	);
}

function RolesPageContent() {
	const directory = useRolesDirectory();

	if (directory.loading) return <div className="eb-roles-loading"><div /><div /><div /></div>;
	if (directory.error) {
		return (
			<div className="eb-roles-error">
				<strong>Unable to load roles</strong>
				<span>{directory.error}</span>
				<button onClick={directory.load}>Try again</button>
			</div>
		);
	}

	return (
		<div className="eb-roles-page">
			<header className="eb-roles-heading">
				<div>
					<div className="eb-kicker">System</div>
					<h1>Roles &amp; Permissions</h1>
					<p>A role is a named bundle of permissions. Change one and everyone holding it is affected immediately.</p>
				</div>
				<button className="eb-primary-button" onClick={directory.openCreate}><Plus size={14} /> Create role</button>
			</header>

			<div className="eb-roles-toolbar">
				<label className="eb-roles-search">
					<Search size={14} />
					<input value={directory.search} onChange={(e) => directory.setSearch(e.target.value)} placeholder="Search roles by name or what they do…" />
				</label>
				<div className="eb-roles-kind-tabs">
					{ROLE_KIND_FILTERS.map((k) => (
						<button key={k} className={directory.kind === k ? 'active' : ''} onClick={() => directory.setKind(k)}>{k}</button>
					))}
				</div>
			</div>

			<RolesTable directory={directory} />

			<PermissionSyncPanel />

			<p className="eb-roles-footnote">System roles ship with the CMS — their name can't be changed, but permissions can. Custom roles are yours to rename or remove.</p>

			{directory.editing && <RoleEditorDrawer directory={directory} />}
			{directory.toast && <div className="eb-roles-toast">{directory.toast}</div>}
		</div>
	);
}

function RolesTable({ directory }: { directory: ReturnType<typeof useRolesDirectory> }) {
	if (directory.filtered.length === 0) {
		return (
			<div className="eb-roles-empty">
				<Lock size={26} />
				<strong>No roles match</strong>
				<span>Nothing here matches that search.</span>
			</div>
		);
	}

	return (
		<div className="eb-roles-table-wrap">
			<table className="eb-roles-table">
				<thead>
					<tr>
						<th>Role</th>
						<th>Can do</th>
						<th>Held by</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{directory.filtered.map((role) => <RoleRowView key={role.id} role={role} directory={directory} />)}
				</tbody>
			</table>
		</div>
	);
}

function RoleRowView({ role, directory }: { role: RoleRow; directory: ReturnType<typeof useRolesDirectory> }) {
	const total = directory.totalPermissions;
	const pct = total > 0 ? Math.round((role.permissionCount / total) * 100) : 0;
	const full = total > 0 && role.permissionCount === total;

	return (
		<tr>
			<td>
				<button className="eb-role-cell" onClick={() => directory.openEdit(role)}>
					<span className={`eb-role-dot${full ? ' full' : role.permissionCount === 0 ? ' empty' : ''}`} />
					<span className="eb-role-cell-copy">
						<span className="eb-role-name-row">
							<strong>{role.name}</strong>
							{!role.isSystem && <em>Custom</em>}
						</span>
					</span>
				</button>
			</td>
			<td>
				<span className="eb-role-desc">{role.description}</span>
				<span className="eb-role-bar-row">
					<span className="eb-role-bar-track"><span className={`eb-role-bar-fill${full ? ' full' : ''}`} style={{ width: `${Math.max(pct, role.permissionCount ? 2 : 0)}%` }} /></span>
					<span className={`eb-role-bar-note${full ? ' full' : ''}`}>{full ? 'Everything' : `${role.permissionCount} of ${total}`}</span>
				</span>
			</td>
			<td><span className={`eb-role-users${role.userCount === 0 ? ' empty' : ''}`}>{role.userCount === 0 ? 'Nobody yet' : `${role.userCount} ${role.userCount === 1 ? 'person' : 'people'}`}</span></td>
			<td className="actions">
				<div className="eb-roles-row-actions">
					<button className="eb-detail-small-button" onClick={() => directory.openEdit(role)}>{role.isSystem ? 'View' : 'Edit'}</button>
					{!role.isSystem && <button className="eb-detail-small-button danger" onClick={() => directory.removeRole(role)}>Delete</button>}
				</div>
			</td>
		</tr>
	);
}
