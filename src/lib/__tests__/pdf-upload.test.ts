import { describe, expect, it } from 'vitest';
import { hasPdfSignature, looksLikePdf } from '../pdf-upload';

describe('looksLikePdf', () => {
  it('accepts the PDF types browsers report', () => {
    expect(looksLikePdf({ name: 'rules.pdf', type: 'application/pdf' })).toBe(true);
    expect(looksLikePdf({ name: 'rules.pdf', type: 'application/x-pdf' })).toBe(true);
  });

  it('accepts a .pdf file the browser gave no type', () => {
    expect(looksLikePdf({ name: 'Rulebook 2026.PDF', type: '' })).toBe(true);
    expect(looksLikePdf({ name: 'rules.pdf', type: 'application/octet-stream' })).toBe(true);
  });

  it('rejects other files', () => {
    expect(looksLikePdf({ name: 'rules.docx', type: '' })).toBe(false);
    expect(looksLikePdf({ name: 'rules.pdf', type: 'image/png' })).toBe(false);
  });
});

describe('hasPdfSignature', () => {
  const bytes = (text: string) => new TextEncoder().encode(text);

  it('recognises the %PDF- header', () => {
    expect(hasPdfSignature(bytes('%PDF-1.7\n...'))).toBe(true);
  });

  it('rejects files that only claim to be PDFs', () => {
    expect(hasPdfSignature(bytes('PK\u0003\u0004'))).toBe(false);
    expect(hasPdfSignature(bytes('%PD'))).toBe(false);
  });
});
