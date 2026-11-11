/**
 * Phone numbers in international (E.164) form: `+` then the country code and
 * number, no spaces, e.g. `+254712345678`. Used by the registration form, the
 * registration API and duplicate matching, so the same number always reads
 * the same however it was typed. Safe to import in the browser.
 */

export type PhoneCountry = { code: string; name: string; dial: string };

/** Kenya is the default; neighbours and common diaspora countries follow. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'KE', name: 'Kenya', dial: '254' },
  { code: 'UG', name: 'Uganda', dial: '256' },
  { code: 'TZ', name: 'Tanzania', dial: '255' },
  { code: 'RW', name: 'Rwanda', dial: '250' },
  { code: 'BI', name: 'Burundi', dial: '257' },
  { code: 'SS', name: 'South Sudan', dial: '211' },
  { code: 'ET', name: 'Ethiopia', dial: '251' },
  { code: 'SO', name: 'Somalia', dial: '252' },
  { code: 'CD', name: 'DR Congo', dial: '243' },
  { code: 'NG', name: 'Nigeria', dial: '234' },
  { code: 'GH', name: 'Ghana', dial: '233' },
  { code: 'ZA', name: 'South Africa', dial: '27' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'US', name: 'United States / Canada', dial: '1' },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

/** E.164 allows at most 15 digits; 8 is the shortest real-world full number. */
const isE164Digits = (digits: string) => /^[1-9]\d{7,14}$/.test(digits);

/**
 * Combines a country dial code with the number as typed. A leading `+` or
 * `00` means the number already has its country code; a leading 0 (the
 * national trunk prefix, as in 0712…) is dropped. Returns null when the
 * result is not a plausible number.
 */
export function toInternationalPhone(dial: string, typed: string): string | null {
  const raw = typed.trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return isE164Digits(digits) ? `+${digits}` : null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  else {
    const country = dial.replace(/\D/g, '');
    // Someone may type the country code without a plus (2547…) after picking it.
    if (!(digits.startsWith(country) && digits.length > country.length + 7)) {
      digits = `${country}${digits.replace(/^0+/, '')}`;
    }
  }
  return isE164Digits(digits) ? `+${digits}` : null;
}

/**
 * Best-effort international form for a stored or submitted number that may
 * lack a country code (older records were saved as typed, e.g. 0712345678).
 * Numbers without one are read as Kenyan. Returns null when unusable.
 */
export function normalizePhoneNumber(value: unknown, defaultDial = DEFAULT_PHONE_COUNTRY.dial): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return toInternationalPhone(defaultDial, raw);
}
