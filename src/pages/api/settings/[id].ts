import type { APIRoute } from 'astro';
import { getSiteSettingByKey } from '../../../features/settings/lib/queries/siteSettings';
import { updateSiteSetting, deleteSiteSetting } from '../../../features/settings/lib/mutations/siteSettings';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { getUserIdFromRequest, writeAuditLog } from '@/features/auth/lib/auth';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    // Try to get by ID first, then by key
    const setting = await getSiteSettingByKey(params.id!);

    if (!setting) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(setting), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return handleApiError(error, "fetch setting");
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'site_settings:manage');
    const data = await request.json();

    const setting = await updateSiteSetting(params.id!, data);

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

    return new Response(JSON.stringify(setting), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update setting', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'site_settings:manage');
    const success = await deleteSiteSetting(params.id!);

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
