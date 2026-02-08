import type { APIRoute } from 'astro';
import { getNewsArticles, getTeams, getPlayers, getMatches } from '../features/cms/lib/queries';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
    if (!site) {
        return new Response('Site URL not configured', { status: 500 });
    }

    const baseUrl = site.toString().replace(/\/$/, '');

    try {
        // Fetch dynamic data
        const [articles, teams, players, matches] = await Promise.all([
            getNewsArticles(),
            getTeams(false), // Approved only
            getPlayers(undefined, false), // Approved only
            getMatches(),
        ]);

        const staticPages = [
            '',
            '/about-club',
            '/standings',
            '/upcoming-fixtures',
            '/league-registration',
            '/tournaments',
            '/contacts',
            '/players',
            '/teams',
            '/news',
            '/matches/results',
            '/stats/leaders',
        ];

        // This sitemap is dynamic because:
        // 1. It runs on the server (prerender = false)
        // 2. It fetches the latest News, Teams, Players, and Matches from the database
        // 3. It automatically includes new slugs/IDs without a rebuild
        // 4. It provides accurate <lastmod> dates based on database records


        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
                .map(
                    (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
                )
                .join('')}
  ${articles
                .map(
                    (article: any) => `
  <url>
    <loc>${baseUrl}/news/${article.slug}</loc>
    <lastmod>${new Date(article.updatedAt || article.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
                )
                .join('')}
  ${teams
                .map(
                    (team: any) => `
  <url>
    <loc>${baseUrl}/teams/${team.slug}</loc>
    <lastmod>${new Date(team.updatedAt || team.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
                )
                .join('')}
  ${players
                .map(
                    (player: any) => `
  <url>
    <loc>${baseUrl}/players/${player.id}</loc>
    <lastmod>${new Date(player.updatedAt || player.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
                )
                .join('')}
  ${matches
                .map(
                    (match: any) => `
  <url>
    <loc>${baseUrl}/matches/${match.id}</loc>
    <lastmod>${new Date(match.updatedAt || match.date).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/matches/${match.id}/images</loc>
    <lastmod>${new Date(match.updatedAt || match.date).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
                )
                .join('')}
</urlset>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
