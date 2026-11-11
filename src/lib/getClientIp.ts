/**
 * The real client IP for rate limiting and logs.
 *
 * Production runs Cloudflare → Apache (cPanel) → Passenger → Node. Apache
 * already resolves the visitor's address from Cloudflare (its access log shows
 * visitor IPs, never Cloudflare's), and that address reaches the app as the
 * entry appended to the END of X-Forwarded-For.
 *
 * Everything else in these headers is client-controlled: the FIRST
 * X-Forwarded-For entry, X-Real-IP and CF-Connecting-IP can all be sent by
 * anyone who calls the origin server directly. Trusting them let a script give
 * itself a fresh IP — and a fresh rate limit — on every request. So only the
 * last X-Forwarded-For entry is used, then the socket address (local dev).
 */

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]+(%[0-9a-z.]+)?$/i;

/** Strips brackets, ports and the IPv4-mapped IPv6 prefix; null if not an IP. */
function cleanIp(value: string | undefined): string | null {
  let ip = (value ?? '').trim().replace(/^"|"$/g, '');
  if (!ip) return null;
  if (ip.startsWith('[')) ip = ip.slice(1, ip.indexOf(']') > 0 ? ip.indexOf(']') : undefined); // [::1]:443
  else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(':')); // 1.2.3.4:443
  ip = ip.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, '');
  if (IPV4.test(ip)) return ip;
  return ip.includes(':') && IPV6.test(ip) ? ip.toLowerCase() : null;
}

export function getClientIp(request: Request, clientAddress?: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',') ?? [];
  const last = cleanIp(forwarded[forwarded.length - 1]);
  return last ?? cleanIp(clientAddress) ?? 'unknown';
}
