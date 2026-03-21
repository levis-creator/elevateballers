import type { APIRoute } from 'astro';
import { getAllSiteSettings } from '../../../features/cms/lib/queries';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

const PUBLIC_CATEGORIES = new Set(['appearance']);
const PUBLIC_KEYS = new Set(['header_banner_image_url']);

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;

    if (category && !PUBLIC_CATEGORIES.has(category)) {
      return new Response(JSON.stringify({ error: 'Category not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const settings = await getAllSiteSettings(category || undefined);
    const filtered = settings.filter((s) => PUBLIC_KEYS.has(s.key));

    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return handleApiError(error, "fetch settings");
  }
};
