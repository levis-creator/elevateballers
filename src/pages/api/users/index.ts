import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { prisma } from '../../../lib/prisma';
import { createUser, getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendWelcomeSetPasswordEmail } from '../../../lib/email';
import { getRuntimeEmailTemplates } from '../../../lib/email/runtime-settings';
import { handleApiError } from '../../../lib/apiError';
import { COACH_ROLE_NAME, MAX_COACH_TEAMS } from '../../../features/users/domain/entities/user-directory';
import { userSelect, toUserRow } from '../../../features/users/data/datasources/queries/user-row';

export const prerender = false;

// GET /api/users - List users
export const GET: APIRoute = async ({ request }) => {
    try {
        await requirePermission(request, 'users:read');

        const url = new URL(request.url);
        const roleName = url.searchParams.get('role');

        const users = await prisma.user.findMany({
            where: roleName ? { userRoles: { some: { role: { name: roleName } } } } : {},
            select: userSelect,
            orderBy: { createdAt: 'desc' },
        });

        const rows = await Promise.all(users.map(toUserRow));

        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return handleApiError(error, 'fetch users', request);
    }
};

// POST /api/users - Create user
// Admin provides name + email (+ optional phone, roles, coach team scope).
// A welcome email is sent so the user can set their own password.
export const POST: APIRoute = async ({ request }) => {
    try {
        await requirePermission(request, 'users:create');
        const data = await request.json();

        if (!data.email || !data.name) {
            return new Response(
                JSON.stringify({ error: 'Email and name are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            return new Response(
                JSON.stringify({ error: 'A user with this email already exists' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const roleIds: string[] = Array.isArray(data.roleIds) ? data.roleIds : [];
        const teamIds: string[] = Array.isArray(data.teamIds) ? data.teamIds : [];

        let roles: Array<{ id: string; name: string }> = [];
        if (roleIds.length > 0) {
            roles = await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } });
            if (roles.length !== roleIds.length) {
                return new Response(JSON.stringify({ error: 'One or more role IDs are invalid' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }
        const isCoach = roles.some((r) => r.name === COACH_ROLE_NAME);
        if (isCoach && teamIds.length > MAX_COACH_TEAMS) {
            return new Response(JSON.stringify({ error: `A ${COACH_ROLE_NAME} can hold at most ${MAX_COACH_TEAMS} clubs` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Create user with a random unusable temporary password — user will set their own via the welcome email
        const tempPassword = crypto.randomBytes(32).toString('hex');
        const newUser = await createUser(data.email, tempPassword, data.name);

        await prisma.user.update({ where: { id: newUser.id }, data: { phone: data.phone || null } });

        if (roles.length > 0) {
            await prisma.userRole.createMany({ data: roles.map((r) => ({ userId: newUser.id, roleId: r.id })) });
        }
        if (isCoach && teamIds.length > 0) {
            await prisma.teamOwnership.createMany({
                data: teamIds.map((teamId) => ({ teamId, userId: newUser.id, email: newUser.email, role: COACH_ROLE_NAME, verifiedAt: new Date() })),
            });
        }
        if (typeof data.notifyEmail === 'boolean') {
            await prisma.userNotificationSetting.upsert({
                where: { userId: newUser.id },
                create: { userId: newUser.id, emailEnabled: data.notifyEmail },
                update: { emailEnabled: data.notifyEmail },
            });
        }

        // Generate a password reset token so the user can set their password
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const ttlMinutes = (await getRuntimeEmailTemplates()).linkExpiry;
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        await prisma.passwordResetToken.create({
            data: { userId: newUser.id, tokenHash, expiresAt },
        });

        const origin = new URL(request.url).origin;
        const setPasswordUrl = `${origin}/admin/reset-password?token=${token}`;

        try {
            await sendWelcomeSetPasswordEmail({
                email: newUser.email,
                name: newUser.name,
                setPasswordUrl,
                expiresInMinutes: ttlMinutes,
            });
        } catch (emailError) {
            console.error('[users] Failed to send welcome email:', emailError);
            // Non-fatal: user is created, admin can send a reset email manually
        }

        const adminId = getUserIdFromRequest(request) ?? 'unknown';
        await writeAuditLog(newUser.id, 'USER_CREATED', adminId, { email: newUser.email, name: newUser.name, roles: roles.map((r) => r.name) }).catch(() => {});

        const created = await prisma.user.findUnique({ where: { id: newUser.id }, select: userSelect });
        const userResponse = created ? await toUserRow(created) : null;

        return new Response(JSON.stringify({ user: userResponse }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return handleApiError(error, 'create user', request);
    }
};
