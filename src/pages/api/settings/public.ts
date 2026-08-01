import type { APIRoute } from 'astro';
import { siteSettingsService } from '../../../features/settings';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;

    const filtered = await siteSettingsService.listPublic(category || undefined);

    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return handleApiError(error, "fetch settings");
  }
};
