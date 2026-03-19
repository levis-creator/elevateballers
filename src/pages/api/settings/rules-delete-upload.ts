import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { deleteFile } from '@/lib/file-storage';
import { prisma } from '@/lib/prisma';

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
      return new Response(JSON.stringify({ error: 'Failed to delete file' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting old rules PDF:', error);

    return new Response(
      JSON.stringify({
        error:
          error.message === 'Unauthorized' || error.message?.includes('Forbidden')
            ? 'Unauthorized'
            : error.message || 'Failed to delete old rules PDF',
      }),
      {
        status:
          error.message === 'Unauthorized' || error.message?.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
