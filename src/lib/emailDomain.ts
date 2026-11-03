import { promises as dns } from 'node:dns';

// Throwaway-inbox services commonly used to fake sign-ups. Not exhaustive:
// the confirmation email is what actually proves an address is real.
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', 'dispostable.com', 'emailondeck.com', 'fakeinbox.com',
  'getnada.com', 'guerrillamail.com', 'guerrillamail.net', 'maildrop.cc',
  'mailinator.com', 'mailnesia.com', 'mintemail.com', 'mohmal.com',
  'sharklasers.com', 'spamgourmet.com', 'temp-mail.org', 'tempmail.com',
  'tempmail.dev', 'tempr.email', 'throwawaymail.com', 'trashmail.com',
  'yopmail.com',
]);

const LOOKUP_TIMEOUT_MS = 3000;

export type EmailDomainCheck = 'ok' | 'disposable' | 'no-mail';

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), LOOKUP_TIMEOUT_MS)),
  ]);
}

function isMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ENONAME';
}

/**
 * Rejects addresses whose domain cannot receive mail (typos like gmial.com,
 * made-up domains) or is a known throwaway inbox. DNS errors other than "no
 * such record", including timeouts, let the address through so a slow
 * resolver never blocks a real sign-up.
 */
export async function checkEmailDomain(email: string): Promise<EmailDomainCheck> {
  const domain = email.split('@').pop()?.toLowerCase() ?? '';
  if (DISPOSABLE_DOMAINS.has(domain)) return 'disposable';

  try {
    const records = await withTimeout(dns.resolveMx(domain));
    if (records.some((record) => record.exchange && record.exchange !== '.')) return 'ok';
    return 'no-mail';
  } catch (error) {
    if (!isMissing(error)) return 'ok';
  }

  // No MX record: mail falls back to the domain's own address (RFC 5321).
  try {
    const addresses = await withTimeout(dns.resolve4(domain));
    return addresses.length > 0 ? 'ok' : 'no-mail';
  } catch (error) {
    return isMissing(error) ? 'no-mail' : 'ok';
  }
}
