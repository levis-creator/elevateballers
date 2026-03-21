import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { deleteFile } from '@/lib/file-storage';
import { prisma } from '@/lib/prisma';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:manage');

    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== 'string') {
      return new Response(JSON.stringify({ error: 'File path is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only delete app-managed public rules uploads.
    if (!filePath.startsWith('uploads/public/documents/')) {
      return new Response(JSON.stringify({ error: 'Invalid managed file path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.media.deleteMany({
      where: {
        filePath,
      },
    });

    const deleted = await deleteFile(filePath);

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'File not found or could not be deleted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'delete rules PDF', request);
  }
};
