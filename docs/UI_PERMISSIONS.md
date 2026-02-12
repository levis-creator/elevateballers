# UI Permissions System

A comprehensive, Laravel-style permissions system for the UI that integrates with the existing RBAC (Role-Based Access Control) infrastructure.

## Overview

This permissions system provides intuitive hooks and components for checking user permissions and roles in the UI. It follows Laravel's authorization patterns and adheres to SOLID principles.

## Features

- **Laravel-style API**: Familiar methods like `can()`, `canView()`, `canEdit()`, `canDelete()`
- **Role-based checks**: `hasRole()`, `isAdmin()`, `isSuperAdmin()`
- **Declarative components**: `<Can>`, `<CanEdit>`, `<HasRole>`, etc.
- **TypeScript support**: Full type safety
- **Loading states**: Built-in loading state management
- **Performance optimized**: Efficient permission caching

## Installation

The permissions system is already integrated into the project. Import from:

```typescript
// Hooks
import { usePermissions, usePermissionCheck, useRoleCheck } from '@/hooks/usePermissions';

// Components
import { Can, CanView, CanEdit, CanDelete, HasRole, IsAdmin } from '@/components/PermissionGate';
```

## Hook Usage

### Basic Permission Checks

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function NewsEditor() {
  const permissions = usePermissions();

  // Check specific permission
  if (permissions.can('news', 'edit')) {
    return <EditButton />;
  }

  // Check view permission
  if (permissions.canView('teams')) {
    return <TeamsTable />;
  }

  // Check create permission
  if (permissions.canCreate('players')) {
    return <CreatePlayerButton />;
  }

  // Check edit permission (checks both 'edit' and 'update')
  if (permissions.canEdit('matches')) {
    return <EditMatchButton />;
  }

  // Check delete permission
  if (permissions.canDelete('users')) {
    return <DeleteUserButton />;
  }

  // Check manage permission (all CRUD operations)
  if (permissions.canManage('leagues')) {
    return <LeagueManagementPanel />;
  }

  return null;
}
```

### Role Checks

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function AdminPanel() {
  const permissions = usePermissions();

  // Check if user is admin
  if (permissions.isAdmin()) {
    return <AdminDashboard />;
  }

  // Check if user is super admin
  if (permissions.isSuperAdmin()) {
    return <SuperAdminSettings />;
  }

  // Check if user is editor
  if (permissions.isEditor()) {
    return <EditorTools />;
  }

  // Check specific role
  if (permissions.hasRole('Moderator')) {
    return <ModerationPanel />;
  }

  // Check if user has any of the roles
  if (permissions.hasAnyRole(['Admin', 'Editor'])) {
    return <ContentManagement />;
  }

  // Check if user has all roles
  if (permissions.hasAllRoles(['Admin', 'Moderator'])) {
    return <AdvancedModeration />;
  }

  return <AccessDenied />;
}
```

### Advanced Permission Checks

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function ComplexPermissionCheck() {
  const permissions = usePermissions();

  // Check multiple permissions
  if (permissions.hasAnyPermission(['news:edit', 'news:publish'])) {
    return <NewsActions />;
  }

  // Check all permissions required
  if (permissions.hasAllPermissions(['users:view', 'users:edit', 'users:delete'])) {
    return <UserManagement />;
  }

  // Get all permissions
  const allPermissions = permissions.getAllPermissions();
  console.log('User permissions:', allPermissions);

  // Get all roles
  const allRoles = permissions.getAllRoles();
  console.log('User roles:', allRoles);

  // Get user data
  const user = permissions.getUser();
  console.log('User:', user);

  // Check authentication
  if (!permissions.isAuthenticated()) {
    return <LoginPrompt />;
  }

  return <Dashboard />;
}
```

### Loading States

```typescript
import { usePermissions, usePermissionCheck } from '@/hooks/usePermissions';

function LoadingExample() {
  const permissions = usePermissions();

  // Global loading state
  if (permissions.loading) {
    return <Spinner />;
  }

  // Specific permission check with loading
  const { allowed, loading } = usePermissionCheck('news', 'edit');
  
  if (loading) {
    return <Spinner />;
  }

  if (!allowed) {
    return <AccessDenied />;
  }

  return <EditNewsForm />;
}
```

## Component Usage

### Can Component

```tsx
import { Can } from '@/components/PermissionGate';

function NewsActions() {
  return (
    <div>
      {/* Basic usage */}
      <Can resource="news" action="edit">
        <EditButton />
      </Can>

      {/* With fallback */}
      <Can resource="news" action="delete" fallback={<p>No permission to delete</p>}>
        <DeleteButton />
      </Can>

      {/* With loading fallback */}
      <Can 
        resource="news" 
        action="publish"
        loadingFallback={<Spinner />}
      >
        <PublishButton />
      </Can>
    </div>
  );
}
```

### Resource-Specific Components

```tsx
import { CanView, CanCreate, CanEdit, CanDelete, CanManage } from '@/components/PermissionGate';

function TeamManagement() {
  return (
    <div>
      {/* View permission */}
      <CanView resource="teams">
        <TeamsTable />
      </CanView>

      {/* Create permission */}
      <CanCreate resource="teams">
        <CreateTeamButton />
      </CanCreate>

      {/* Edit permission */}
      <CanEdit resource="teams">
        <EditTeamButton />
      </CanEdit>

      {/* Delete permission */}
      <CanDelete resource="teams">
        <DeleteTeamButton />
      </CanDelete>

      {/* Manage permission (all CRUD) */}
      <CanManage resource="teams">
        <TeamManagementPanel />
      </CanManage>
    </div>
  );
}
```

### Role-Based Components

```tsx
import { HasRole, HasAnyRole, IsAdmin, IsAuthenticated } from '@/components/PermissionGate';

function RoleBasedUI() {
  return (
    <div>
      {/* Admin only */}
      <IsAdmin>
        <AdminPanel />
      </IsAdmin>

      {/* Specific role */}
      <HasRole role="Editor">
        <EditorTools />
      </HasRole>

      {/* Any of multiple roles */}
      <HasAnyRole roles={['Admin', 'Moderator']}>
        <ModerationPanel />
      </HasAnyRole>

      {/* Authenticated users only */}
      <IsAuthenticated fallback={<LoginPrompt />}>
        <UserDashboard />
      </IsAuthenticated>
    </div>
  );
}
```

### Higher-Order Components

```tsx
import { withPermission, withRole } from '@/components/PermissionGate';

// Wrap component with permission check
const ProtectedEditButton = withPermission(
  EditButton, 
  'news', 
  'edit',
  <p>No permission</p> // Optional fallback
);

// Wrap component with role check
const AdminOnlySettings = withRole(
  SettingsPanel,
  'Admin',
  <AccessDenied /> // Optional fallback
);

function App() {
  return (
    <div>
      <ProtectedEditButton />
      <AdminOnlySettings />
    </div>
  );
}
```

## Permission Format

Permissions follow the format: `resource:action`

### Common Resources
- `news` - News articles
- `teams` - Teams
- `players` - Players
- `matches` - Matches
- `leagues` - Leagues
- `seasons` - Seasons
- `users` - Users
- `roles` - Roles
- `permissions` - Permissions
- `media` - Media files
- `comments` - Comments

### Common Actions
- `view` - View/read resource
- `create` - Create new resource
- `edit` / `update` - Edit/update resource
- `delete` - Delete resource
- `publish` - Publish resource
- `approve` - Approve resource
- `manage` - Full management (all actions)

### Examples
- `news:view` - Can view news articles
- `news:edit` - Can edit news articles
- `teams:create` - Can create teams
- `players:delete` - Can delete players
- `users:manage` - Can fully manage users

## Common Roles

- `Super Admin` - Full system access
- `Admin` - Administrative access
- `Editor` - Content editing access
- `Moderator` - Content moderation access
- `Viewer` - Read-only access

## Best Practices

### 1. Use Semantic Methods

```typescript
// Good - semantic and clear
if (permissions.canEdit('news')) { }

// Avoid - less clear
if (permissions.can('news', 'edit')) { }
```

### 2. Handle Loading States

```typescript
// Good - handles loading
const { allowed, loading } = usePermissionCheck('news', 'edit');
if (loading) return <Spinner />;

// Avoid - no loading state
const permissions = usePermissions();
if (permissions.canEdit('news')) { }
```

### 3. Use Components for Declarative UI

```tsx
// Good - declarative and readable
<CanEdit resource="news">
  <EditButton />
</CanEdit>

// Avoid - imperative
const permissions = usePermissions();
{permissions.canEdit('news') && <EditButton />}
```

### 4. Provide Fallbacks

```tsx
// Good - clear user feedback
<Can resource="news" action="delete" fallback={<p>No permission</p>}>
  <DeleteButton />
</Can>

// Avoid - silent failure
<Can resource="news" action="delete">
  <DeleteButton />
</Can>
```

### 5. Combine Permissions Logically

```typescript
// Good - clear intent
if (permissions.canManage('users')) {
  return <UserManagement />;
}

// Avoid - verbose
if (
  permissions.canView('users') &&
  permissions.canCreate('users') &&
  permissions.canEdit('users') &&
  permissions.canDelete('users')
) {
  return <UserManagement />;
}
```

## Integration with Existing RBAC

This permissions system integrates seamlessly with the existing RBAC infrastructure:

1. **Backend**: Uses the existing `Permission`, `Role`, `UserRole`, and `RolePermission` models
2. **API**: Fetches permissions from `/api/auth/me` endpoint
3. **Database**: Reads from the same `permissions`, `roles`, and `user_roles` tables
4. **Consistency**: Permissions checked in UI match backend authorization

## Performance Considerations

1. **Caching**: User permissions are fetched once and cached in component state
2. **Memoization**: All permission check functions are memoized with `useCallback`
3. **Efficient Queries**: Backend uses optimized Prisma queries with proper includes
4. **Loading States**: Prevents unnecessary re-renders during permission fetching

## Error Handling

```typescript
const permissions = usePermissions();

// Check for errors
if (permissions.error) {
  console.error('Permission error:', permissions.error);
  return <ErrorMessage />;
}

// Check authentication
if (!permissions.isAuthenticated() && !permissions.loading) {
  return <LoginPrompt />;
}
```

## TypeScript Support

Full TypeScript support with proper types:

```typescript
import type { usePermissions } from '@/hooks/usePermissions';

type Permissions = ReturnType<typeof usePermissions>;

function MyComponent() {
  const permissions: Permissions = usePermissions();
  // Full autocomplete and type checking
}
```

## Testing

```typescript
import { renderHook } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';

describe('usePermissions', () => {
  it('should check permissions correctly', async () => {
    const { result } = renderHook(() => usePermissions());
    
    // Wait for loading to complete
    await waitFor(() => !result.current.loading);
    
    // Test permission checks
    expect(result.current.canEdit('news')).toBe(true);
    expect(result.current.isAdmin()).toBe(false);
  });
});
```

## Migration from Old System

If you have existing permission checks, migrate them as follows:

```typescript
// Old approach
const userRole = getUserRole();
if (userRole === 'ADMIN') { }

// New approach
const permissions = usePermissions();
if (permissions.isAdmin()) { }

// Old approach
if (hasPermission(user, 'news:edit')) { }

// New approach
if (permissions.canEdit('news')) { }
```

## Troubleshooting

### Permissions not loading
- Check that `/api/auth/me` endpoint is working
- Verify user is authenticated
- Check browser console for errors

### Permission checks always return false
- Verify permissions are assigned to user's role in database
- Check permission format is `resource:action`
- Ensure user has the required role

### Loading state never resolves
- Check network tab for failed API requests
- Verify JWT token is valid
- Check backend logs for errors

## Support

For issues or questions, refer to:
- RBAC documentation: `src/features/rbac/`
- Permission models: `prisma/schema.prisma`
- Backend middleware: `src/features/rbac/middleware.ts`
