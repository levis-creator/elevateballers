import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
    const baseUrl = (site?.toString() || url.origin).replace(/\/$/, '');
    const body = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /login',
        'Disallow: /team-portal/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
        '',
    ].join('\n');

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
};
