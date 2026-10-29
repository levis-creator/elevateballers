import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveFile: vi.fn(),
  mediaCreate: vi.fn(),
}));

vi.mock('@/features/rbac/middleware', () => ({ requirePermission: vi.fn(async () => ({ id: 'admin-1' })) }));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/file-storage', () => ({ saveFile: mocks.saveFile }));
vi.mock('@/lib/folder-access', () => ({ getFolderByName: vi.fn(async () => ({ id: 'folder-1', name: 'documents' })) }));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/apiError', () => ({
  handleApiError: vi.fn(() => new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 })),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    siteSetting: { findMany: vi.fn(async () => []) },
    media: { create: mocks.mediaCreate },
    folder: { create: vi.fn() },
  },
}));

import { POST } from '../rules-upload';

function upload(file: File): Request {
  const body = new FormData();
  body.append('file', file);
  return new Request('https://example.test/api/settings/rules-upload', { method: 'POST', body });
}

const pdfBytes = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n');

describe('rules PDF upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.saveFile.mockResolvedValue({ publicUrl: 'https://cdn.example/rules.pdf', filePath: 'uploads/public/documents/rules.pdf' });
    mocks.mediaCreate.mockResolvedValue({ id: 'media-1' });
  });

  it('accepts a PDF the browser sent without a type and stores it as application/pdf', async () => {
    const response = await POST({ request: upload(new File([pdfBytes], 'Rulebook 2026.pdf', { type: '' })) } as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ url: 'https://cdn.example/rules.pdf' });
    const stored = mocks.saveFile.mock.calls[0][1] as File;
    expect(stored.type).toBe('application/pdf');
    expect(mocks.mediaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ mimeType: 'application/pdf' }) })
    );
  });

  it('accepts the application/x-pdf type some Windows setups report', async () => {
    const response = await POST({ request: upload(new File([pdfBytes], 'rules.pdf', { type: 'application/x-pdf' })) } as any);
    expect(response.status).toBe(200);
  });

  it('rejects a file named .pdf that is not a PDF', async () => {
    const response = await POST({
      request: upload(new File([new TextEncoder().encode('PK\u0003\u0004')], 'rules.pdf', { type: 'application/pdf' })),
    } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'This file is not a valid PDF.' });
    expect(mocks.saveFile).not.toHaveBeenCalled();
  });

  it('rejects other file types', async () => {
    const response = await POST({ request: upload(new File(['hello'], 'rules.docx', { type: '' })) } as any);
    expect(response.status).toBe(400);
    expect(mocks.saveFile).not.toHaveBeenCalled();
  });
});
