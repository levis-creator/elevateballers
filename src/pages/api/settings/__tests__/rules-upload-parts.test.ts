import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  objects: new Map<string, Buffer>(),
  saveFile: vi.fn(),
  mediaCreate: vi.fn(),
}));

vi.mock('@/features/rbac/middleware', () => ({ requirePermission: vi.fn(async () => ({ id: 'admin-1' })) }));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/r2', () => ({
  isR2Configured: vi.fn(async () => true),
  putR2Object: vi.fn(async (key: string, body: Buffer) => void mocks.objects.set(key, body)),
  getR2Object: vi.fn(async (key: string) => {
    const body = mocks.objects.get(key);
    if (!body) throw new Error('NoSuchKey');
    return body;
  }),
  deleteR2Object: vi.fn(async (key: string) => void mocks.objects.delete(key)),
}));
vi.mock('@/lib/file-storage', () => ({ saveFile: mocks.saveFile }));
vi.mock('@/lib/folder-access', () => ({ getFolderByName: vi.fn(async () => ({ id: 'folder-1', name: 'documents' })) }));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    siteSetting: { findMany: vi.fn(async () => []) },
    media: { create: mocks.mediaCreate },
    folder: { create: vi.fn() },
  },
}));

import { POST as postPart } from '../rules-upload-part';
import { POST as postComplete } from '../rules-upload-complete';
import { UPLOAD_PART_BYTES } from '@/lib/pdf-upload';

const UPLOAD_ID = '6f1c2a4e-9b7d-4c3a-8e21-0d5f6a7b8c9d';

function sendPart(index: number, bytes: Uint8Array, uploadId = UPLOAD_ID) {
  const body = new FormData();
  body.append('uploadId', uploadId);
  body.append('index', String(index));
  body.append('part', new File([bytes], 'part'));
  return postPart({ request: new Request('https://example.test/part', { method: 'POST', body }) } as any);
}

function complete(parts: number, fileName = 'Rulebook 2026.pdf') {
  return postComplete({
    request: new Request('https://example.test/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: UPLOAD_ID, parts, fileName }),
    }),
  } as any);
}

/** A PDF of the size that failed in production: 6.35 MB. */
function rulebook(): Uint8Array {
  const bytes = new Uint8Array(Math.round(6.35 * 1024 * 1024)).fill(0x20);
  bytes.set(new TextEncoder().encode('%PDF-1.7\n'));
  return bytes;
}

describe('rules PDF upload in pieces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.objects.clear();
    mocks.saveFile.mockResolvedValue({ publicUrl: 'https://cdn.example/rules.pdf', filePath: 'uploads/public/documents/rules.pdf' });
    mocks.mediaCreate.mockResolvedValue({ id: 'media-1' });
  });

  it('joins a 6.35 MB PDF sent in pieces, saves it whole and clears the pieces', async () => {
    const pdf = rulebook();
    const parts = Math.ceil(pdf.byteLength / UPLOAD_PART_BYTES);
    for (let index = 0; index < parts; index += 1) {
      const response = await sendPart(index, pdf.slice(index * UPLOAD_PART_BYTES, (index + 1) * UPLOAD_PART_BYTES));
      expect(response.status).toBe(200);
    }

    const response = await complete(parts);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ url: 'https://cdn.example/rules.pdf' });
    const stored = mocks.saveFile.mock.calls[0][1] as File;
    expect(stored.size).toBe(pdf.byteLength);
    expect(stored.type).toBe('application/pdf');
    expect(mocks.objects.size).toBe(0);
  });

  it('rejects a piece larger than the piece size or with a bad upload id', async () => {
    expect((await sendPart(0, new Uint8Array(UPLOAD_PART_BYTES + 1))).status).toBe(400);
    expect((await sendPart(0, new Uint8Array(10), 'not-a-uuid')).status).toBe(400);
    expect((await sendPart(99, new Uint8Array(10))).status).toBe(400);
  });

  it('reports a missing piece instead of saving a broken file', async () => {
    await sendPart(0, rulebook().slice(0, UPLOAD_PART_BYTES));
    const response = await complete(2);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('missing');
    expect(mocks.saveFile).not.toHaveBeenCalled();
  });

  it('rejects joined bytes that are not a PDF', async () => {
    await sendPart(0, new TextEncoder().encode('not a pdf'));
    const response = await complete(1);
    expect(response.status).toBe(400);
    expect(mocks.saveFile).not.toHaveBeenCalled();
  });
});
