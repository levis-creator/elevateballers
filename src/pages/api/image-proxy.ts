/**
 * Proxies external image URLs so they load on our pages.
 * Fixes mixed content (HTTP image on HTTPS page) and hotlink/CORS blocking.
 */

import type { APIRoute } from 'astro';
import { isProduction } from '../../lib/env';

export const prerender = false;

const ALLOWED_HOSTS = [
  'elevateballers.com',
  'www.elevateballers.com',
];

const DEV_HOSTS = [
  'localhost',
  '127.0.0.1',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (ALLOWED_HOSTS.includes(host)) return true;
    if (!isProduction() && DEV_HOSTS.includes(host)) return true;
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

  if (!isAllowedUrl(targetUrl)) {
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
    // Team/player logos rarely change. 30-day browser cache + 1-year edge cache
    // with stale-while-revalidate keeps these images effectively free to serve.
    // Honor upstream Cache-Control if it's already long enough; otherwise force ours.
    const upstreamCacheControl = res.headers.get('Cache-Control') || '';
    const upstreamMaxAge = parseInt(
      upstreamCacheControl.match(/max-age=(\d+)/)?.[1] || '0',
      10,
    );
    const cacheControl =
      upstreamMaxAge >= 86400
        ? upstreamCacheControl
        : 'public, max-age=2592000, s-maxage=31536000, stale-while-revalidate=86400';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        Vary: 'Accept',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return new Response('Failed to fetch image', { status: 502 });
  }
};
