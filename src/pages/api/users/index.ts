import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { prisma } from '../../../lib/prisma';
import { createUser, getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendWelcomeSetPasswordEmail } from '../../../lib/email';
import type { UserRole } from '../../../features/cms/types';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

// GET /api/users - List users
export const GET: APIRoute = async ({ request }) => {
    try {
        await requirePermission(request, 'users:read');

        const url = new URL(request.url);
        const role = url.searchParams.get('role');

        const where: any = {};
        if (role) {
            where.role = role as UserRole;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                activatedAt: true,
                createdAt: true,
                updatedAt: true,
                userRoles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        newsArticles: true,
                        uploadedMedia: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const transformedUsers = users.map(user => ({
            ...user,
            roles: user.userRoles.map(ur => ur.role),
            userRoles: undefined,
        }));

        return new Response(JSON.stringify(transformedUsers), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return handleApiError(error, 'fetch users', request);
    }
};

// POST /api/users - Create user
// Admin provides name + email only. A welcome email is sent to the user so they can set their own password.
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

        // Create user with a random unusable temporary password — user will set their own via the welcome email
        const tempPassword = crypto.randomBytes(32).toString('hex');
        const newUser = await createUser(data.email, tempPassword, data.name);

        // Generate a password reset token so the user can set their password
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const raw = process.env.INVITE_TTL_MINUTES;
        const ttlMinutes = raw && Number.isFinite(+raw) && +raw > 0 ? +raw : 1440; // 24 hours default
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
        await writeAuditLog(newUser.id, 'USER_CREATED', adminId, { email: newUser.email, name: newUser.name }).catch(() => {});

        const { passwordHash: _, ...userResponse } = newUser as any;

        return new Response(JSON.stringify({ user: userResponse }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return handleApiError(error, 'create user', request);
    }
};
