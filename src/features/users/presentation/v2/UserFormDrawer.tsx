import { formatDate, formatLastActive, isAdminRole, isCoachRole, MAX_COACH_TEAMS } from '../../domain/entities/user-directory';
import type { useUsersDirectory } from './hooks/useUsersDirectory';

export default function UserFormDrawer({ directory }: { directory: ReturnType<typeof useUsersDirectory> }) {
	const { draft, form, roles } = directory;
	if (!draft) return null;
	const isEdit = form === 'edit';
	const hasAdminSelected = draft.roleIds.some((id) => roles.find((r) => r.id === id && isAdminRole(r)));
	const isLastAdminAccount = isEdit && !!draft.id && directory.isLastAdmin({ id: draft.id, roles: roles.filter((r) => draft.roleIds.includes(r.id)) });
	const pickedTeams = draft.teamIds.map((id) => directory.teams.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => !!t);

	return (
		<div className="eb-users-drawer-overlay">
			<div className="eb-users-drawer-scrim" onClick={directory.closeForm} />
			<div className="eb-users-drawer">
				<div className="eb-users-drawer-head">
					<div>
						<div className="eb-kicker">{isEdit ? 'Edit user' : 'New user'}</div>
						<div className="eb-users-drawer-title">{isEdit ? (`${draft.first} ${draft.last}`.trim() || 'Edit user') : 'Invite a user'}</div>
						<div className="eb-users-drawer-note">{isEdit ? 'Changes are logged in Audit Logs.' : 'They receive an email invite and set their own password.'}</div>
					</div>
					<button className="eb-detail-icon-button" aria-label="Close" onClick={directory.closeForm}>✕</button>
				</div>

				<div className="eb-users-drawer-body">
					<div className="eb-users-section-label">Identity</div>
					<div className="eb-users-grid-2">
						<label className="eb-users-field"><span>First name</span><input className="eb-in" value={draft.first} onChange={(e) => directory.patchDraft({ first: e.target.value })} placeholder="Vivian" /></label>
						<label className="eb-users-field"><span>Last name</span><input className="eb-in" value={draft.last} onChange={(e) => directory.patchDraft({ last: e.target.value })} placeholder="Akinyi" /></label>
					</div>
					<label className="eb-users-field">
						<span>Email</span>
						<input className="eb-in" type="email" value={draft.email} onChange={(e) => directory.patchDraft({ email: e.target.value })} placeholder="name@elevateballers.com" />
						{draft.email && (directory.dupe || !directory.emailOk) && (
							<small className="eb-users-field-error">{directory.dupe ? 'Another user already has this email.' : 'That does not look like a valid email.'}</small>
						)}
					</label>
					<label className="eb-users-field">
						<span>Phone <em>· optional</em></span>
						<input className="eb-in" value={draft.phone} onChange={(e) => directory.patchDraft({ phone: e.target.value })} placeholder="0703 913 923" />
					</label>

					<div className="eb-users-section-head">
						<span className="eb-users-section-label">Roles</span>
						<span className={`eb-users-hint${draft.roleIds.length ? '' : ' error'}`}>{draft.roleIds.length ? `${draft.roleIds.length} selected` : 'Pick at least one'}</span>
					</div>
					<div className="eb-users-role-list">
						{roles.map((role) => {
							const on = draft.roleIds.includes(role.id);
							return (
								<button key={role.id} type="button" className={`eb-users-role-card${on ? ' on' : ''}`} onClick={() => directory.toggleDraftRole(role.id)}>
									<span className={`eb-users-role-box${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
									<span className="eb-users-role-copy">
										<span className="eb-users-role-top">
											<span className="eb-users-role-name">{role.name}</span>
											{isAdminRole(role) && <span className="eb-users-role-badge">Full access</span>}
											{isCoachRole(role) && <span className="eb-users-role-badge">Team only</span>}
										</span>
										<span className="eb-users-role-desc">{role.description || 'No description set for this role.'}</span>
									</span>
								</button>
							);
						})}
					</div>
					{hasAdminSelected && (
						<div className="eb-users-warning">Admin includes every other role — it can manage users, change settings and delete records. Only give it to people who need all of that.</div>
					)}

					{directory.draftIsCoach && (
						<>
							<div className="eb-users-section-head">
								<span className="eb-users-section-label">Team</span>
								<span className={`eb-users-hint${directory.scopeOk ? '' : ' error'}`}>{draft.teamIds.length ? `${draft.teamIds.length} of ${MAX_COACH_TEAMS} clubs` : `Pick 1 or ${MAX_COACH_TEAMS}`}</span>
							</div>
							<div className="eb-users-team-picker">
								<span className="eb-users-team-picker-label">Clubs they coach</span>
								{pickedTeams.length > 0 && (
									<div className="eb-users-team-chips">
										{pickedTeams.map((t) => (
											<button key={t.id} onClick={() => directory.toggleDraftTeam(t.id)}>{t.name} <span>✕</span></button>
										))}
									</div>
								)}
								<div className="eb-users-team-search">
									<input value={directory.teamQuery} onChange={(e) => directory.setTeamQuery(e.target.value)} placeholder={draft.teamIds.length >= MAX_COACH_TEAMS ? `Limit of ${MAX_COACH_TEAMS} clubs reached` : `Search ${directory.teams.length} clubs…`} />
									{directory.teamQuery && <button onClick={() => directory.setTeamQuery('')} aria-label="Clear">✕</button>}
								</div>
								{directory.teamResults.length > 0 && (
									<div className="eb-users-team-results">
										{directory.teamResults.map((t) => {
											const on = draft.teamIds.includes(t.id);
											const disabled = !on && draft.teamIds.length >= MAX_COACH_TEAMS;
											return (
												<button key={t.id} disabled={disabled} className={`eb-users-team-result${on ? ' on' : ''}`} onClick={() => directory.toggleDraftTeam(t.id)}>
													<span className={`eb-users-role-box${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
													<span>{t.name}</span>
													{t.league && <em>{t.league}</em>}
												</button>
											);
										})}
									</div>
								)}
								<p className="eb-users-team-note">A coach sees only the clubs listed above, and can hold at most {MAX_COACH_TEAMS}. Access follows each club's registration.</p>
							</div>
						</>
					)}

					<div className="eb-users-section-label eb-users-section-label-spaced">Security</div>
					<div className="eb-users-panel">
						<div className="eb-users-panel-row">
							<span>Email OTP sign-in</span>
							<span className="eb-users-pill">Required</span>
						</div>
						<p>Every admin sign-in requires a one-time code sent by email — it applies to all accounts and cannot be switched off per person.</p>
					</div>

					<div className="eb-users-section-label eb-users-section-label-spaced">Notifications</div>
					<div className="eb-users-toggle-row">
						<button type="button" className={`eb-users-switch${draft.notifyEmail ? ' on' : ''}`} onClick={() => directory.patchDraft({ notifyEmail: !draft.notifyEmail })}><span /></button>
						<span>
							<strong>Email notifications</strong>
							<small>Receives match reminders and system alerts for their roles.</small>
						</span>
					</div>

					{isEdit && (
						<div className="eb-users-panel eb-users-account-panel">
							<div className="eb-users-section-label">Account</div>
							<div className="eb-users-grid-2 eb-users-facts">
								<div><span>Status</span><strong>{draft.active ? (draft.activatedAt ? 'Active' : 'Pending') : 'Suspended'}</strong></div>
								<div><span>Last active</span><strong>{formatLastActive(draft.lastActive)}</strong></div>
								<div><span>Created</span><strong>{draft.createdAt ? formatDate(draft.createdAt) : '—'}</strong></div>
								<div><span>Sign-ins</span><strong>{draft.signIns}</strong></div>
							</div>
							<div className="eb-users-account-actions">
								<button className="eb-quiet-button" onClick={() => draft.id && directory.sendReset(draft.id, draft.email)}>Send password reset</button>
								<button className="eb-quiet-button" onClick={() => directory.patchDraft({ active: !draft.active })}>{draft.active ? 'Suspend account' : 'Reactivate account'}</button>
								<button className="eb-users-danger-button" disabled={isLastAdminAccount} onClick={directory.removeUser}>Remove user</button>
							</div>
							{isLastAdminAccount && <div className="eb-users-account-note">This is the last admin account — removing it would lock everyone out.</div>}
						</div>
					)}
				</div>

				<div className="eb-users-drawer-foot">
					<span className="eb-users-save-hint">
						{directory.canSave
							? (isEdit ? 'Saves immediately' : 'Sends an invite email')
							: (directory.draftIsCoach && !directory.scopeOk ? `A ${directory.COACH_ROLE_NAME} must be tied to at least one club` : 'Name, a valid email and one role are required')}
					</span>
					<div className="eb-users-drawer-foot-actions">
						<button className="eb-quiet-button" onClick={directory.closeForm}>Cancel</button>
						<button className="eb-primary-button" disabled={!directory.canSave} onClick={directory.save}>{directory.saving ? 'Saving…' : isEdit ? 'Save changes' : 'Send invite'}</button>
					</div>
				</div>
			</div>
		</div>
	);
}
