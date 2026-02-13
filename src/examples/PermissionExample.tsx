/**
 * Permission System Usage Examples
 *
 * This file demonstrates how to use the permission system in your components.
 * Copy these patterns to your own components.
 */

import { usePermissions, Can, HasRole } from '@/features/rbac';

/**
 * Example 1: Basic Permission Checking with Hooks
 */
export function NewsArticleEditor() {
  const { canEdit, canDelete, canCreate, loading } = usePermissions();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="article-editor">
      <h2>News Article</h2>

      {/* Show create button only if user can create */}
      {canCreate('news_articles') && (
        <button className="btn-primary">Create New Article</button>
      )}

      {/* Show edit button only if user can edit */}
      {canEdit('news_articles') && (
        <button className="btn-secondary">Edit Article</button>
      )}

      {/* Show delete button only if user can delete */}
      {canDelete('news_articles') && (
        <button className="btn-danger">Delete Article</button>
      )}
    </div>
  );
}

/**
 * Example 2: Using the Can Component (Declarative)
 */
export function TeamManagement() {
  return (
    <div className="team-management">
      <h2>Team Management</h2>

      {/* Declarative permission checking */}
      <Can action="create" resource="teams">
        <button>Add New Team</button>
      </Can>

      <Can action="approve" resource="teams">
        <button>Approve Teams</button>
      </Can>

      <Can action="bulk_delete" resource="teams">
        <button className="danger">Bulk Delete</button>
      </Can>

      {/* With fallback message */}
      <Can
        action="view"
        resource="analytics"
        fallback={<div className="upgrade-notice">Upgrade to view analytics</div>}
      >
        <div className="analytics-panel">
          <h3>Team Analytics</h3>
          {/* Analytics content */}
        </div>
      </Can>
    </div>
  );
}

/**
 * Example 3: Laravel-Style Permission Checking
 */
export function MediaLibrary() {
  const { can } = usePermissions();

  return (
    <div className="media-library">
      <h2>Media Library</h2>

      {/* Laravel-style: can(action, resource) */}
      {can('upload', 'media') && (
        <button>Upload Media</button>
      )}

      {can('batch_upload', 'media') && (
        <button>Batch Upload</button>
      )}

      {/* Or use direct format: can('resource:action') */}
      {can('media:export') && (
        <button>Export as ZIP</button>
      )}

      {can('media:cleanup') && (
        <button className="danger">Run Cleanup</button>
      )}
    </div>
  );
}

/**
 * Example 4: Role-Based Rendering
 */
export function AdminDashboard() {
  const { isAdmin, hasRole, hasAnyRole } = usePermissions();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Admin-only section */}
      {isAdmin && (
        <div className="admin-section">
          <h2>Admin Tools</h2>
          <button>Manage Users</button>
          <button>Manage Roles</button>
          <button>System Settings</button>
        </div>
      )}

      {/* Editor section */}
      {hasRole('Editor') && (
        <div className="editor-section">
          <h2>Content Tools</h2>
          <button>Manage Articles</button>
        </div>
      )}

      {/* Content Manager or Editor */}
      {hasAnyRole(['Content Manager', 'Editor']) && (
        <div className="content-section">
          <h2>Content Management</h2>
          <button>Manage Media</button>
          <button>Manage Pages</button>
        </div>
      )}

      {/* Using HasRole component */}
      <HasRole role="Statistician">
        <div className="stats-section">
          <h2>Statistics Tools</h2>
          <button>Track Match</button>
          <button>View Reports</button>
        </div>
      </HasRole>
    </div>
  );
}

/**
 * Example 5: Complex Permission Logic
 */
export function UserManagement() {
  const { can, canAny, canAll, user } = usePermissions();

  // Check if user can do any moderation action
  const canModerate = canAny([
    'users:edit',
    'users:delete',
    'users:manage_roles',
  ]);

  // Check if user has full user management permissions
  const canFullyManage = canAll([
    'users:create',
    'users:edit',
    'users:delete',
    'users:manage_roles',
  ]);

  return (
    <div className="user-management">
      <h2>User Management</h2>

      {/* Show moderation tools if user can moderate */}
      {canModerate && (
        <div className="moderation-tools">
          <h3>Moderation</h3>
          {can('users:edit') && <button>Edit Users</button>}
          {can('users:delete') && <button>Delete Users</button>}
          {can('users:manage_roles') && <button>Assign Roles</button>}
        </div>
      )}

      {/* Show full management tools only if user has all permissions */}
      {canFullyManage && (
        <div className="full-management">
          <h3>Full User Management</h3>
          <button>Create User</button>
          <button>Import Users</button>
          <button>Export Users</button>
        </div>
      )}

      {/* Display current user info */}
      {user && (
        <div className="user-info">
          <p>Logged in as: {user.name}</p>
          <p>Roles: {user.roles.map(r => r.name).join(', ')}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Conditional Navigation Menu
 */
export function NavigationMenu() {
  const { can, hasAnyRole, isAdmin } = usePermissions();

  return (
    <nav className="nav-menu">
      <ul>
        <li><a href="/">Home</a></li>

        {/* Show teams link if user can view teams */}
        {can('teams:read') && (
          <li><a href="/teams">Teams</a></li>
        )}

        {/* Show matches link if user can view matches */}
        {can('matches:read') && (
          <li><a href="/matches">Matches</a></li>
        )}

        {/* Show news link if user can view or edit news */}
        {(can('news_articles:read') || can('news_articles:edit')) && (
          <li><a href="/news">News</a></li>
        )}

        {/* Show admin link only for admins */}
        {isAdmin && (
          <li><a href="/admin">Admin Panel</a></li>
        )}

        {/* Show content tools for content managers */}
        {hasAnyRole(['Admin', 'Editor', 'Content Manager']) && (
          <li><a href="/content">Content</a></li>
        )}
      </ul>
    </nav>
  );
}

/**
 * Example 7: Form with Permission-Based Fields
 */
export function TeamForm() {
  const { can, canEdit, loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form className="team-form">
      <h2>Team Information</h2>

      {/* Basic fields always visible */}
      <input type="text" placeholder="Team Name" />
      <input type="text" placeholder="Nickname" />

      {/* Advanced fields only for users with edit permission */}
      {canEdit('teams') && (
        <>
          <textarea placeholder="Description" />
          <input type="file" />
        </>
      )}

      {/* Approval field only for users with approve permission */}
      {can('teams:approve') && (
        <label>
          <input type="checkbox" />
          Approved
        </label>
      )}

      {/* Submit button with appropriate text */}
      <button type="submit">
        {canEdit('teams') ? 'Save Team' : 'Request Team Creation'}
      </button>
    </form>
  );
}

/**
 * Example 8: Table with Conditional Action Buttons
 */
export function TeamsTable({ teams }: { teams: any[] }) {
  const { canEdit, canDelete, can } = usePermissions();

  return (
    <table className="teams-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {teams.map(team => (
          <tr key={team.id}>
            <td>{team.name}</td>
            <td>{team.approved ? 'Approved' : 'Pending'}</td>
            <td className="actions">
              {/* View button (always shown) */}
              <button>View</button>

              {/* Edit button (only if can edit) */}
              {canEdit('teams') && (
                <button>Edit</button>
              )}

              {/* Approve button (only if can approve and team is not approved) */}
              {can('teams:approve') && !team.approved && (
                <button className="approve">Approve</button>
              )}

              {/* Delete button (only if can delete) */}
              {canDelete('teams') && (
                <button className="danger">Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
