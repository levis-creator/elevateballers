import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { getUserIdFromRequest } from '../../../features/cms/lib/auth';
import { sendEmailChangedAlert } from '../../../lib/email';

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

        const user = await prisma.user.findUnique({
            where: { id },
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
        });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const transformedUser = {
            ...user,
            roles: user.userRoles.map(ur => ur.role),
            userRoles: undefined,
        };

        return new Response(JSON.stringify(transformedUser), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to fetch user' }),
            {
                status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

// PUT /api/users/[id] - Update user (name, email, active status)
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        await requirePermission(request, 'users:update');
        const { id } = params;
        const data = await request.json();

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

        if (typeof data.active === 'boolean') {
            updateData.active = data.active;
        }

        const adminId = getUserIdFromRequest(request) ?? 'unknown';

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
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
            }
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
                name: updatedUser.name,
                oldEmail: existing.email,
                newEmail: data.email,
            }).catch((err) => console.error('[users] Email change alert failed:', err));
        }

        const response = {
            ...updatedUser,
            roles: updatedUser.userRoles.map(ur => ur.role),
            userRoles: undefined,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to update user' }),
            {
                status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

// DELETE /api/users/[id] - Delete user
export const DELETE: APIRoute = async ({ request, params }) => {
    try {
        await requirePermission(request, 'users:delete');
        const { id } = params;

        if (!id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await prisma.user.delete({ where: { id } });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to delete user' }),
            {
                status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
