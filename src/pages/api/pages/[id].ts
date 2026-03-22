import type { APIRoute } from 'astro';
import { getPageContentById } from '../../../features/settings/lib/queries/pageContent';
import { updatePageContent, deletePageContent } from '../../../features/settings/lib/mutations/pageContent';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'page_contents:read');
    const page = await getPageContentById(params.id!);

    if (!page) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(page), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch page', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'page_contents:update');
    const data = await request.json();

    const page = await updatePageContent(params.id!, data);

    if (!page) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(page), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update page', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'page_contents:update');
    const success = await deletePageContent(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete page' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete page', request);
  }
};
