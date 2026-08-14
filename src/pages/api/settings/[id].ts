import type { APIRoute } from 'astro';
import { siteSettingsService } from '../../../features/settings';
import { requirePermission } from '../../../features/rbac/middleware';
import { getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';

import { handleApiError } from '../../../lib/apiError';
import { maskSensitiveSetting } from '../../../features/settings/application/sensitiveSettingValues';
import { enforceRateLimit } from '../../../lib/rateLimit';
export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    const setting = await siteSettingsService.get(params.id!);

    if (!setting) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(maskSensitiveSetting(setting)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return handleApiError(error, "fetch setting");
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const user = await requirePermission(request, 'site_settings:manage');
    const limited = await enforceRateLimit(
      `settings:${user.id}:update`,
      30,
      10 * 60 * 1000,
      'Too many settings changes. Please try again shortly.',
    );
    if (limited) return limited;
    const data = await request.json();

    const setting = await siteSettingsService.update(params.id!, data);

    if (!setting) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'SETTING_UPDATED', adminId, {
      settingId: setting.id,
      key: setting.key,
      category: setting.category,
    }).catch(() => {});

    return new Response(JSON.stringify(maskSensitiveSetting(setting)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update setting', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const user = await requirePermission(request, 'site_settings:manage');
    const limited = await enforceRateLimit(
      `settings:${user.id}:delete`,
      10,
      10 * 60 * 1000,
      'Too many settings deletions. Please try again shortly.',
    );
    if (limited) return limited;
    const success = await siteSettingsService.remove(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'SETTING_DELETED', adminId, {
      settingId: params.id,
    }).catch(() => {});

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete setting', request);
  }
};
