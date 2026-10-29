/**
 * Recognising PDF uploads. Browsers do not agree on a PDF's type: Windows can
 * report `application/x-pdf` or nothing at all, depending on which PDF reader
 * registered the extension. The name decides whether a file is offered as a
 * PDF; its first bytes decide whether it really is one.
 */

const PDF_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
]);
const GENERIC_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

/** True when the browser's type or, failing a known type, the file name says PDF. */
export function looksLikePdf(file: { name: string; type: string }): boolean {
  const type = file.type.trim().toLowerCase();
  if (PDF_TYPES.has(type)) return true;
  return GENERIC_TYPES.has(type) && /\.pdf$/i.test(file.name.trim());
}

/** True when the bytes start with the `%PDF-` signature every PDF begins with. */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Large PDFs travel in pieces of this size: hosting platforms cap a single
 * request body (Vercel at about 4.5 MB), so a rulebook bigger than one piece is
 * uploaded piece by piece and joined on the server.
 */
export const UPLOAD_PART_BYTES = 2 * 1024 * 1024;

/** The browser names each piecewise upload with a random UUID. */
export function isUploadId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Where a piece waits in storage until the upload is completed. */
export const uploadPartKey = (uploadId: string, index: number) => `tmp/rules-uploads/${uploadId}/${index}`;
