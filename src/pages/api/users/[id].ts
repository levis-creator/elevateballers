import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAdmin, hashPassword } from '../../../features/cms/lib/auth';
import type { UserRole } from '../../../features/cms/types';

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
                role: true,
                createdAt: true,
                updatedAt: true,
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

        return new Response(JSON.stringify(user), {
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

// PUT /api/users/[id] - Update user
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const callingUser = await requirePermission(request, 'users:read');
        const { id } = params;
        const data = await request.json();

        if (!id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { id },
        });

        if (!existing) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Prepare update data
        const updateData: any = {
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
        };

        // If password is provided, hash it
        if (data.password && data.password.trim() !== '') {
            updateData.passwordHash = await hashPassword(data.password);
        }

        // Prevent removing your own admin status if you are the only admin (optional safety check, but keeping it simple for now)
        // Basic check: Cannot demote yourself if you are editing your own profile? 
        // Usually admin panels list other users. If editing self, handle with care.
        if (existing.id === callingUser.id && data.role && data.role !== 'ADMIN') {
            // Logic to prevent removing own admin rights if desired, but user might want to.
            // Let's allow it but maybe warn on frontend.
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                updatedAt: true,
            }
        });

        return new Response(JSON.stringify(updatedUser), {
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
        const callingUser = await requirePermission(request, 'users:read');
        const { id } = params;

        if (!id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Prevent deleting yourself
        if (id === callingUser.id) {
            return new Response(JSON.stringify({ error: 'You cannot delete your own account' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await prisma.user.delete({
            where: { id },
        });

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
