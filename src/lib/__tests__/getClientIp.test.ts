import { describe, expect, it } from 'vitest';
import { getClientIp } from '../getClientIp';

const request = (headers: Record<string, string>) => new Request('https://example.test/', { headers });

describe('getClientIp', () => {
  it('uses the address our proxy appended, not the one the client sent', () => {
    expect(getClientIp(request({ 'x-forwarded-for': '6.6.6.6, 41.90.1.2' }))).toBe('41.90.1.2');
  });

  it('ignores headers a client can set directly on the origin', () => {
    expect(
      getClientIp(
        request({ 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '7.7.7.7', 'x-forwarded-for': '41.90.1.2' })
      )
    ).toBe('41.90.1.2');
    expect(getClientIp(request({ 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '7.7.7.7' }), '41.90.1.2')).toBe('41.90.1.2');
  });

  it('gives a spoofing script the same IP on every request', () => {
    const ips = ['10.0.0.1', '10.0.0.2', '10.0.0.3'].map((fake) =>
      getClientIp(request({ 'x-forwarded-for': `${fake}, 102.135.169.206` }))
    );
    expect(new Set(ips)).toEqual(new Set(['102.135.169.206']));
  });

  it('skips a garbage last entry and falls back to the socket address', () => {
    expect(getClientIp(request({ 'x-forwarded-for': '1.2.3.4, not-an-ip' }), '41.90.1.2')).toBe('41.90.1.2');
    expect(getClientIp(request({}), undefined)).toBe('unknown');
  });

  it('normalises ports, brackets and IPv4-mapped IPv6', () => {
    expect(getClientIp(request({ 'x-forwarded-for': '41.90.1.2:51234' }))).toBe('41.90.1.2');
    expect(getClientIp(request({ 'x-forwarded-for': '[2001:DB8::1]:443' }))).toBe('2001:db8::1');
    expect(getClientIp(request({}), '::ffff:41.90.1.2')).toBe('41.90.1.2');
    expect(getClientIp(request({}), '::1')).toBe('::1');
  });
});
