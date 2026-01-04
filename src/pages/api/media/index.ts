import type { APIRoute } from 'astro';
import { getMedia } from '../../../features/cms/lib/queries';
import { createMedia } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || undefined;

    const mediaItems = await getMedia(type);

    return new Response(JSON.stringify(mediaItems), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.url || !data.type) {
      return new Response(
        JSON.stringify({ error: 'Title, URL, and type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const mediaItem = await createMedia({
      title: data.title,
      url: data.url,
      type: data.type,
      thumbnail: data.thumbnail,
      tags: data.tags || [],
    });

    return new Response(JSON.stringify(mediaItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating media:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create media' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

