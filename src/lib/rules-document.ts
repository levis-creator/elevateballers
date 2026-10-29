import { saveFile } from '@/lib/file-storage';
import { prisma } from '@/lib/prisma';
import { getFolderByName } from '@/lib/folder-access';
import { logAudit } from '@/features/cms/lib/audit';

function createPdfFileName(originalName: string): string {
  const baseName = originalName.replace(/\.pdf$/i, '');
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'rules-document';

  return `${slug}-${Date.now()}.pdf`;
}

/**
 * Saves a checked rulebook PDF to the public documents folder and records it in
 * the media library. Callers have already confirmed the bytes are a PDF within
 * the size limit; the object is always stored as application/pdf.
 */
export async function storeRulesDocument(
  request: Request,
  userId: string,
  bytes: Uint8Array,
  originalName: string,
) {
  const fileName = createPdfFileName(originalName);
  const pdf = new File([new Uint8Array(bytes)], fileName, { type: 'application/pdf' });
  const { publicUrl, filePath } = await saveFile('documents', pdf, false, fileName);
  let folder = await getFolderByName('documents');

  if (!folder) {
    folder = await prisma.folder.create({
      data: {
        name: 'documents',
        path: 'public/documents',
        isPrivate: false,
        description: 'Public documents and PDFs',
        createdBy: userId,
      },
    });
  }

  const media = await prisma.media.create({
    data: {
      title: originalName,
      url: publicUrl,
      filePath,
      folderId: folder.id,
      type: 'DOCUMENT',
      size: bytes.byteLength,
      originalSize: bytes.byteLength,
      compressionRatio: 0,
      mimeType: 'application/pdf',
      isPrivate: false,
      uploadedBy: userId,
      tags: ['rules', 'pdf'],
    },
    include: {
      folder: true,
    },
  });
  logAudit(request, 'SETTING_RULES_DOCUMENT_UPLOADED', { mediaId: media.id, fileName, filePath });

  return {
    url: publicUrl,
    filePath,
    fileName,
    mediaId: media.id,
    folder: {
      id: folder.id,
      name: folder.name,
    },
  };
}
