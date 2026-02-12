import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Can, CanView, CanCreate, CanEdit, CanDelete, IsAdmin } from '../PermissionGate';

/**
 * Example component demonstrating the UI permissions system
 * This shows various ways to use permissions in your components
 */
export function PermissionsExample() {
  const permissions = usePermissions();

  // Handle loading state
  if (permissions.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading permissions...</span>
      </div>
    );
  }

  // Handle authentication
  if (!permissions.isAuthenticated()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to access this content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Permissions System Examples</h1>

      {/* User Info Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {permissions.getUser()?.name}</p>
          <p><strong>Email:</strong> {permissions.getUser()?.email}</p>
          <p><strong>Roles:</strong> {permissions.getAllRoles().map(r => r.name).join(', ')}</p>
          <p><strong>Is Admin:</strong> {permissions.isAdmin() ? 'Yes' : 'No'}</p>
          <p><strong>Is Super Admin:</strong> {permissions.isSuperAdmin() ? 'Yes' : 'No'}</p>
        </div>
      </section>

      {/* Hook-based Permission Checks */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Hook-based Permission Checks</h2>
        <div className="space-y-3">
          {/* News permissions */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-gray-900">News Permissions</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li className={permissions.canView('news') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can View: {permissions.canView('news') ? 'Yes' : 'No'}
              </li>
              <li className={permissions.canCreate('news') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can Create: {permissions.canCreate('news') ? 'Yes' : 'No'}
              </li>
              <li className={permissions.canEdit('news') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can Edit: {permissions.canEdit('news') ? 'Yes' : 'No'}
              </li>
              <li className={permissions.canDelete('news') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can Delete: {permissions.canDelete('news') ? 'Yes' : 'No'}
              </li>
              <li className={permissions.canPublish('news') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can Publish: {permissions.canPublish('news') ? 'Yes' : 'No'}
              </li>
            </ul>
          </div>

          {/* Team permissions */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium text-gray-900">Team Permissions</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li className={permissions.canView('teams') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can View: {permissions.canView('teams') ? 'Yes' : 'No'}
              </li>
              <li className={permissions.canEdit('teams') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can Edit: {permissions.canEdit('teams') ? 'Yes' : 'No'}
              </li>
              <li className={permissions.canManage('teams') ? 'text-green-600' : 'text-red-600'}>
                ✓ Can Manage: {permissions.canManage('teams') ? 'Yes' : 'No'}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Component-based Permission Gates */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Component-based Permission Gates</h2>
        
        <div className="space-y-4">
          {/* News Actions */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">News Actions</h3>
            <div className="flex flex-wrap gap-2">
              <CanView resource="news">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  View News
                </button>
              </CanView>

              <CanCreate resource="news">
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Create News
                </button>
              </CanCreate>

              <CanEdit resource="news">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Edit News
                </button>
              </CanEdit>

              <CanDelete resource="news">
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Delete News
                </button>
              </CanDelete>

              <Can resource="news" action="publish">
                <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                  Publish News
                </button>
              </Can>
            </div>
          </div>

          {/* Team Actions */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Team Actions</h3>
            <div className="flex flex-wrap gap-2">
              <CanView resource="teams">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  View Teams
                </button>
              </CanView>

              <CanCreate resource="teams">
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Create Team
                </button>
              </CanCreate>

              <CanEdit resource="teams">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Edit Team
                </button>
              </CanEdit>

              <CanDelete resource="teams">
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Delete Team
                </button>
              </CanDelete>
            </div>
          </div>

          {/* Player Actions */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Player Actions</h3>
            <div className="flex flex-wrap gap-2">
              <CanView resource="players">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  View Players
                </button>
              </CanView>

              <Can resource="players" action="approve">
                <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                  Approve Players
                </button>
              </Can>
            </div>
          </div>
        </div>
      </section>

      {/* Role-based Components */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Role-based Components</h2>
        
        <div className="space-y-3">
          <IsAdmin>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900">Admin Only Section</h3>
              <p className="text-red-700 text-sm mt-1">
                This content is only visible to administrators.
              </p>
            </div>
          </IsAdmin>

          <IsAdmin fallback={
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                You need admin privileges to view this section.
              </p>
            </div>
          }>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900">Admin Dashboard</h3>
              <p className="text-green-700 text-sm mt-1">
                Welcome to the admin dashboard!
              </p>
            </div>
          </IsAdmin>
        </div>
      </section>

      {/* Complex Permission Logic */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Complex Permission Logic</h2>
        
        <div className="space-y-3">
          {/* Multiple permissions check */}
          {permissions.hasAnyPermission(['news:edit', 'news:publish']) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                You can edit OR publish news articles.
              </p>
            </div>
          )}

          {/* All permissions required */}
          {permissions.hasAllPermissions(['teams:view', 'teams:edit', 'teams:delete']) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-900 text-sm">
                You have full team management permissions.
              </p>
            </div>
          )}

          {/* Multiple roles check */}
          {permissions.hasAnyRole(['Admin', 'Editor']) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900 text-sm">
                You are either an Admin or Editor.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* All Permissions List */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Your Permissions</h2>
        <div className="bg-gray-50 rounded p-4">
          <div className="flex flex-wrap gap-2">
            {permissions.getAllPermissions().length > 0 ? (
              permissions.getAllPermissions().map((perm) => (
                <span
                  key={perm}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {perm}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No permissions assigned</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PermissionsExample;
