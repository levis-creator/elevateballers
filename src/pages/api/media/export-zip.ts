import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { promises as fs } from 'fs';
import { join } from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const { filePaths } = await request.json();

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No file paths provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For now, return a simple response with file URLs
    // In production, you would use a ZIP library like 'archiver' or 'jszip'
    // This is a placeholder that returns JSON with file URLs for client-side ZIP creation
    const projectRoot = process.cwd();
    const files: Array<{ path: string; url: string; name: string }> = [];

    for (const filePath of filePaths) {
      try {
        const normalizedPath = filePath.startsWith('public/')
          ? filePath
          : `public/${filePath}`;
        const fullPath = join(projectRoot, normalizedPath);
        
        // Check if file exists
        try {
          await fs.access(fullPath);
          const fileName = filePath.split('/').pop() || 'file';
          const url = `/${normalizedPath}`;
          files.push({ path: fullPath, url, name: fileName });
        } catch {
          console.warn(`File not found: ${fullPath}`);
        }
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }

    // Return file information for client-side ZIP creation
    // Client will need to fetch each file and create ZIP using JSZip
    return new Response(
      JSON.stringify({ files }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error exporting ZIP:', error);
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
