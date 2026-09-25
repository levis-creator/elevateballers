/**
 * Plain-English wording for the codes stored in a player's roster history
 * (season_roster_history.action) and in the audit log, for the admin player page.
 */

const ROSTER_ACTIONS: Record<string, string> = {
  ROSTER_ADDED: 'Registered',
  ROSTER_PROPOSED: 'Proposed by coach',
  ROSTER_EDIT_PROPOSED: 'Edit proposed by coach',
  ROSTER_EDITED: 'Details edited',
  ROSTER_APPROVED: 'Approved',
  ROSTER_REJECTED: 'Rejected',
  ROSTER_EDIT_REJECTED: 'Edit declined',
  ROSTER_REMOVAL_PROPOSED: 'Removal requested by coach',
  ROSTER_REMOVAL_APPROVED: 'Removal approved',
  ROSTER_REMOVAL_REJECTED: 'Removal declined',
  ROSTER_WITHDRAWN: 'Removed from roster',
  ROSTER_DROPPED_OUT: 'Dropped out of the league',
  ROSTER_REINSTATED: 'Reinstated',
  TRANSFER_OUT: 'Transferred out',
  TRANSFER_IN: 'Transferred in',
};

/** Turns an unknown code like `SOME_NEW_ACTION` into "Some new action". */
function humanize(code: string): string {
  const text = code.toLowerCase().replace(/_/g, ' ').trim();
  return text ? text[0].toUpperCase() + text.slice(1) : '';
}

export function rosterActionLabel(action: string | null | undefined): string {
  if (!action) return '';
  return ROSTER_ACTIONS[action] ?? humanize(action);
}

const REQUEST_TYPES: Record<string, string> = {
  NEW: 'new player',
  EDIT: 'player edit',
  REMOVAL: 'removal',
  DROPOUT: 'dropout report',
};

const AUDIT_ACTIONS: Record<string, string> = {
  PLAYER_CREATED: 'created this player',
  PLAYER_UPDATED: 'updated this player',
  PLAYER_DELETED: 'deleted this player',
  PLAYER_APPROVED: 'approved this player',
  PLAYER_UNAPPROVED: 'revoked approval',
  PLAYER_REGISTRATION_SUBMITTED: 'submitted a registration',
  PLAYER_SUSPENDED: 'suspended this player',
  PLAYER_SUSPENSION_LIFTED: 'lifted a suspension',
  PLAYER_INJURY_REPORTED: 'marked this player injured',
  PLAYER_MARKED_FIT: 'marked this player fit',
  PLAYER_DROPPED_OUT: 'marked this player as dropped out',
  PLAYER_REINSTATED: 'reinstated this player',
  SEASON_ROSTER_PLAYER_ADDED: 'added this player to a season roster',
  SEASON_TRANSFER_REQUESTED: 'requested a transfer',
  SEASON_TRANSFER_APPROVED: 'approved a transfer',
  TEAM_PORTAL_ROSTER_PLAYER_PROPOSED: 'proposed this player for the roster',
  TEAM_PORTAL_ROSTER_PLAYER_EDITED: 'proposed changes to this player',
  TEAM_PORTAL_ROSTER_REMOVAL_REQUESTED: 'requested removal from the roster',
  TEAM_PORTAL_ROSTER_DROPOUT_REPORTED: 'reported that this player dropped out',
};

/** A sentence fragment for an audit-log row, e.g. "approved the coach's dropout report". */
export function activityLabel(item: { action?: string | null; metadata?: any }): string {
  const action = item.action ?? '';
  const meta = item.metadata ?? {};
  if (action === 'ROSTER_REQUEST_APPROVED' || action === 'ROSTER_REQUEST_REJECTED') {
    const what = REQUEST_TYPES[meta.type] ?? 'roster request';
    return `${action.endsWith('APPROVED') ? 'approved' : 'declined'} the coach's ${what}`;
  }
  if (action.startsWith('SEASON_ROSTER_') && action !== 'SEASON_ROSTER_PLAYER_ADDED')
    return `set season roster status to ${action.slice('SEASON_ROSTER_'.length).toLowerCase()}`;
  const base = AUDIT_ACTIONS[action] ?? humanize(action).toLowerCase();
  const detail = meta.reason || meta.note;
  const matches = action === 'PLAYER_SUSPENDED' && meta.matchCount ? ` for ${meta.matchCount} match${meta.matchCount === 1 ? '' : 'es'}` : '';
  return `${base}${matches}${detail ? ` — “${detail}”` : ''}`;
}
