import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError, json } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'contact_messages:read');
    if (!params.id) return json({ error: 'Message ID is required' }, 400);
    const message = await prisma.contactMessage.findUnique({ where: { id: params.id }, select: { id: true, threadId: true } });
    if (!message) return json({ error: 'Message not found' }, 404);
    const threadId = message.threadId || message.id;
    const data = await prisma.contactMessage.findMany({ where: { OR: [{ threadId }, { id: threadId }] }, include: { attachments: { select: { id: true, filename: true, mimeType: true, size: true, contentId: true, scanStatus: true } } }, orderBy: { createdAt: 'asc' } });
    return json({ data }, 200);
  } catch (error) {
    return handleApiError(error, 'fetch message thread', request);
  }
};
