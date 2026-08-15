import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { saveFile } from '@/lib/file-storage';
import { prisma } from '@/lib/prisma';
import { getFolderByName } from '@/lib/folder-access';
import { handleApiError } from '@/lib/apiError';
import { enforceRateLimit } from '@/lib/rateLimit';
import { resolveSecuritySettings } from '../../../features/settings/application/securitySettings';

export const prerender = false;

function createPdfFileName(originalName: string): string {
  const baseName = originalName.replace(/\.pdf$/i, '');
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'rules-document';

  return `${slug}-${Date.now()}.pdf`;
}

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

    if (file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileName = createPdfFileName(file.name);
    const { publicUrl, filePath } = await saveFile('documents', file, false, fileName);
    let folder = await getFolderByName('documents');

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: 'documents',
          path: 'public/documents',
          isPrivate: false,
          description: 'Public documents and PDFs',
          createdBy: user.id,
        },
      });
    }

    const media = await prisma.media.create({
      data: {
        title: file.name,
        url: publicUrl,
        filePath,
        folderId: folder.id,
        type: 'DOCUMENT',
        size: file.size,
        originalSize: file.size,
        compressionRatio: 0,
        mimeType: file.type,
        isPrivate: false,
        uploadedBy: user.id,
        tags: ['rules', 'pdf'],
      },
      include: {
        folder: true,
      },
    });

    return new Response(
      JSON.stringify({
        url: publicUrl,
        filePath,
        fileName,
        mediaId: media.id,
        folder: {
          id: folder.id,
          name: folder.name,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error uploading rules PDF:', error);
    return handleApiError(error, 'upload rules PDF', request);
  }
};
