import type { APIRoute } from 'astro';
import { siteSettingsService } from '../../../features/settings';
import { requirePermission } from '../../../features/rbac/middleware';
import { getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';

import { handleApiError } from '../../../lib/apiError';
import { maskSensitiveSetting } from '../../../features/settings/application/sensitiveSettingValues';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;

    const settings = await siteSettingsService.list(category || undefined);

    return new Response(JSON.stringify(settings.map(maskSensitiveSetting)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return handleApiError(error, "fetch settings");
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:manage');
    const data = await request.json();

    const setting = await siteSettingsService.create({
      key: data.key,
      value: data.value,
      type: data.type || 'text',
      label: data.label,
      description: data.description,
      category: data.category,
    });

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'SETTING_CREATED', adminId, {
      settingId: setting.id,
      key: setting.key,
      category: setting.category,
    }).catch(() => {});

    return new Response(JSON.stringify(maskSensitiveSetting(setting)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create setting', request);
  }
};
