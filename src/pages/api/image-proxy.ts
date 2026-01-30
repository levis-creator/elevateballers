/**
 * Proxies external image URLs so they load on our pages.
 * Fixes mixed content (HTTP image on HTTPS page) and hotlink/CORS blocking.
 */

import type { APIRoute } from 'astro';

export const prerender = false;

const ALLOWED_HOSTS = [
  'elevateballers.com',
  'www.elevateballers.com',
  'localhost',
  '127.0.0.1',
];

function isAllowedUrl(urlString: string, requestHost: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (ALLOWED_HOSTS.includes(host)) return true;
    if (host === requestHost?.toLowerCase()) return true;
    return false;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request, url: requestUrl }) => {
  const urlParam = requestUrl.searchParams.get('url');
  if (!urlParam) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(urlParam);
  } catch {
    return new Response('Invalid url parameter', { status: 400 });
  }

  const requestHost = requestUrl.hostname || '';
  if (!isAllowedUrl(targetUrl, requestHost)) {
    return new Response('URL not allowed', { status: 403 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ElevateBallers-ImageProxy/1.0',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return new Response(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('Content-Type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400 });
    }

    const body = await res.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return new Response('Failed to fetch image', { status: 502 });
  }
};
