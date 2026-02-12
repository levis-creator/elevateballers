# UI Permissions System

A comprehensive, Laravel-style permissions system for React/TypeScript that integrates seamlessly with the existing RBAC infrastructure.

## 📋 Overview

This permissions system provides an intuitive, Laravel-inspired API for checking user permissions and roles in the UI. It follows SOLID principles and provides both **hooks** for programmatic checks and **components** for declarative permission gates.

## 🎯 Key Features

- ✅ **Laravel-style API** - Familiar methods like `canView()`, `canEdit()`, `canDelete()`
- ✅ **Role-based checks** - `hasRole()`, `isAdmin()`, `isSuperAdmin()`
- ✅ **Declarative components** - `<Can>`, `<CanEdit>`, `<HasRole>` for clean JSX
- ✅ **TypeScript support** - Full type safety throughout
- ✅ **Loading states** - Built-in loading state management
- ✅ **Performance optimized** - Efficient caching and memoization
- ✅ **SOLID principles** - Single responsibility, clear separation of concerns

## 📦 What's Included

### Files Created

1. **`src/hooks/usePermissions.ts`** - Main permissions hook with all permission checking logic
2. **`src/hooks/index.ts`** - Clean export interface for hooks
3. **`src/components/PermissionGate.tsx`** - Permission gate components for declarative UI
4. **`src/components/examples/PermissionsExample.tsx`** - Comprehensive usage examples
5. **`docs/UI_PERMISSIONS.md`** - Full documentation with examples
6. **`docs/PERMISSIONS_QUICK_REFERENCE.md`** - Quick reference guide

### Integration

- ✅ Integrates with existing RBAC system (`src/features/rbac/`)
- ✅ Uses existing `/api/auth/me` endpoint
- ✅ Works with existing `Permission`, `Role`, `UserRole` models
- ✅ No database changes required

## 🚀 Quick Start

### Using Hooks

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function NewsEditor() {
  const permissions = usePermissions();

  // Handle loading
  if (permissions.loading) {
    return <Spinner />;
  }

  // Check permissions
  if (permissions.canEdit('news')) {
    return <EditButton />;
  }

  if (permissions.isAdmin()) {
    return <AdminPanel />;
  }

  return <ViewOnlyMode />;
}
```

### Using Components

```tsx
import { CanEdit, IsAdmin } from '@/components/PermissionGate';

function NewsActions() {
  return (
    <div>
      <CanEdit resource="news">
        <EditButton />
      </CanEdit>

      <IsAdmin>
        <AdminSettings />
      </IsAdmin>
    </div>
  );
}
```

## 📚 Documentation

### Full Documentation
See [`docs/UI_PERMISSIONS.md`](../docs/UI_PERMISSIONS.md) for:
- Detailed usage examples
- All available methods
- Best practices
- Integration details
- Troubleshooting guide

### Quick Reference
See [`docs/PERMISSIONS_QUICK_REFERENCE.md`](../docs/PERMISSIONS_QUICK_REFERENCE.md) for:
- Quick method reference
- Common patterns
- Permission format
- Common resources and actions

### Live Examples
See [`src/components/examples/PermissionsExample.tsx`](../src/components/examples/PermissionsExample.tsx) for:
- Working code examples
- All features demonstrated
- Real-world usage patterns

## 🎨 Available Methods

### Permission Checks
```typescript
can(resource, action)      // Check specific permission
canView(resource)          // Check view permission
canCreate(resource)        // Check create permission
canEdit(resource)          // Check edit permission
canDelete(resource)        // Check delete permission
canPublish(resource)       // Check publish permission
canApprove(resource)       // Check approve permission
canManage(resource)        // Check manage permission (all CRUD)
```

### Role Checks
```typescript
hasRole(roleName)          // Check specific role
hasAnyRole(roleNames)      // Check any of multiple roles
hasAllRoles(roleNames)     // Check all roles
isAdmin()                  // Check if Admin
isSuperAdmin()             // Check if Super Admin
isEditor()                 // Check if Editor
```

### Advanced Checks
```typescript
hasAnyPermission(permissions)   // Check any permission
hasAllPermissions(permissions)  // Check all permissions
isAuthenticated()               // Check authentication
```

## 🧩 Available Components

### Basic Gates
```tsx
<Can resource="news" action="edit">
  <EditButton />
</Can>
```

### Resource-Specific Gates
```tsx
<CanView resource="teams">
  <TeamsTable />
</CanView>

<CanEdit resource="players">
  <EditButton />
</CanEdit>

<CanDelete resource="matches">
  <DeleteButton />
</CanDelete>
```

### Role-Based Gates
```tsx
<HasRole role="Admin">
  <AdminPanel />
</HasRole>

<IsAdmin>
  <AdminSettings />
</IsAdmin>

<IsAuthenticated fallback={<LoginPrompt />}>
  <Dashboard />
</IsAuthenticated>
```

## 🔑 Permission Format

Permissions follow the format: `resource:action`

**Examples:**
- `news:view` - Can view news articles
- `news:edit` - Can edit news articles
- `teams:create` - Can create teams
- `players:delete` - Can delete players
- `users:manage` - Can fully manage users

## 📋 Common Resources

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

## 🎯 Common Actions

- `view` - View/read resource
- `create` - Create new resource
- `edit` / `update` - Edit/update resource
- `delete` - Delete resource
- `publish` - Publish resource
- `approve` - Approve resource
- `manage` - Full management (all actions)

## 💡 Best Practices

### 1. Use Semantic Methods
```typescript
// ✅ Good - semantic and clear
if (permissions.canEdit('news')) { }

// ❌ Avoid - less clear
if (permissions.can('news', 'edit')) { }
```

### 2. Handle Loading States
```typescript
// ✅ Good - handles loading
const { allowed, loading } = usePermissionCheck('news', 'edit');
if (loading) return <Spinner />;

// ❌ Avoid - no loading state
const permissions = usePermissions();
if (permissions.canEdit('news')) { }
```

### 3. Use Components for Declarative UI
```tsx
// ✅ Good - declarative and readable
<CanEdit resource="news">
  <EditButton />
</CanEdit>

// ❌ Avoid - imperative
const permissions = usePermissions();
{permissions.canEdit('news') && <EditButton />}
```

### 4. Provide Fallbacks
```tsx
// ✅ Good - clear user feedback
<Can resource="news" action="delete" fallback={<p>No permission</p>}>
  <DeleteButton />
</Can>

// ❌ Avoid - silent failure
<Can resource="news" action="delete">
  <DeleteButton />
</Can>
```

## 🔧 Architecture

### Design Principles

This system follows SOLID principles:

1. **Single Responsibility** - Each function/component has one clear purpose
2. **Open/Closed** - Easy to extend with new permission types
3. **Liskov Substitution** - Components can be swapped without breaking functionality
4. **Interface Segregation** - Focused, specific methods instead of generic ones
5. **Dependency Inversion** - Depends on abstractions (permissions API) not implementations

### Performance

- **Caching**: User permissions fetched once and cached
- **Memoization**: All check functions memoized with `useCallback`
- **Efficient queries**: Backend uses optimized Prisma queries
- **Loading states**: Prevents unnecessary re-renders

## 🔌 Integration with Existing RBAC

This system integrates seamlessly with your existing RBAC:

1. **Backend**: Uses existing `Permission`, `Role`, `UserRole`, `RolePermission` models
2. **API**: Fetches from existing `/api/auth/me` endpoint
3. **Database**: Reads from same `permissions`, `roles`, `user_roles` tables
4. **Consistency**: UI permissions match backend authorization

## 🧪 Testing

```typescript
import { renderHook } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';

describe('usePermissions', () => {
  it('should check permissions correctly', async () => {
    const { result } = renderHook(() => usePermissions());
    
    await waitFor(() => !result.current.loading);
    
    expect(result.current.canEdit('news')).toBe(true);
    expect(result.current.isAdmin()).toBe(false);
  });
});
```

## 🐛 Troubleshooting

### Permissions not loading?
- Check `/api/auth/me` endpoint is working
- Verify user is authenticated
- Check browser console for errors

### Permission checks always return false?
- Verify permissions are assigned to user's role in database
- Check permission format is `resource:action`
- Ensure user has the required role

### Loading state never resolves?
- Check network tab for failed API requests
- Verify JWT token is valid
- Check backend logs for errors

## 📖 Examples

### Example 1: News Management
```tsx
function NewsManagement() {
  const permissions = usePermissions();

  if (permissions.loading) return <Spinner />;
  if (!permissions.canView('news')) return <AccessDenied />;

  return (
    <div>
      <h1>News Management</h1>
      
      <CanCreate resource="news">
        <CreateNewsButton />
      </CanCreate>

      <NewsList />

      {permissions.canEdit('news') && <EditTools />}
      {permissions.canDelete('news') && <DeleteTools />}
    </div>
  );
}
```

### Example 2: Admin Panel
```tsx
function AdminPanel() {
  const permissions = usePermissions();

  return (
    <div>
      <IsAdmin fallback={<AccessDenied />}>
        <h1>Admin Dashboard</h1>
        
        <CanManage resource="users">
          <UserManagement />
        </CanManage>

        <CanManage resource="roles">
          <RoleManagement />
        </CanManage>

        {permissions.isSuperAdmin() && <SystemSettings />}
      </IsAdmin>
    </div>
  );
}
```

### Example 3: Conditional Features
```tsx
function TeamActions({ teamId }: { teamId: string }) {
  const permissions = usePermissions();

  return (
    <div className="flex gap-2">
      <CanView resource="teams">
        <ViewButton teamId={teamId} />
      </CanView>

      <CanEdit resource="teams">
        <EditButton teamId={teamId} />
      </CanEdit>

      <CanDelete resource="teams">
        <DeleteButton teamId={teamId} />
      </CanDelete>

      {permissions.hasAnyPermission(['teams:approve', 'teams:manage']) && (
        <ApproveButton teamId={teamId} />
      )}
    </div>
  );
}
```

## 🎓 Next Steps

1. **Read the full documentation**: [`docs/UI_PERMISSIONS.md`](../docs/UI_PERMISSIONS.md)
2. **Check the quick reference**: [`docs/PERMISSIONS_QUICK_REFERENCE.md`](../docs/PERMISSIONS_QUICK_REFERENCE.md)
3. **Explore the examples**: [`src/components/examples/PermissionsExample.tsx`](../src/components/examples/PermissionsExample.tsx)
4. **Start using in your components**: Import and use the hooks/components
5. **Test thoroughly**: Ensure permissions work as expected in your app

## 📝 License

This permissions system is part of the Elevate Ballers project and follows the same license.

## 🤝 Support

For questions or issues:
- Check the documentation files
- Review the example component
- Check the existing RBAC implementation in `src/features/rbac/`
- Review the Prisma schema for permission models

---

**Built with ❤️ following SOLID principles and Laravel-inspired design patterns**
