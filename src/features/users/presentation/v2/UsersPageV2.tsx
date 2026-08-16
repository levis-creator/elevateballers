import { Search, UserPlus, Users as UsersIcon } from 'lucide-react';
import './users-v2.css';
import {
	ALL_ROLES_OPTION,
	ALL_STATUSES_OPTION,
	ALL_TEAMS_OPTION,
	COACH_ROLE_NAME,
	SORT_OPTIONS,
	STATUS_OPTIONS,
	formatLastActive,
	getUserInitials,
	getUserStatus,
	hasAdminRole,
	type UserAccountRow,
} from '../../domain/entities/user-directory';
import { useUsersDirectory } from './hooks/useUsersDirectory';
import UserFormDrawer from './UserFormDrawer';

export default function UsersPageV2() {
	const directory = useUsersDirectory();

	if (directory.loading) return <div className="eb-users-loading"><div /><div /><div /></div>;
	if (directory.error) {
		return (
			<div className="eb-users-error">
				<strong>Unable to load users</strong>
				<span>{directory.error}</span>
				<button onClick={directory.load}>Try again</button>
			</div>
		);
	}

	const { filters, updateFilter, resetFilters } = directory;
	const hasChips = filters.search || filters.role !== ALL_ROLES_OPTION || filters.status !== ALL_STATUSES_OPTION || filters.team !== ALL_TEAMS_OPTION;
	const showTeamFilter = filters.role === COACH_ROLE_NAME;
	const allSelected = directory.filtered.length > 0 && directory.filtered.every((u) => directory.selected.has(u.id));

	return (
		<div className="eb-users-page">
			<header className="eb-users-heading">
				<div>
					<div className="eb-kicker">System</div>
					<h1>Users</h1>
					<p>People with access to the CMS. Roles decide what each one can reach — permissions themselves are defined in Roles &amp; Permissions.</p>
				</div>
				<button className="eb-primary-button" onClick={directory.openCreate}><UserPlus size={14} /> Invite user</button>
			</header>

			<div className="eb-users-counts">
				<CountCard label="Total" value={directory.counts.total} note="people with access" onClick={() => { updateFilter('role', ALL_ROLES_OPTION); updateFilter('status', ALL_STATUSES_OPTION); }} />
				<CountCard label="Active" value={directory.counts.active} note="signed in recently" onClick={() => updateFilter('status', 'Active')} />
				<CountCard label="Pending invites" value={directory.counts.pending} note="never signed in" accent={directory.counts.pending > 0} onClick={() => updateFilter('status', 'Pending')} />
				<CountCard label="Admins" value={directory.counts.admins} note="full access" onClick={() => { updateFilter('role', 'Admin'); updateFilter('status', ALL_STATUSES_OPTION); }} />
				<CountCard label="Team coaches" value={directory.counts.coaches} note="scoped to one club" onClick={() => { updateFilter('role', COACH_ROLE_NAME); updateFilter('status', ALL_STATUSES_OPTION); }} />
			</div>

			<div className="eb-users-toolbar-card">
				<div className="eb-users-toolbar">
					<label className="eb-users-search">
						<Search size={14} />
						<input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search by name or email…" />
					</label>
					<select className="eb-in" value={filters.role} onChange={(e) => updateFilter('role', e.target.value)}>
						{directory.roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
					</select>
					{showTeamFilter && (
						<select className="eb-in" value={filters.team} onChange={(e) => updateFilter('team', e.target.value)}>
							{directory.teamOptions.map((t) => <option key={t} value={t}>{t}</option>)}
						</select>
					)}
					<select className="eb-in" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
						{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
					</select>
					<select className="eb-in" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
						{SORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
					</select>
				</div>
				{hasChips && (
					<div className="eb-users-chips">
						<span>Filtering</span>
						{filters.search && <button onClick={() => updateFilter('search', '')}>&ldquo;{filters.search}&rdquo; ✕</button>}
						{filters.role !== ALL_ROLES_OPTION && <button onClick={() => updateFilter('role', ALL_ROLES_OPTION)}>{filters.role} ✕</button>}
						{filters.status !== ALL_STATUSES_OPTION && <button onClick={() => updateFilter('status', ALL_STATUSES_OPTION)}>{filters.status} ✕</button>}
						{filters.team !== ALL_TEAMS_OPTION && <button onClick={() => updateFilter('team', ALL_TEAMS_OPTION)}>{filters.team} ✕</button>}
						<button className="eb-users-clear-all" onClick={resetFilters}>Clear all</button>
					</div>
				)}
			</div>

			{directory.selected.size > 0 && (
				<div className="eb-bulk-bar">
					<strong>{directory.selected.size}</strong>
					<span>{directory.selected.size === 1 ? 'person selected' : 'people selected'}</span>
					{directory.bulkRoleId ? (
						<>
							<select className="eb-in eb-users-bulk-role-select" value={directory.bulkRoleId} onChange={(e) => directory.setBulkRoleId(e.target.value)}>
								{directory.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
							</select>
							<button onClick={directory.bulkApplyRole}>Apply</button>
							<button onClick={() => directory.setBulkRoleId('')}>Cancel</button>
						</>
					) : (
						<button onClick={() => directory.setBulkRoleId(directory.roles[0]?.id ?? '')}>Change role</button>
					)}
					<button onClick={directory.bulkSuspend}>Suspend</button>
					<button className="eb-bulk-clear" onClick={directory.clearSelection}>Clear</button>
				</div>
			)}

			<UsersTable directory={directory} allSelected={allSelected} />

			{directory.form && <UserFormDrawer directory={directory} />}
			{directory.toast && <div className="eb-users-toast">{directory.toast}</div>}
		</div>
	);
}

function CountCard({ label, value, note, accent, onClick }: { label: string; value: number; note: string; accent?: boolean; onClick: () => void }) {
	return (
		<button className={`eb-users-count-card${accent ? ' accent' : ''}`} onClick={onClick}>
			<span>{label}</span>
			<strong>{value}</strong>
			<small>{note}</small>
		</button>
	);
}

function UsersTable({ directory, allSelected }: { directory: ReturnType<typeof useUsersDirectory>; allSelected: boolean }) {
	if (directory.filtered.length === 0) {
		return (
			<div className="eb-users-empty">
				<UsersIcon size={26} />
				<strong>No people match</strong>
				<span>Nothing here matches those filters. Clear them, or invite someone new.</span>
				<div className="eb-users-empty-actions">
					<button className="eb-quiet-button" onClick={directory.resetFilters}>Clear filters</button>
					<button className="eb-primary-button" onClick={directory.openCreate}>Invite user</button>
				</div>
			</div>
		);
	}

	return (
		<div className="eb-users-table-wrap">
			<table className="eb-users-table">
				<thead>
					<tr>
						<th className="check"><button className={`eb-check${allSelected ? ' is-checked' : ''}`} onClick={directory.toggleAll} aria-label="Select all">{allSelected ? '✓' : ''}</button></th>
						<th>Person</th>
						<th>Roles</th>
						<th className="eb-hide-medium">Last active</th>
						<th>Status</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{directory.filtered.map((user) => <UserRow key={user.id} user={user} directory={directory} />)}
				</tbody>
			</table>
			<div className="eb-table-footer">
				<span>{directory.filtered.length} {directory.filtered.length === 1 ? 'person' : 'people'}{directory.filtered.length !== directory.users.length ? ` of ${directory.users.length}` : ''}</span>
			</div>
		</div>
	);
}

function UserRow({ user, directory }: { user: UserAccountRow; directory: ReturnType<typeof useUsersDirectory> }) {
	const status = getUserStatus(user);
	const selected = directory.selected.has(user.id);
	const isYou = user.id === directory.currentUserId;
	const scopeLine = user.roles.some((r) => r.name === COACH_ROLE_NAME) ? (user.coachTeams.map((t) => t.teamName).join(' · ') || 'No club assigned') : '';

	return (
		<tr className={selected ? 'selected' : ''}>
			<td className="check"><button className={`eb-check${selected ? ' is-checked' : ''}`} onClick={() => directory.toggleSelection(user.id)} aria-label="Select row">{selected ? '✓' : ''}</button></td>
			<td>
				<button className="eb-user-cell" onClick={() => directory.openEdit(user)}>
					<span className={`eb-user-avatar${hasAdminRole(user) ? ' admin' : ''}`}>{getUserInitials(user.name)}</span>
					<span className="eb-user-cell-copy">
						<span className="eb-user-name-row">
							<strong>{user.name}</strong>
							{isYou && <em>You</em>}
						</span>
						<small>{user.email}</small>
						{scopeLine && <small className="eb-user-scope">{scopeLine}</small>}
					</span>
				</button>
			</td>
			<td>
				<div className="eb-user-roles">
					{user.roles.length === 0
						? <span className="eb-role-chip muted">No role</span>
						: user.roles.map((r) => <span key={r.id} className={`eb-role-chip${r.name === 'Admin' ? ' admin' : ''}`}>{r.name}</span>)}
				</div>
			</td>
			<td className="eb-hide-medium"><span className="eb-user-mono">{formatLastActive(user.lastActive)}</span></td>
			<td><span className={`eb-user-status ${status.toLowerCase()}`}>{status}</span></td>
			<td className="actions">
				<div className="eb-users-row-actions">
					{status === 'Pending' && <button className="eb-detail-small-button" onClick={() => directory.sendReset(user.id, user.email)}>Resend</button>}
					<button className="eb-detail-small-button" onClick={() => directory.openEdit(user)}>Edit</button>
				</div>
			</td>
		</tr>
	);
}
