import type { APIRoute } from 'astro';
import { getNewsArticles, getTeams, getPlayers, getMatches, getPublicStaff } from '../features/cms/lib/queries';
import { prisma } from '../lib/prisma';
import { matchesSeoPath, resolvePublicSeoSettings, siteSettingsService } from '../features/settings';
import { cacheGet, cacheSet } from '../lib/cache';

const SITEMAP_CACHE_KEY = 'public:sitemap:v2';
const SITEMAP_CACHE_TTL_SECONDS = 3600;

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
    if (!site) {
        return new Response('Site URL not configured', { status: 500 });
    }

    try {
        const seoSettings = resolvePublicSeoSettings(await siteSettingsService.list('seo').catch(() => []));
        if (!seoSettings.sitemap) {
            return new Response('Sitemap disabled', { status: 404 });
        }
        const baseUrl = seoSettings.canonicalBase || site.toString().replace(/\/$/, '');
        const cachedXml = await cacheGet<string>(SITEMAP_CACHE_KEY);
        if (cachedXml) {
            return new Response(cachedXml, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                },
            });
        }
        const isIncluded = (path: string) =>
            !seoSettings.noindexPaths.some(({ path: pattern }) => matchesSeoPath(path || '/', pattern || ''));
        // Fetch dynamic data sequentially. The Vercel MariaDB adapter uses a
        // small pool (currently three connections); running all five queries
        // at once exhausts it and causes the sitemap request to time out.
        const articles = await getNewsArticles();
        const teams = await getTeams(false); // Approved only
        const players = await getPlayers(undefined, false); // Approved only
        const matches = await getMatches();
        const staff = await getPublicStaff();

        const now = new Date().toISOString();
        const staticPages = [
            { path: '',                  priority: '1.0', freq: 'daily'   },
            { path: '/news',             priority: '0.9', freq: 'daily'   },
            { path: '/standings',        priority: '0.8', freq: 'daily'   },
            { path: '/upcoming-fixtures',priority: '0.8', freq: 'daily'   },
            { path: '/matches',          priority: '0.8', freq: 'weekly'  },
            { path: '/players',          priority: '0.7', freq: 'weekly'  },
            { path: '/teams',            priority: '0.7', freq: 'weekly'  },
            { path: '/stats/leaders',    priority: '0.7', freq: 'weekly'  },
            { path: '/tournaments',      priority: '0.6', freq: 'weekly'  },
            { path: '/about',            priority: '0.5', freq: 'monthly' },
            { path: '/contacts',         priority: '0.5', freq: 'monthly' },
            { path: '/rules',            priority: '0.5', freq: 'monthly' },
            { path: '/league-registration', priority: '0.5', freq: 'monthly' },
            { path: '/staff',            priority: '0.4', freq: 'monthly' },
        ].filter(({ path }) => isIncluded(path || '/'));

        // This sitemap is dynamic because:
        // 1. It runs on the server (prerender = false)
        // 2. It fetches the latest News, Teams, Players, and Matches from the database
        // 3. It automatically includes new slugs/IDs without a rebuild
        // 4. It provides accurate <lastmod> dates based on database records

        const matchesFolder = await prisma.folder.findUnique({
            where: { name: 'matches' },
            select: { id: true },
        });
        const imageRows = matchesFolder
            ? await prisma.media.findMany({
                where: { folderId: matchesFolder.id, type: 'IMAGE' },
                select: { tags: true },
            })
            : [];
        const matchesWithImages = new Set<string>();
        for (const image of imageRows) {
            if (!Array.isArray(image.tags)) continue;
            for (const tag of image.tags) {
                if (typeof tag === 'string' && tag.startsWith('match:')) {
                    matchesWithImages.add(tag.slice('match:'.length));
                }
            }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
                .map(
                    ({ path, priority, freq }) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`
                )
                .join('')}
  ${articles
                .filter((article: any) => isIncluded(`/news/${article.slug}/`))
                .map(
                    (article: any) => `
  <url>
    <loc>${baseUrl}/news/${article.slug}/</loc>
    <lastmod>${new Date(article.updatedAt || article.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
                )
                .join('')}
  ${teams
                .filter((team: any) => isIncluded(`/teams/${team.slug}/`))
                .map(
                    (team: any) => `
  <url>
    <loc>${baseUrl}/teams/${team.slug}/</loc>
    <lastmod>${new Date(team.updatedAt || team.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
                )
                .join('')}
  ${players
                .filter((player: any) => isIncluded(`/players/${player.slug || player.id}/`))
                .map(
                    (player: any) => `
  <url>
    <loc>${baseUrl}/players/${player.slug || player.id}/</loc>
    <lastmod>${new Date(player.updatedAt || player.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
                )
                .join('')}
  ${staff
                .filter((member: any) => isIncluded(`/staff/${member.slug}/`))
                .map(
                    (member: any) => `
  <url>
    <loc>${baseUrl}/staff/${member.slug}/</loc>
    <lastmod>${new Date(member.updatedAt || member.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
                )
                .join('')}
  ${matches
                .filter((match: any) => isIncluded(`/matches/${match.slug || match.id}/`))
                .map((match: any) => {
                    const matchPath = match.slug || match.id;
                    const imagesPath = `/matches/${matchPath}/images/`;
                    const imagesUrl = matchesWithImages.has(match.id) && isIncluded(imagesPath)
                        ? `
  <url>
    <loc>${baseUrl}/matches/${matchPath}/images/</loc>
    <lastmod>${new Date(match.updatedAt || match.date).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
                        : '';
                    return `
  <url>
    <loc>${baseUrl}/matches/${matchPath}/</loc>
    <lastmod>${new Date(match.updatedAt || match.date).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>${imagesUrl}`;
                })
                .join('')}
</urlset>`;

        await cacheSet(SITEMAP_CACHE_KEY, xml, SITEMAP_CACHE_TTL_SECONDS);
        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
