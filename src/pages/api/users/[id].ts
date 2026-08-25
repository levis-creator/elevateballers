import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { requireSystemAdmin } from '@/features/rbac/auth-helpers';
import { getUserIdFromRequest, invalidateSessions, writeAuditLog } from '../../../features/cms/lib/auth';
import { sendEmailChangedAlert } from '../../../lib/email';
import { handleApiError } from '../../../lib/apiError';
import { userSelect, toUserRow } from '../../../features/users/data/datasources/queries/user-row';
import { ADMIN_ROLE_NAME } from '../../../features/users/domain/entities/user-directory';

export const prerender = false;

// GET /api/users/[id] - Get single user
export const GET: APIRoute = async ({ request, params }) => {
    try {
        await requirePermission(request, 'users:read');
        const { id } = params;

        if (!id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const user = await prisma.user.findUnique({ where: { id }, select: userSelect });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(await toUserRow(user)), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return handleApiError(error, 'fetch user', request);
    }
};

// PUT /api/users/[id] - Update user (name, email, phone, active status)
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const { id } = params;
        const data = await request.json();
        await (typeof data.active === 'boolean' ? requireSystemAdmin(request) : requirePermission(request, 'users:update'));

        if (!id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const emailChanged = data.email && data.email !== existing.email;

        // Validate new email is not already taken by another user
        if (emailChanged) {
            const conflict = await prisma.user.findUnique({ where: { email: data.email } });
            if (conflict) {
                return new Response(
                    JSON.stringify({ error: 'This email address is already in use.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        const updateData: any = {
            name: data.name,
            email: data.email,
        };
        if (typeof data.phone === 'string' || data.phone === null) {
            updateData.phone = data.phone || null;
        }

        // Suspending the last remaining admin would lock everyone out of the CMS.
        const deactivating = typeof data.active === 'boolean' && !data.active && existing.active;
        if (deactivating) {
            const adminRoleCount = await prisma.userRole.count({
                where: { role: { name: ADMIN_ROLE_NAME }, user: { active: true, id: { not: id } } },
            });
            const isLastAdmin = adminRoleCount === 0 && (await prisma.userRole.count({ where: { userId: id, role: { name: ADMIN_ROLE_NAME } } })) > 0;
            if (isLastAdmin) {
                return new Response(
                    JSON.stringify({ error: 'This is the last admin account — suspending it would lock everyone out.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
        if (typeof data.active === 'boolean') {
            updateData.active = data.active;
        }

        const adminId = getUserIdFromRequest(request) ?? 'unknown';

        await prisma.user.update({ where: { id }, data: updateData });

        // Invalidate all sessions if user was deactivated
        if (deactivating) {
            await invalidateSessions(id);
        }

        // Audit log
        await writeAuditLog(id, 'USER_UPDATED', adminId, {
            changes: {
                ...(data.name !== existing.name ? { name: { from: existing.name, to: data.name } } : {}),
                ...(emailChanged ? { email: { from: existing.email, to: data.email } } : {}),
                ...(typeof data.active === 'boolean' && data.active !== existing.active
                    ? { active: { from: existing.active, to: data.active } }
                    : {}),
            },
        });

        // Log and notify on email change
        if (emailChanged) {
            await prisma.userEmailHistory.create({
                data: {
                    userId: id,
                    oldEmail: existing.email,
                    newEmail: data.email,
                    changedBy: adminId,
                },
            });

            sendEmailChangedAlert({
                name: data.name ?? existing.name,
                oldEmail: existing.email,
                newEmail: data.email,
            }).catch((err) => console.error('[users] Email change alert failed:', err));
        }

        const updated = await prisma.user.findUnique({ where: { id }, select: userSelect });

        return new Response(JSON.stringify(updated ? await toUserRow(updated) : null), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return handleApiError(error, 'update user', request);
    }
};

// DELETE /api/users/[id] - Delete user
export const DELETE: APIRoute = async ({ request, params }) => {
    try {
        await requireSystemAdmin(request);
        const { id } = params;

        if (!id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const adminId = getUserIdFromRequest(request) ?? 'unknown';

        if (adminId === id) {
            return new Response(JSON.stringify({ error: 'You cannot remove your own account.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const target = await prisma.user.findUnique({
            where: { id },
            select: { email: true, name: true, userRoles: { select: { role: { select: { name: true } } } } },
        });
        if (!target) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const targetIsAdmin = target.userRoles.some((ur) => ur.role.name === ADMIN_ROLE_NAME);
        if (targetIsAdmin) {
            const otherAdmins = await prisma.userRole.count({
                where: { role: { name: ADMIN_ROLE_NAME }, userId: { not: id } },
            });
            if (otherAdmins === 0) {
                return new Response(
                    JSON.stringify({ error: 'This is the last admin account — removing it would lock everyone out.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        await prisma.user.delete({ where: { id } });

        // Best-effort audit log — user row is gone so we write to a generic entry
        await writeAuditLog(id, 'USER_DELETED', adminId, { email: target.email, name: target.name }).catch(() => {});

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return handleApiError(error, 'delete user', request);
    }
};
