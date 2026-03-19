import type { APIRoute } from 'astro';
import { getCurrentUser, hashPassword } from '../../../features/cms/lib/auth';
import { prisma } from '../../../lib/prisma';
import { getUserWithPermissions } from '../../../features/rbac/permissions';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user with roles and permissions
    const userWithPermissions = await getUserWithPermissions(user.id);

    if (!userWithPermissions) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        user: userWithPermissions,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const { name, email, password } = data;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await logAudit(request, 'AUTH_PROFILE_UPDATED', {
      userId: user.id,
      updatedFields: Object.keys(updateData),
    }, user.id);

    // Get updated user with roles and permissions
    const updatedUserWithPermissions = await getUserWithPermissions(user.id);

    return new Response(
      JSON.stringify({
        user: updatedUserWithPermissions,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    await logAudit(request, 'AUTH_ACCOUNT_DELETED', {
      userId: user.id,
    }, user.id);

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
      },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
