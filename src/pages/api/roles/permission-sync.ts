import type { APIRoute } from 'astro';
import { requireRole } from '../../../features/rbac/middleware';
import { findMissingPermissions, loadPermissionsFromCsv } from '../../../lib/syncPermissions';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';
import { enforceRateLimit } from '../../../lib/rateLimit';
import { json, handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireRole(request, 'Admin');
    const canonical = loadPermissionsFromCsv();
    if (!canonical || canonical.length === 0) throw new Error('Canonical permission catalogue is unavailable or empty');
    const missing = await findMissingPermissions();
    return json({
      canonicalCount: canonical.length,
      missingCount: missing.length,
      permissions: missing.map(({ resource, action, description, category }) => ({ resource, action, description, category })),
      canApply: missing.length > 0,
    }, 200);
  } catch (error) {
    return handleApiError(error, 'preview permission sync', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireRole(request, 'Admin');
    const limited = await enforceRateLimit(
      `permission-sync:${user.id}`,
      3,
      10 * 60 * 1000,
      'Permission sync is temporarily rate-limited. Please try again shortly.',
    );
    if (limited) return limited;

    const body = await request.json().catch(() => null) as { confirm?: unknown } | null;
    if (body?.confirm !== true) return json({ error: 'Explicit confirmation is required to apply permission sync.' }, 400);

    const canonical = loadPermissionsFromCsv();
    if (!canonical || canonical.length === 0) throw new Error('Canonical permission catalogue is unavailable or empty');
    const missing = await findMissingPermissions();
    if (missing.length > 0) {
      await prisma.permission.createMany({
        data: missing,
        skipDuplicates: true,
      });
    }

    const actorId = getUserIdFromRequest(request) ?? user.id;
    await writeAuditLog(actorId, 'PERMISSIONS_SYNC_APPLIED', actorId, {
      createdCount: missing.length,
      canonicalCount: canonical.length,
      roleAssignmentsChanged: 0,
    }).catch(() => {});

    return json({ applied: true, createdCount: missing.length, roleAssignmentsChanged: 0 }, 200);
  } catch (error) {
    return handleApiError(error, 'apply permission sync', request);
  }
};
