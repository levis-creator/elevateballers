# RBAC Seeding Guide

Complete guide for initializing the Role-Based Access Control system with permissions, roles, and admin user.

---

## 🚀 Quick Start (Recommended)

### One-Command Setup
Run this single command to set up everything:

```bash
node scripts/init-rbac.js
```

This will:
1. ✅ Seed 108 permissions across 17 categories
2. ✅ Create 6 system roles (Admin, Editor, Content Manager, Scorekeeper, Viewer, Statistician)
3. ✅ Assign all permissions to Admin role
4. ✅ Create an admin user

**Default Admin Credentials:**
- Email: `admin@elevateballers.com`
- Password: `admin123`
- ⚠️ **Change these after first login!**

---

## 🔧 Manual Setup (Step-by-Step)

If you prefer to run each step individually:

### Step 1: Ensure Database Schema is Updated
```bash
npm run db:push
```

### Step 2: Seed Permissions and Roles
```bash
node scripts/enhance-rbac.js
```

**What this does:**
- Adds categories to existing 80 permissions
- Creates 28 new permissions (approve, bulk operations, etc.)
- Creates system roles: Content Manager, Scorekeeper, Viewer
- Marks existing roles (Admin, Editor, Statistician) as system roles

**Output:**
```
✅ Updated 80 permissions with categories
✅ Added 28 new permissions
✅ Marked 3 roles as system roles
✅ Created 3 additional roles
Total permissions: 108
Total roles: 6
```

### Step 3: Update Admin Role Permissions
```bash
node scripts/update-admin-permissions.js
```

**What this does:**
- Assigns ALL 108 permissions to the Admin role
- Ensures Admin has full system access

**Output:**
```
✅ Updated Admin role: 108 permissions
```

### Step 4: Create Admin User
```bash
node scripts/create-admin.js
```

**What this does:**
- Creates a new user (or updates existing)
- Assigns Admin role to the user
- Auto-verifies the email

**Output:**
```
✅ Admin user created/updated successfully!
User ID: cml...
Email: admin@elevateballers.com
Name: Admin User
Roles: Admin
Total Permissions: 108
```

---

## 🎛️ Customizing the Admin User

### Using Environment Variables

Create or update your `.env` file:

```env
ADMIN_EMAIL=youremail@example.com
ADMIN_PASSWORD=YourSecurePassword123
ADMIN_NAME=Your Name
```

Then run:
```bash
node scripts/create-admin.js
```

### Creating Additional Admin Users

Run the script multiple times with different environment variables:

```bash
ADMIN_EMAIL=admin2@example.com ADMIN_PASSWORD=pass123 ADMIN_NAME="Second Admin" node scripts/create-admin.js
```

---

## 📊 Verification

After seeding, verify everything is set up correctly:

### 1. Verify Database State
```bash
node scripts/verify-rbac.js
```

**Expected output:**
```
✓ Total Permissions: 108
✓ Total Roles: 6 (6 system roles, 0 custom roles)

[SYSTEM] Admin
  Description: Full system access - all permissions
  Permissions: 108
  Users Assigned: 1

[SYSTEM] Editor
  Permissions: 64
  Users Assigned: 0

[SYSTEM] Statistician
  Permissions: 6
  Users Assigned: 0

[SYSTEM] Content Manager
  Permissions: 29
  Users Assigned: 0

[SYSTEM] Scorekeeper
  Permissions: 8
  Users Assigned: 0

[SYSTEM] Viewer
  Permissions: 9
  Users Assigned: 0

✓ Total Users: 1
✓ Users with Roles: 1
```

### 2. Test Permission Functions
```bash
node scripts/test-rbac-permissions.js
```

**Expected output:**
```
✓ PASS: All 7 tests
✅ TEST SUITE COMPLETE
All core RBAC functionality is working as expected!
```

---

## 📋 What Gets Seeded

### Permissions (108 total)

#### Teams (8)
- `teams:create`, `teams:read`, `teams:update`, `teams:delete`
- `teams:approve`, `teams:manage_staff`
- `teams:bulk_approve`, `teams:bulk_delete`

#### Players (8)
- `players:create`, `players:read`, `players:update`, `players:delete`
- `players:approve`, `players:view_stats`
- `players:bulk_approve`, `players:bulk_delete`

#### Matches (9)
- `matches:create`, `matches:read`, `matches:update`, `matches:delete`
- `matches:track`, `matches:manage_events`, `matches:manage_players`
- `matches:bulk_delete`, `matches:view_reports`

#### Media (13)
- `media:create`, `media:read`, `media:update`, `media:delete`
- `media:view_private`, `media:batch_upload`, `media:batch_move`
- `media:export`, `media:cleanup`
- `folders:create`, `folders:read`, `folders:update`, `folders:delete`

#### News (10)
- `news_articles:create`, `news_articles:read`, `news_articles:update`, `news_articles:delete`
- `news_articles:publish`, `news_articles:bulk_delete`
- `comments:create`, `comments:read`, `comments:update`, `comments:delete`

#### Users & Roles (10)
- `users:create`, `users:read`, `users:update`, `users:delete`, `users:manage_roles`
- `roles:create`, `roles:read`, `roles:update`, `roles:delete`, `roles:manage_permissions`

#### Plus 50 more across:
- Leagues & Seasons (8)
- Settings (5)
- Staff (5)
- Reports (7)
- Notifications (5)
- Game Rules (4)
- Content (4)
- Player of the Week (4)
- Sponsors (4)
- Tournaments (4)

### Roles (6 total)

#### 1. Admin (System)
- **108 permissions** - Full system access
- Cannot be deleted
- Recommended for: Super administrators

#### 2. Editor (System)
- **64 permissions** - Content management
- Can manage: teams, players, matches, news, media, leagues, seasons, staff
- Cannot: manage users or roles
- Recommended for: Content editors, league managers

#### 3. Statistician (System)
- **6 permissions** - Match tracking
- Can: track game events, view match reports
- Recommended for: Scorekeepers, statisticians

#### 4. Content Manager (System)
- **29 permissions** - News and media
- Full access to: news, media, sponsors, POTW, pages
- Recommended for: Content creators, media managers

#### 5. Scorekeeper (System)
- **8 permissions** - Match operations
- Can: track matches, manage game events
- Recommended for: Live game tracking

#### 6. Viewer (System)
- **9 permissions** - Read-only
- Can only view: teams, players, matches, news, media
- Recommended for: Reporters, viewers, guests

---

## 🔄 Re-seeding / Resetting

### Reset and Re-seed Everything

⚠️ **Warning:** This will reset all permissions and roles!

```bash
# 1. Reset database (optional - only if you want clean slate)
npm run db:push -- --force-reset

# 2. Run initialization
node scripts/init-rbac.js
```

### Add Missing Permissions Only

If you just want to add new permissions without affecting existing data:

1. Edit `scripts/enhance-rbac.js`
2. Add your new permissions to `ADDITIONAL_PERMISSIONS` array
3. Run: `node scripts/enhance-rbac.js`

### Update Existing Role Permissions

To change which permissions a role has:

1. Go to `/admin/roles`
2. Click "Edit" on the role
3. Select/deselect permissions
4. Click "Update Role"

**Or via script:**
```javascript
// Create a custom script
const role = await prisma.role.findUnique({ where: { name: 'Editor' } });
const permission = await prisma.permission.findUnique({
  where: { resource_action: { resource: 'teams', action: 'approve' } }
});

await prisma.rolePermission.create({
  data: { roleId: role.id, permissionId: permission.id }
});
```

---

## 🐛 Troubleshooting

### "Admin role not found"

**Problem:** Running `create-admin.js` before seeding roles.

**Solution:**
```bash
node scripts/enhance-rbac.js
node scripts/update-admin-permissions.js
node scripts/create-admin.js
```

### "User already exists"

**Problem:** Email already in database.

**Solution:** The script will ask if you want to assign Admin role to existing user, or use a different email:
```bash
ADMIN_EMAIL=different@email.com node scripts/create-admin.js
```

### "Permission not found"

**Problem:** Missing permissions in database.

**Solution:**
```bash
node scripts/enhance-rbac.js
```

### "Cannot delete role - has users assigned"

**Problem:** Trying to delete a role with users.

**Solution:**
1. Go to `/admin/users`
2. Remove role from all users
3. Then delete the role

---

## 📱 Using the Seeded Data

### Login as Admin

1. Navigate to `/admin/login`
2. Enter credentials:
   - Email: `admin@elevateballers.com`
   - Password: `admin123`
3. Click "Login"
4. **Immediately change your password!**

### Create Additional Users

**Via UI:**
1. Go to `/admin/users`
2. Click "Create User"
3. Fill in details
4. Check the roles to assign
5. Click "Create"

**Via Script:**
```bash
ADMIN_EMAIL=editor@example.com \
ADMIN_PASSWORD=editor123 \
ADMIN_NAME="Content Editor" \
node scripts/create-admin.js
```

Then manually change their role from Admin to Editor in the UI.

### Create Custom Roles

1. Go to `/admin/roles`
2. Click "Create Role"
3. Enter name and description
4. Switch to "Permissions" tab
5. Select permissions (organized by category)
6. Click "Create Role"

---

## 🔐 Security Best Practices

### 1. Change Default Password Immediately
```bash
# Never use admin123 in production!
```

### 2. Use Strong Passwords
```bash
# Good: MyS3cur3P@ssw0rd!2024
# Bad: admin123
```

### 3. Limit Admin Access
- Only assign Admin role to super administrators
- Use Editor or Content Manager for regular staff
- Use Viewer for read-only access

### 4. Regular Audits
```bash
# Check who has what roles
node scripts/verify-rbac.js
```

### 5. Environment Variables
```env
# Never commit these to git!
ADMIN_EMAIL=your-real-email@example.com
ADMIN_PASSWORD=YourActualSecurePassword
```

---

## 📚 Related Documentation

- [RBAC Implementation Summary](./RBAC_IMPLEMENTATION_SUMMARY.md) - Complete implementation details
- [Plan File](../.claude/plans/piped-whistling-tower.md) - Original implementation plan
- [API Documentation](./RBAC_IMPLEMENTATION_SUMMARY.md#usage-guide) - How to use RBAC in code

---

## ✅ Success Checklist

After seeding, you should have:

- [ ] 108 permissions in database
- [ ] 6 system roles created
- [ ] Admin role has all 108 permissions
- [ ] At least 1 admin user created
- [ ] Can login to `/admin/login`
- [ ] Can access `/admin/roles` page
- [ ] Can access `/admin/users` page
- [ ] Verification script passes all checks
- [ ] Test script passes all 7 tests
- [ ] Default password changed

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Full setup | `node scripts/init-rbac.js` |
| Seed permissions/roles | `node scripts/enhance-rbac.js` |
| Update Admin perms | `node scripts/update-admin-permissions.js` |
| Create admin user | `node scripts/create-admin.js` |
| Verify setup | `node scripts/verify-rbac.js` |
| Test permissions | `node scripts/test-rbac-permissions.js` |
| Push schema | `npm run db:push` |

**That's it! Your RBAC system is ready to go! 🚀**
