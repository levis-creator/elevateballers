import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/apiError';
import { enforceRateLimit } from '@/lib/rateLimit';
import { resolveSecuritySettings } from '../../../features/settings/application/securitySettings';
import { hasPdfSignature, looksLikePdf } from '@/lib/pdf-upload';
import { storeRulesDocument } from '@/lib/rules-document';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!looksLikePdf(file)) {
      return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const maxDocumentBytes = security.security_documentUploadMaxSizeMB * 1024 * 1024;
    if (file.size > maxDocumentBytes) {
      return new Response(JSON.stringify({ error: `The PDF exceeds the ${security.security_documentUploadMaxSizeMB} MB limit.` }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Browsers report PDFs inconsistently, so the bytes decide, and the stored
    // object is always served as application/pdf.
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasPdfSignature(bytes)) {
      return new Response(JSON.stringify({ error: 'This file is not a valid PDF.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stored = await storeRulesDocument(request, user.id, bytes, file.name);
    return new Response(JSON.stringify(stored), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error uploading rules PDF:', error);
    return handleApiError(error, 'upload rules PDF', request);
  }
};
