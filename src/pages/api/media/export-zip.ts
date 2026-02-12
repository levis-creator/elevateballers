import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { getFileUrl, fileExists } from '../../../lib/file-storage';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:export');
    const { filePaths } = await request.json();

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No file paths provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const files: Array<{ url: string; name: string }> = [];

    for (const filePath of filePaths) {
      try {
        // Check if file exists in storage
        const exists = await fileExists(filePath);

        if (exists) {
          const fileName = filePath.split('/').pop() || 'file';
          // Determine if private based on path
          const isPrivate = filePath.includes('/private/') || filePath.startsWith('uploads/private/');
          const url = getFileUrl(filePath, isPrivate);

          files.push({ url, name: fileName });
        } else {
          console.warn(`File not found in storage: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }

    // Return file information for client-side ZIP creation
    return new Response(
      JSON.stringify({ files }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error exporting ZIP info:', error);
    return new Response(
      JSON.stringify({
        error: error.message === 'Unauthorized' || error.message.includes('Forbidden')
          ? 'Unauthorized'
          : error.message || 'Failed to export files',
      }),
      { status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
