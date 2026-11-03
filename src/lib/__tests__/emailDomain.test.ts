import { beforeEach, describe, expect, it, vi } from 'vitest';

const dns = vi.hoisted(() => ({ resolveMx: vi.fn(), resolve4: vi.fn() }));
vi.mock('node:dns', () => ({ promises: dns }));

import { checkEmailDomain } from '../emailDomain';

const dnsError = (code: string) => Object.assign(new Error(code), { code });

describe('checkEmailDomain', () => {
  beforeEach(() => {
    dns.resolveMx.mockReset();
    dns.resolve4.mockReset();
  });

  it('accepts a domain with a mail server', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }]);
    await expect(checkEmailDomain('fan@example.com')).resolves.toBe('ok');
  });

  it('rejects throwaway inboxes without a lookup', async () => {
    await expect(checkEmailDomain('fan@Mailinator.com')).resolves.toBe('disposable');
    expect(dns.resolveMx).not.toHaveBeenCalled();
  });

  it('rejects a domain that does not exist', async () => {
    dns.resolveMx.mockRejectedValue(dnsError('ENOTFOUND'));
    dns.resolve4.mockRejectedValue(dnsError('ENOTFOUND'));
    await expect(checkEmailDomain('fan@gmial.co')).resolves.toBe('no-mail');
  });

  it('rejects a null MX record', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: '', priority: 0 }]);
    await expect(checkEmailDomain('fan@nomail.example')).resolves.toBe('no-mail');
  });

  it('falls back to the domain address when there is no MX record', async () => {
    dns.resolveMx.mockRejectedValue(dnsError('ENODATA'));
    dns.resolve4.mockResolvedValue(['203.0.113.7']);
    await expect(checkEmailDomain('fan@example.org')).resolves.toBe('ok');
  });

  it('lets the address through when DNS itself fails', async () => {
    dns.resolveMx.mockRejectedValue(dnsError('ETIMEOUT'));
    await expect(checkEmailDomain('fan@example.net')).resolves.toBe('ok');
  });
});
