import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { prisma } from '@/lib/prisma';
import { handleApiError, json } from '@/lib/apiError';
import { enforceRateLimit } from '@/lib/rateLimit';
import { deleteR2Object, getR2Object } from '@/lib/r2';
import { resolveSecuritySettings } from '../../../features/settings/application/securitySettings';
import { hasPdfSignature, isUploadId, looksLikePdf, UPLOAD_PART_BYTES, uploadPartKey } from '@/lib/pdf-upload';
import { storeRulesDocument } from '@/lib/rules-document';

export const prerender = false;

/** Joins the pieces sent to `rules-upload-part`, checks the PDF and saves it. */
export const POST: APIRoute = async ({ request }) => {
  let pieces: string[] = [];
  try {
    const user = await requirePermission(request, 'site_settings:manage');
    const security = resolveSecuritySettings(await prisma.siteSetting.findMany({ where: { category: 'security' } }).catch(() => []));
    const limited = await enforceRateLimit(
      `settings:${user.id}:rules-upload`,
      Math.min(security.security_settingsMutationMax, 10),
      Math.max(security.security_settingsMutationWindowMinutes, 10) * 60 * 1000,
      'Too many rules uploads. Please try again shortly.',
    );
    if (limited) return limited;

    const data = await request.json().catch(() => ({}));
    const maxBytes = security.security_documentUploadMaxSizeMB * 1024 * 1024;
    const parts = Number(data?.parts);
    const fileName = typeof data?.fileName === 'string' ? data.fileName.trim() : '';
    if (!isUploadId(data?.uploadId) || !Number.isInteger(parts) || parts < 1 || parts > Math.ceil(maxBytes / UPLOAD_PART_BYTES))
      return json({ error: 'Invalid upload.' }, 400);
    if (!looksLikePdf({ name: fileName, type: '' })) return json({ error: 'Only PDF files are allowed' }, 400);

    pieces = Array.from({ length: parts }, (_, index) => uploadPartKey(data.uploadId, index));
    const buffers = await Promise.all(pieces.map((key) => getR2Object(key).catch(() => null)));
    if (buffers.some((buffer) => !buffer))
      return json({ error: 'Part of the upload is missing. Please try again.' }, 400);

    const bytes = new Uint8Array(Buffer.concat(buffers as Buffer[]));
    if (bytes.byteLength > maxBytes)
      return json({ error: `The PDF exceeds the ${security.security_documentUploadMaxSizeMB} MB limit.` }, 413);
    if (!hasPdfSignature(bytes)) return json({ error: 'This file is not a valid PDF.' }, 400);

    return json(await storeRulesDocument(request, user.id, bytes, fileName), 200);
  } catch (error) {
    console.error('Error completing rules PDF upload:', error);
    return handleApiError(error, 'complete rules PDF upload', request);
  } finally {
    // The pieces are only needed until they are joined.
    await Promise.allSettled(pieces.map((key) => deleteR2Object(key)));
  }
};
