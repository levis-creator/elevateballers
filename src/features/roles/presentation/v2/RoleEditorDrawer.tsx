import { Search } from 'lucide-react';
import { STANDARD_ACTIONS, humanizeAction, type MatrixRow } from '../../domain/entities/role-editor';
import type { useRolesDirectory } from './hooks/useRolesDirectory';

export default function RoleEditorDrawer({ directory }: { directory: ReturnType<typeof useRolesDirectory> }) {
	const { draft, creating, editingRole, editorLoading } = directory;
	const isSystem = !creating && !!editingRole?.isSystem;

	return (
		<div className="eb-roles-drawer-overlay">
			<div className="eb-roles-drawer-scrim" onClick={directory.closeEditor} />
			<div className="eb-roles-drawer">
				<div className="eb-roles-drawer-head">
					<div>
						<div className="eb-kicker">{creating ? 'New role' : isSystem ? 'System role' : 'Custom role'}</div>
						<div className="eb-roles-drawer-title-row">
							<span className="eb-roles-drawer-title">{draft ? (draft.name || (creating ? 'Name this role' : 'Untitled role')) : 'Loading…'}</span>
						</div>
						<div className="eb-roles-drawer-note">
							{creating
								? 'Start from nothing, or grant view-only and add from there. You can assign it to people once it is saved.'
								: editorLoading
									? ''
									: editingRole && editingRole.userCount === 0
										? 'Nobody holds this role yet.'
										: editingRole
											? `Held by ${editingRole.userCount} ${editingRole.userCount === 1 ? 'person' : 'people'} — changes apply to them immediately.`
											: ''}
						</div>
					</div>
					<button className="eb-detail-icon-button" aria-label="Close" onClick={directory.closeEditor}>✕</button>
				</div>

				{isSystem && (
					<div className="eb-roles-lock-notice">
						This role ships with the CMS — its name can't be changed, but you can still edit its description and permissions. Changes apply to everyone who holds it.
					</div>
				)}

				{editorLoading || !draft ? (
					<div className="eb-roles-drawer-loading"><div /><div /><div /></div>
				) : (
					<>
						<div className="eb-roles-drawer-body">
							<div className="eb-roles-grid-2">
								<label className="eb-roles-field">
									<span>Role name</span>
									<input
										className="eb-in"
										value={draft.name}
										onChange={(e) => directory.patchDraft({ name: e.target.value })}
										placeholder="Team Coach"
										disabled={isSystem}
									/>
									{directory.nameTaken && <small className="eb-roles-field-error">That name is already in use.</small>}
									{isSystem && <small className="eb-roles-name-locked">System role names can't be changed.</small>}
								</label>
								<label className="eb-roles-field">
									<span>What it is for</span>
									<input className="eb-in" value={draft.description} onChange={(e) => directory.patchDraft({ description: e.target.value })} placeholder="Manages one or two clubs" />
								</label>
							</div>

							<div className="eb-roles-matrix-toolbar">
								<label className="eb-roles-search eb-roles-matrix-search">
									<Search size={14} />
									<input value={directory.permQuery} onChange={(e) => directory.setPermQuery(e.target.value)} placeholder="Filter permissions…" />
								</label>
								<button className="eb-quiet-button" onClick={directory.applyPreset}>{directory.isEverything ? 'Clear everything' : 'Grant view-only'}</button>
								<span className="eb-roles-perm-summary">{draft.permissionIds.length} of {directory.totalPermissions} granted</span>
							</div>

							<PermissionMatrix directory={directory} />
						</div>

						<div className="eb-roles-drawer-foot">
							<span className={`eb-roles-diff-note${directory.dirty ? ' active' : ''}`}>
								{creating
									? (directory.nameTaken ? `A role called "${draft.name.trim()}" already exists`
										: !draft.name.trim() ? 'Name the role to continue'
											: !draft.permissionIds.length ? 'Grant at least one permission'
												: `${draft.permissionIds.length} permissions granted`)
									: (directory.dirty
										? [directory.added ? `+${directory.added} granted` : '', directory.removed ? `−${directory.removed} revoked` : ''].filter(Boolean).join(' · ') || 'details edited'
										: 'No changes yet')}
							</span>
							<div className="eb-roles-drawer-foot-actions">
								<button className="eb-quiet-button" onClick={directory.closeEditor}>Cancel</button>
								<button className="eb-primary-button" disabled={!directory.canSave} onClick={directory.save}>{directory.saving ? 'Saving…' : creating ? 'Create role' : 'Save role'}</button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function PermissionMatrix({ directory }: { directory: ReturnType<typeof useRolesDirectory> }) {
	const { draft, matrixGroups } = directory;
	if (!draft) return null;

	const has = (id: string) => draft.permissionIds.includes(id);

	return (
		<div className="eb-roles-matrix">
			<div className="eb-roles-matrix-head">
				<span>Area</span>
				{STANDARD_ACTIONS.map((action) => {
					const idsForAction = matrixGroups.flatMap((g) => g.rows.map((r) => r.standard[action.key]?.id).filter((id): id is string => !!id));
					const allOn = idsForAction.length > 0 && idsForAction.every(has);
					return (
						<button
							key={action.key}
							className={`eb-roles-matrix-col-toggle${allOn ? ' on' : ''}`}
							title={`${allOn ? 'Remove' : 'Grant'} ${action.label.toLowerCase()} everywhere shown`}
							onClick={() => directory.toggleRow(idsForAction)}
						>
							{action.label}
						</button>
					);
				})}
			</div>

			{matrixGroups.length === 0 ? (
				<div className="eb-roles-matrix-empty">No area matches "{directory.permQuery.trim()}".</div>
			) : (
				matrixGroups.map((group) => (
					<div key={group.category} className="eb-roles-matrix-group">
						<div className="eb-roles-matrix-group-label">{group.category}</div>
						{group.rows.map((row) => <MatrixRowView key={row.resource} row={row} directory={directory} />)}
					</div>
				))
			)}
		</div>
	);
}

function MatrixRowView({ row, directory }: { row: MatrixRow; directory: ReturnType<typeof useRolesDirectory> }) {
	const { draft } = directory;
	if (!draft) return null;
	const has = (id: string) => draft.permissionIds.includes(id);
	const standardIds = STANDARD_ACTIONS.map((a) => row.standard[a.key]?.id).filter((id): id is string => !!id);
	const owned = standardIds.filter(has).length;
	const allOn = standardIds.length > 0 && owned === standardIds.length;

	return (
		<div className="eb-roles-matrix-row">
			<button className="eb-roles-matrix-row-label" onClick={() => directory.toggleRow(standardIds)}>
				<strong>{row.label}</strong>
				<span className={allOn ? 'full' : ''}>{owned}/{standardIds.length}</span>
			</button>
			{STANDARD_ACTIONS.map((action) => {
				const perm = row.standard[action.key];
				if (!perm) return <span key={action.key} className="eb-roles-matrix-cell absent">–</span>;
				const on = has(perm.id);
				return (
					<span key={action.key} className="eb-roles-matrix-cell">
						<button className={`eb-roles-matrix-check${on ? ' on' : ''}`} title={`${row.resource}:${perm.action}`} onClick={() => directory.togglePermission(perm.id)}>{on ? '✓' : ''}</button>
					</span>
				);
			})}
			{row.extras.length > 0 && (
				<div className="eb-roles-matrix-extras">
					{row.extras.map((extra) => (
						<button key={extra.id} className={`eb-roles-extra-chip${has(extra.id) ? ' on' : ''}`} title={extra.description ?? `${row.resource}:${extra.action}`} onClick={() => directory.togglePermission(extra.id)}>
							{humanizeAction(extra.action)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
