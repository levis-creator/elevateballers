import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const category = url.searchParams.get('category') || 'points'; // points, assists, rebounds
        const limit = parseInt(url.searchParams.get('limit') || '10');

        // For Phase 1, we'll fetch approved players and sort them.
        // In a real scenario, we would aggregate from MatchEvents.
        // Here we'll check the 'stats' JSON field or just return players.

        const players = await prisma.player.findMany({
            where: { approved: true },
            include: { team: true },
            take: 20, // Get a pool to sort
        });

        // Sort based on the chosen category (mock logic for now using the stats JSON)
        const sortedPlayers = players.sort((a: any, b: any) => {
            const aStats = (a.stats as any) || {};
            const bStats = (b.stats as any) || {};

            const aVal = parseFloat(aStats[category] || (category === 'points' ? Math.floor(Math.random() * 30 + 10) : Math.floor(Math.random() * 8 + 2)));
            const bVal = parseFloat(bStats[category] || (category === 'points' ? Math.floor(Math.random() * 30 + 10) : Math.floor(Math.random() * 8 + 2)));

            // Update for frontend
            if (!aStats[category]) aStats[category] = aVal;
            if (!bStats[category]) bStats[category] = bVal;
            a.stats = aStats;
            b.stats = bStats;

            return bVal - aVal;
        }).slice(0, limit);

        return new Response(JSON.stringify(sortedPlayers), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'fetch stats leaders', request);
    }
};
