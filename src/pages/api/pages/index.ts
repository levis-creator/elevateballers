import type { APIRoute } from 'astro';
import { getAllPageContents, getPageContentBySlug } from '../../../features/cms/lib/queries';
import { createPageContent } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const admin = url.searchParams.get('admin') === 'true';

    if (slug) {
      const page = await getPageContentBySlug(slug);
      if (!page) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Only return published pages for public access
      if (!admin && !page.published) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(page), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all pages (admin only)
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pages = await getAllPageContents();
    return new Response(JSON.stringify(pages), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    if (!data.slug || !data.title || !data.content) {
      return new Response(
        JSON.stringify({ error: 'Slug, title, and content are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const page = await createPageContent({
      slug: data.slug,
      title: data.title,
      content: data.content,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      published: data.published !== undefined ? data.published : true,
    });

    return new Response(JSON.stringify(page), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating page:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create page' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

