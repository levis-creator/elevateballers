import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAdmin, createUser } from '../../../features/cms/lib/auth';
import { requirePermission } from '../../../features/rbac/middleware';
import type { UserRole } from '../../../features/cms/types';

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
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform to include roles array
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
        return new Response(JSON.stringify({ error: error.message || 'Failed to fetch users' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// POST /api/users - Create user
export const POST: APIRoute = async ({ request }) => {
    try {
        await requirePermission(request, 'users:create');
        const data = await request.json();

        if (!data.email || !data.password || !data.name) {
            return new Response(
                JSON.stringify({ error: 'Email, password, and name are required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const newUser = await createUser(
            data.email,
            data.password,
            data.name,
            data.role as UserRole || 'EDITOR'
        );

        // Return the user without the password hash
        const { passwordHash, ...userResponse } = newUser;

        return new Response(JSON.stringify(userResponse), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to create user' }),
            {
                status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
