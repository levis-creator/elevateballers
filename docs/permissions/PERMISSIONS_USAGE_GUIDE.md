# Permission System Usage Guide

This guide explains how to use the Laravel-style permission system in your React/Astro application.

## Overview

The permission system provides:
- ✅ Laravel-style permission checking
- ✅ React hooks for easy integration
- ✅ Component-based permission rendering
- ✅ Role-based access control
- ✅ Cached permissions for performance

## Setup

### 1. Wrap Your App with PermissionProvider

First, wrap your React app with the `PermissionProvider` to enable permission checking throughout your application:

```tsx
import { PermissionProvider } from '@/features/rbac';

function App() {
  return (
    <PermissionProvider>
      <YourApp />
    </PermissionProvider>
  );
}
```

## Usage Examples

### Using the `usePermissions` Hook

The main hook provides multiple ways to check permissions:

```tsx
import { usePermissions } from '@/features/rbac';

function NewsEditor() {
  const {
    // Permission checking
    can,
    canEdit,
    canView,
    canCreate,
    canDelete,

    // Role checking
    hasRole,
    isAdmin,

    // User data
    user,
    permissions,
    loading,
  } = usePermissions();

  // Laravel-style: can(action, resource)
  if (can('edit', 'news_articles')) {
    return <button>Edit Article</button>;
  }

  // Or direct format: can('resource:action')
  if (can('news_articles:edit')) {
    return <button>Edit Article</button>;
  }

  // Simplified helpers
  if (canEdit('news_articles')) {
    return <button>Edit</button>;
  }

  if (canView('users')) {
    return <UserList />;
  }

  if (canCreate('teams')) {
    return <CreateTeamButton />;
  }

  if (canDelete('matches')) {
    return <DeleteButton />;
  }

  // Check multiple permissions
  if (can('news_articles:edit') || can('news_articles:delete')) {
    return <AdminActions />;
  }

  return null;
}
```

### Using Permission Components

For declarative permission checking:

```tsx
import { Can, HasRole } from '@/features/rbac';

function NewsArticle() {
  return (
    <div>
      <h1>My Article</h1>

      {/* Show edit button only if user can edit */}
      <Can action="edit" resource="news_articles">
        <button>Edit Article</button>
      </Can>

      {/* Alternative: direct permission string */}
      <Can permission="news_articles:delete">
        <button>Delete Article</button>
      </Can>

      {/* With fallback */}
      <Can
        action="view"
        resource="analytics"
        fallback={<div>Premium feature</div>}
      >
        <AnalyticsDashboard />
      </Can>

      {/* Role-based rendering */}
      <HasRole role="Admin">
        <AdminPanel />
      </HasRole>

      {/* Multiple roles (any) */}
      <HasRole roles={['Admin', 'Editor']}>
        <EditorTools />
      </HasRole>

      {/* Multiple roles (all required) */}
      <HasRole roles={['Admin', 'SuperUser']} requireAll={true}>
        <SuperAdminPanel />
      </HasRole>
    </div>
  );
}
```

### Advanced Permission Checking

```tsx
import { usePermissions } from '@/features/rbac';

function AdvancedExample() {
  const { canAny, canAll, hasAnyRole, hasAllRoles } = usePermissions();

  // Check if user has ANY of these permissions
  const canModerateContent = canAny([
    'news_articles:edit',
    'news_articles:delete',
    'comments:delete',
  ]);

  // Check if user has ALL of these permissions
  const canManageTeams = canAll([
    'teams:create',
    'teams:edit',
    'teams:delete',
  ]);

  // Check if user has ANY of these roles
  const isContentManager = hasAnyRole(['Admin', 'Editor', 'Content Manager']);

  // Check if user has ALL of these roles
  const isSuperAdmin = hasAllRoles(['Admin', 'SuperUser']);

  return (
    <div>
      {canModerateContent && <ModerationPanel />}
      {canManageTeams && <TeamManagement />}
      {isContentManager && <ContentTools />}
    </div>
  );
}
```

### Loading States

Handle loading states gracefully:

```tsx
import { usePermissions } from '@/features/rbac';

function MyComponent() {
  const { loading, error, canEdit } = usePermissions();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div>
      {canEdit('news_articles') && <EditButton />}
    </div>
  );
}
```

### Refetching Permissions

If you need to refetch permissions (e.g., after a role change):

```tsx
import { usePermissions } from '@/features/rbac';

function UserProfile() {
  const { permissions, refetch } = usePermissions();

  const handleRoleUpdate = async () => {
    await updateUserRole();
    // Refetch permissions to get latest data
    await refetch();
  };

  return (
    <div>
      <h3>Your Permissions:</h3>
      <ul>
        {permissions.map(perm => (
          <li key={perm}>{perm}</li>
        ))}
      </ul>
      <button onClick={handleRoleUpdate}>Update Role</button>
    </div>
  );
}
```

## Available Permission Methods

### Permission Checking Methods

| Method | Description | Example |
|--------|-------------|---------|
| `can(action, resource)` | Laravel-style permission check | `can('edit', 'news_articles')` |
| `can(permission)` | Direct permission check | `can('news_articles:edit')` |
| `canEdit(resource)` | Check edit permission | `canEdit('news_articles')` |
| `canView(resource)` | Check read permission | `canView('users')` |
| `canCreate(resource)` | Check create permission | `canCreate('teams')` |
| `canDelete(resource)` | Check delete permission | `canDelete('matches')` |
| `canUpdate(resource)` | Check update permission (alias for `canEdit`) | `canUpdate('players')` |
| `canAny(permissions)` | Check if has ANY permission | `canAny(['news:edit', 'news:delete'])` |
| `canAll(permissions)` | Check if has ALL permissions | `canAll(['teams:create', 'teams:edit'])` |

### Role Checking Methods

| Method | Description | Example |
|--------|-------------|---------|
| `hasRole(role)` | Check if user has role | `hasRole('Admin')` |
| `hasAnyRole(roles)` | Check if has ANY role | `hasAnyRole(['Admin', 'Editor'])` |
| `hasAllRoles(roles)` | Check if has ALL roles | `hasAllRoles(['Admin', 'SuperUser'])` |
| `isAdmin` | Check if user is admin | `isAdmin` |
| `isAuthenticated` | Check if user is logged in | `isAuthenticated` |

## Permission Format

Permissions follow the format: `resource:action`

Examples:
- `news_articles:create`
- `news_articles:read`
- `news_articles:edit`
- `news_articles:delete`
- `teams:approve`
- `users:manage_roles`

## Common Use Cases

### 1. Conditional Rendering Based on Permission

```tsx
function ArticleActions({ article }) {
  const { canEdit, canDelete } = usePermissions();

  return (
    <div className="actions">
      {canEdit('news_articles') && (
        <button onClick={() => editArticle(article)}>Edit</button>
      )}
      {canDelete('news_articles') && (
        <button onClick={() => deleteArticle(article)}>Delete</button>
      )}
    </div>
  );
}
```

### 2. Protecting Routes

```tsx
import { usePermissions } from '@/features/rbac';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, permission }) {
  const { can, loading } = usePermissions();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!can(permission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage
<ProtectedRoute permission="users:manage_roles">
  <UserManagement />
</ProtectedRoute>
```

### 3. Showing Different UI Based on Permissions

```tsx
function Dashboard() {
  const { isAdmin, hasRole, canCreate } = usePermissions();

  return (
    <div>
      <h1>Dashboard</h1>

      {isAdmin && <AdminWidget />}

      {hasRole('Editor') && <EditorWidget />}

      {canCreate('teams') && (
        <section>
          <h2>Create Team</h2>
          <TeamForm />
        </section>
      )}
    </div>
  );
}
```

### 4. Bulk Actions Based on Permissions

```tsx
function TeamList() {
  const { can, canDelete } = usePermissions();

  const showBulkActions = can('teams:bulk_delete') || can('teams:bulk_approve');

  return (
    <div>
      {showBulkActions && <BulkActionBar />}
      <TeamTable />
    </div>
  );
}
```

## Server-Side Usage

For API routes and server-side code:

```ts
import { hasPermission, requirePermission } from '@/features/rbac';

// In API route
export const POST: APIRoute = async ({ request }) => {
  // Require permission (throws error if not authorized)
  await requirePermission(request, 'teams:create');

  // Your logic here
  const team = await createTeam(...);

  return new Response(JSON.stringify(team), { status: 201 });
};

// Or check permission without throwing
export const GET: APIRoute = async ({ request }) => {
  const user = await getCurrentUser(request);

  if (await hasPermission(user.id, 'teams:view_private')) {
    // Show private teams
  }

  // Show public teams
};
```

## Best Practices

1. **Use PermissionProvider at the root**: Wrap your app once at the root level
2. **Use helpers for common actions**: Prefer `canEdit()` over `can('edit', ...)` for clarity
3. **Handle loading states**: Always check the `loading` flag for better UX
4. **Cache permissions**: The provider automatically caches permissions
5. **Refetch when needed**: Call `refetch()` after role/permission changes
6. **Use components for declarative UI**: Use `<Can>` and `<HasRole>` for cleaner JSX

## Troubleshooting

### "usePermissionContext must be used within a PermissionProvider"

Make sure you've wrapped your app with `<PermissionProvider>`:

```tsx
// ❌ Wrong
<App />

// ✅ Correct
<PermissionProvider>
  <App />
</PermissionProvider>
```

### Permissions not updating after role change

Call `refetch()` to reload permissions:

```tsx
const { refetch } = usePermissions();
await updateRole();
await refetch();
```

### Permission checks returning false during loading

The hook returns `false` during loading. Handle this explicitly:

```tsx
const { loading, can } = usePermissions();

if (loading) return <Spinner />;

return can('edit') ? <EditButton /> : null;
```
