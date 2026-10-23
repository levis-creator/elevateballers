import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import { readFile } from '@/lib/file-storage';

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'contact_messages:read');
    if (!params.id || !params.attachmentId) return new Response('Attachment not found', { status: 404 });
    const attachment = await prisma.messageAttachment.findFirst({ where: { id: params.attachmentId, messageId: params.id } });
    if (!attachment || attachment.scanStatus !== 'CLEAN' || !attachment.storagePath) return new Response('Attachment is not available for download.', { status: 404 });
    const content = await readFile(attachment.storagePath);
    const filename = attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return new Response(content, { status: 200, headers: {
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(content.length),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    } });
  } catch (error) {
    return handleApiError(error, 'download message attachment', request);
  }
};
