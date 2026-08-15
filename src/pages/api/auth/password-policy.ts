import type { APIRoute } from 'astro';
import { siteSettingsService, resolveSecuritySettings } from '../../../features/settings';
import { handleApiError, json } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const security = resolveSecuritySettings(await siteSettingsService.list('security').catch(() => []));
    return json({ minLength: security.security_passwordMinLength }, 200);
  } catch (error) {
    return handleApiError(error, 'get password policy', request);
  }
};
