import { describe, expect, it } from 'vitest';
import { normalizePhoneNumber, toInternationalPhone } from '../phone';

describe('toInternationalPhone', () => {
  it('adds the chosen country code and drops the leading 0', () => {
    expect(toInternationalPhone('254', '0712 345 678')).toBe('+254712345678');
    expect(toInternationalPhone('256', '0772-123456')).toBe('+256772123456');
  });

  it('accepts a number typed without the leading 0', () => {
    expect(toInternationalPhone('254', '712345678')).toBe('+254712345678');
  });

  it('keeps a number that already has a country code', () => {
    expect(toInternationalPhone('254', '+255 712 345 678')).toBe('+255712345678');
    expect(toInternationalPhone('254', '00255712345678')).toBe('+255712345678');
    expect(toInternationalPhone('254', '254712345678')).toBe('+254712345678');
  });

  it('handles single-digit country codes', () => {
    expect(toInternationalPhone('1', '(202) 555-0123')).toBe('+12025550123');
    expect(toInternationalPhone('1', '1 202 555 0123')).toBe('+12025550123');
  });

  it('rejects empty, too short and too long numbers', () => {
    expect(toInternationalPhone('254', '')).toBeNull();
    expect(toInternationalPhone('254', '12')).toBeNull();
    expect(toInternationalPhone('254', '+1234567890123456')).toBeNull();
  });
});

describe('normalizePhoneNumber', () => {
  it('reads numbers saved without a country code as Kenyan', () => {
    expect(normalizePhoneNumber('0712345678')).toBe('+254712345678');
    expect(normalizePhoneNumber(' (+254) 700-000-000 ')).toBe('+254700000000');
  });

  it('returns null for blanks', () => {
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber('   ')).toBeNull();
  });
});
