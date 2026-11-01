# Permission System Setup Guide

## Quick Start

Follow these steps to set up the permission system in your Astro + React application.

## Step 1: Database Setup ✅ (Already Done!)

Your RBAC system is already initialized with:
- ✅ Admin role with 28 permissions
- ✅ Admin user (admin@elevateballers.com / admin123)
- ✅ Additional roles: Editor, Statistician, Content Manager, Scorekeeper, Viewer

## Step 2: Wrap Your React Components with PermissionProvider

You need to wrap your React components with the `PermissionProvider` to enable permission checking.

### Option A: For Individual React Components (Island Architecture)

If you're using Astro's island architecture with individual React components:

```tsx
// src/components/AdminPanel.tsx
import { PermissionProvider, usePermissions } from '@/features/rbac';

function AdminContent() {
  const { canEdit, canView, isAdmin } = usePermissions();

  return (
    <div>
      {isAdmin && <h1>Admin Panel</h1>}
      {canEdit('news_articles') && <button>Edit News</button>}
    </div>
  );
}

// Wrap with provider
export default function AdminPanel() {
  return (
    <PermissionProvider>
      <AdminContent />
    </PermissionProvider>
  );
}
```

Then use it in your Astro page:

```astro
---
// src/pages/admin.astro
import AdminPanel from '../components/AdminPanel';
---

<html>
  <body>
    <AdminPanel client:load />
  </body>
</html>
```

### Option B: For Full React SPA Section

If you have a full React SPA section (like your admin dashboard):

```tsx
// src/components/AdminApp.tsx
import { PermissionProvider } from '@/features/rbac';
import { AdminDashboard } from './AdminDashboard';
import { Sidebar } from './Sidebar';

export default function AdminApp() {
  return (
    <PermissionProvider>
      <div className="admin-layout">
        <Sidebar />
        <AdminDashboard />
      </div>
    </PermissionProvider>
  );
}
```

Then in your Astro page:

```astro
---
// src/pages/admin/index.astro
import AdminApp from '@/components/AdminApp';
---

<html>
  <body>
    <AdminApp client:load />
  </body>
</html>
```

## Step 3: Update Your Existing Components

Now update your existing components to use permissions:

### Example: Update UserList Component

```tsx
// Before
export function UserList() {
  return (
    <div>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

// After
import { usePermissions } from '@/features/rbac';

export function UserList() {
  const { canEdit, canDelete } = usePermissions();

  return (
    <div>
      {canEdit('users') && (
        <button onClick={handleEdit}>Edit</button>
      )}
      {canDelete('users') && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
}
```

### Example: Update AdminSidebar Component

```tsx
// Before
export function AdminSidebar() {
  return (
    <nav>
      <a href="/admin/users">Users</a>
      <a href="/admin/teams">Teams</a>
      <a href="/admin/news">News</a>
      <a href="/admin/settings">Settings</a>
    </nav>
  );
}

// After
import { usePermissions } from '@/features/rbac';

export function AdminSidebar() {
  const { can, isAdmin } = usePermissions();

  return (
    <nav>
      {can('users:read') && (
        <a href="/admin/users">Users</a>
      )}
      {can('teams:read') && (
        <a href="/admin/teams">Teams</a>
      )}
      {can('news_articles:read') && (
        <a href="/admin/news">News</a>
      )}
      {isAdmin && (
        <a href="/admin/settings">Settings</a>
      )}
    </nav>
  );
}
```

## Step 4: Protect Your API Routes (Server-Side)

Your API routes should also check permissions:

```ts
// src/pages/api/teams/[id].ts
import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac';

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    // Require permission before proceeding
    await requirePermission(request, 'teams:edit');

    const { id } = params;
    const data = await request.json();

    // Update team logic here
    const team = await updateTeam(id, data);

    return new Response(JSON.stringify(team), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.message.includes('Unauthorized') ? 401 : 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'teams:delete');

    const { id } = params;
    await deleteTeam(id);

    return new Response(JSON.stringify({ message: 'Team deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle error...
  }
};
```

## Step 5: Test Your Permissions

### 1. Login as Admin

```bash
Email: admin@elevateballers.com
Password: admin123
```

### 2. Check Permissions

Open your browser console and test:

```js
// Fetch current user permissions
fetch('/api/auth/me')
  .then(r => r.json())
  .then(data => {
    console.log('User:', data.user);
    console.log('Roles:', data.user.roles);
    console.log('Permissions:', data.user.permissions);
  });
```

### 3. Test UI Components

Create a test page to verify permissions:

```tsx
// src/components/PermissionTest.tsx
import { PermissionProvider, usePermissions } from '@/features/rbac';

function TestContent() {
  const { user, permissions, roles, isAdmin, can } = usePermissions();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Permission Test</h2>

      <h3>User Info:</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h3>Roles:</h3>
      <ul>
        {roles.map(role => <li key={role}>{role}</li>)}
      </ul>

      <h3>Permissions ({permissions.length}):</h3>
      <ul>
        {permissions.map(perm => <li key={perm}>{perm}</li>)}
      </ul>

      <h3>Permission Tests:</h3>
      <ul>
        <li>isAdmin: {isAdmin ? '✅' : '❌'}</li>
        <li>can('edit', 'news_articles'): {can('edit', 'news_articles') ? '✅' : '❌'}</li>
        <li>can('teams:delete'): {can('teams:delete') ? '✅' : '❌'}</li>
        <li>can('users:manage_roles'): {can('users:manage_roles') ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}

export default function PermissionTest() {
  return (
    <PermissionProvider>
      <TestContent />
    </PermissionProvider>
  );
}
```

## Available Permissions

Your system currently has these permission categories:

### Teams
- `teams:create`, `teams:read`, `teams:update`, `teams:delete`
- `teams:approve`, `teams:bulk_delete`, `teams:bulk_approve`, `teams:manage_staff`

### Players
- `players:create`, `players:read`, `players:update`, `players:delete`
- `players:approve`, `players:bulk_delete`, `players:bulk_approve`, `players:view_stats`

### Matches
- `matches:create`, `matches:read`, `matches:update`, `matches:delete`
- `matches:track`, `matches:manage_events`, `matches:manage_players`, `matches:bulk_delete`, `matches:view_reports`

### News Articles
- `news_articles:create`, `news_articles:read`, `news_articles:update`, `news_articles:delete`
- `news_articles:publish`, `news_articles:bulk_delete`

### Media
- `media:create`, `media:read`, `media:update`, `media:delete`
- `media:view_private`, `media:batch_upload`, `media:batch_move`, `media:export`, `media:cleanup`

### Users & Roles
- `users:create`, `users:read`, `users:update`, `users:delete`, `users:manage_roles`
- `roles:create`, `roles:read`, `roles:update`, `roles:delete`, `roles:manage_permissions`

### Others
- `leagues:*`, `seasons:*`, `staff:*`, `folders:*`, `comments:*`, `page_contents:*`
- `potw:*` (Player of the Week)
- `sponsors:*`, `tournaments:*`, `site_settings:*`

## Common Patterns

### Pattern 1: Conditional Button

```tsx
{canEdit('teams') && <button>Edit</button>}
```

### Pattern 2: Navigation Menu

```tsx
{can('users:read') && <a href="/admin/users">Users</a>}
```

### Pattern 3: Form Fields

```tsx
{can('teams:approve') && (
  <input type="checkbox" name="approved" />
)}
```

### Pattern 4: Admin-Only Section

```tsx
{isAdmin && <AdminSettings />}
```

### Pattern 5: Multiple Permissions

```tsx
{(canEdit('news') || canDelete('news')) && <AdminActions />}
```

## Next Steps

1. ✅ **Setup Complete** - Your RBAC system is ready!
2. 📝 **Update Components** - Add permission checks to your existing components
3. 🔒 **Protect Routes** - Add permission checks to your API routes
4. 👥 **Create Users** - Create additional users and assign them different roles
5. 🎨 **Customize Roles** - Create custom roles with specific permissions

## Need Help?

- 📖 See [PERMISSIONS_USAGE_GUIDE.md](./PERMISSIONS_USAGE_GUIDE.md) for detailed usage examples
- 👀 Check [src/examples/PermissionExample.tsx](./src/examples/PermissionExample.tsx) for code examples
- 🛠️ Run `node scripts/verify-rbac.js` to verify your RBAC setup

## Useful Scripts

```bash
# Create a new admin user
node scripts/create-admin.js

# Create Admin role (if missing)
node scripts/create-admin-role.js

# Verify RBAC setup
node scripts/verify-rbac.js

# Test permissions
node scripts/test-rbac-permissions.js

# Update admin permissions
node scripts/update-admin-permissions.js
```
