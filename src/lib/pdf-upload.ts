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
