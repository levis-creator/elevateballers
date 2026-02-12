# UI Permissions Quick Reference

## Import

```typescript
// Hooks
import { usePermissions } from '@/hooks/usePermissions';

// Components
import { Can, CanView, CanEdit, CanDelete, HasRole } from '@/components/PermissionGate';
```

## Hook Methods

### Permission Checks
```typescript
const permissions = usePermissions();

permissions.can('resource', 'action')      // Check specific permission
permissions.canView('resource')            // Check view permission
permissions.canCreate('resource')          // Check create permission
permissions.canEdit('resource')            // Check edit permission
permissions.canDelete('resource')          // Check delete permission
permissions.canPublish('resource')         // Check publish permission
permissions.canApprove('resource')         // Check approve permission
permissions.canManage('resource')          // Check manage permission (all CRUD)
```

### Role Checks
```typescript
permissions.hasRole('Admin')               // Check specific role
permissions.hasAnyRole(['Admin', 'Editor']) // Check any role
permissions.hasAllRoles(['Admin', 'Mod'])  // Check all roles
permissions.isAdmin()                      // Check if Admin
permissions.isSuperAdmin()                 // Check if Super Admin
permissions.isEditor()                     // Check if Editor
```

### Advanced Checks
```typescript
permissions.hasAnyPermission(['news:edit', 'news:publish'])
permissions.hasAllPermissions(['users:view', 'users:edit'])
permissions.isAuthenticated()
```

### Data Getters
```typescript
permissions.getAllPermissions()            // Get all permissions array
permissions.getAllRoles()                  // Get all roles array
permissions.getUser()                      // Get user object
permissions.loading                        // Loading state
permissions.error                          // Error state
```

## Components

### Basic Permission Gate
```tsx
<Can resource="news" action="edit">
  <EditButton />
</Can>

<Can resource="news" action="delete" fallback={<NoPermission />}>
  <DeleteButton />
</Can>
```

### Resource-Specific Gates
```tsx
<CanView resource="teams">
  <TeamsTable />
</CanView>

<CanCreate resource="players">
  <CreateButton />
</CanCreate>

<CanEdit resource="matches">
  <EditButton />
</CanEdit>

<CanDelete resource="users">
  <DeleteButton />
</CanDelete>

<CanManage resource="leagues">
  <ManagementPanel />
</CanManage>
```

### Role-Based Gates
```tsx
<HasRole role="Admin">
  <AdminPanel />
</HasRole>

<HasAnyRole roles={['Admin', 'Editor']}>
  <ContentTools />
</HasAnyRole>

<IsAdmin>
  <AdminSettings />
</IsAdmin>

<IsAuthenticated fallback={<LoginPrompt />}>
  <Dashboard />
</IsAuthenticated>
```

## Common Resources

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
- `staff` - Staff members

## Common Actions

- `view` - View/read
- `create` - Create new
- `edit` / `update` - Edit/update
- `delete` - Delete
- `publish` - Publish
- `approve` - Approve
- `manage` - Full management

## Permission Format

Format: `resource:action`

Examples:
- `news:view`
- `news:edit`
- `teams:create`
- `players:delete`
- `users:manage`

## Common Patterns

### Conditional Rendering
```tsx
const permissions = usePermissions();

if (permissions.loading) return <Spinner />;
if (!permissions.isAuthenticated()) return <Login />;
if (!permissions.canView('news')) return <AccessDenied />;

return <NewsTable />;
```

### Multiple Permissions
```tsx
{permissions.hasAnyPermission(['news:edit', 'news:publish']) && (
  <NewsActions />
)}
```

### Role-Based UI
```tsx
{permissions.isAdmin() ? (
  <AdminDashboard />
) : (
  <UserDashboard />
)}
```

### Component Gate with Fallback
```tsx
<CanEdit resource="teams" fallback={<ViewOnlyMode />}>
  <EditMode />
</CanEdit>
```

## Loading States

```tsx
// Hook with loading
const { allowed, loading } = usePermissionCheck('news', 'edit');
if (loading) return <Spinner />;

// Component with loading fallback
<Can 
  resource="news" 
  action="edit"
  loadingFallback={<Spinner />}
>
  <EditButton />
</Can>
```

## Best Practices

1. ✅ Use semantic methods: `canEdit()` instead of `can('resource', 'edit')`
2. ✅ Handle loading states
3. ✅ Provide fallbacks for better UX
4. ✅ Use components for declarative UI
5. ✅ Check authentication before permissions
6. ✅ Use `canManage()` for full CRUD checks

## Troubleshooting

**Permissions not loading?**
- Check `/api/auth/me` endpoint
- Verify authentication token
- Check browser console

**Always returns false?**
- Verify permissions in database
- Check permission format: `resource:action`
- Ensure user has required role

**Loading never resolves?**
- Check network tab
- Verify JWT token validity
- Check backend logs
