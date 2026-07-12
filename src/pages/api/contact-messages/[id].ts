import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Delete a single contact message. */
export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'contact_messages:read');

    const id = params.id;
    if (!id) return json({ error: 'Missing message id' }, 400);

    try {
      await prisma.contactMessage.delete({ where: { id } });
    } catch {
      // Already gone — treat as success (idempotent).
      return json({ ok: true, alreadyDeleted: true }, 200);
    }

    return json({ ok: true }, 200);
  } catch (error) {
    return handleApiError(error, 'delete contact message', request);
  }
};
