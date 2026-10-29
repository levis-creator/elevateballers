import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { prisma } from '@/lib/prisma';
import { handleApiError, json } from '@/lib/apiError';
import { enforceRateLimit } from '@/lib/rateLimit';
import { isR2Configured, putR2Object } from '@/lib/r2';
import { resolveSecuritySettings } from '../../../features/settings/application/securitySettings';
import { isUploadId, UPLOAD_PART_BYTES, uploadPartKey } from '@/lib/pdf-upload';

export const prerender = false;

/** Stores one piece of a large rulebook PDF; `rules-upload-complete` joins them. */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requirePermission(request, 'site_settings:manage');
    const security = resolveSecuritySettings(await prisma.siteSetting.findMany({ where: { category: 'security' } }).catch(() => []));
    const limited = await enforceRateLimit(
      `settings:${user.id}:rules-upload-part`,
      200,
      10 * 60 * 1000,
      'Too many upload requests. Please try again shortly.',
    );
    if (limited) return limited;
    if (!(await isR2Configured())) return json({ error: 'Large PDFs need R2 storage, which is not configured.' }, 409);

    const formData = await request.formData();
    const uploadId = formData.get('uploadId');
    const index = Number(formData.get('index'));
    const part = formData.get('part');
    const maxParts = Math.ceil((security.security_documentUploadMaxSizeMB * 1024 * 1024) / UPLOAD_PART_BYTES);

    if (!isUploadId(uploadId) || !Number.isInteger(index) || index < 0 || index >= maxParts)
      return json({ error: 'Invalid upload piece.' }, 400);
    if (!(part instanceof File) || part.size === 0 || part.size > UPLOAD_PART_BYTES)
      return json({ error: 'Invalid upload piece.' }, 400);

    await putR2Object(uploadPartKey(uploadId, index), Buffer.from(await part.arrayBuffer()));
    return json({ ok: true }, 200);
  } catch (error) {
    console.error('Error uploading rules PDF piece:', error);
    return handleApiError(error, 'upload rules PDF piece', request);
  }
};
