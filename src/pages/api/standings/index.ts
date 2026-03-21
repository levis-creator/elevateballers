import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

import { handleApiError } from '../../../lib/apiError';
/**
 * GET /api/standings
 * Fetches team standings for a league/season
 * Query params:
 *   - leagueId (optional): Filter by league
 *   - seasonId (optional): Filter by season
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const leagueId = url.searchParams.get('leagueId');
        const seasonId = url.searchParams.get('seasonId');

        // Fetch all teams
        const teams = await prisma.team.findMany({
            where: {
                approved: true,
            },
            include: {
                team1Matches: {
                    where: {
                        status: 'COMPLETED',
                        ...(leagueId && { leagueId }),
                        ...(seasonId && { seasonId }),
                    },
                },
                team2Matches: {
                    where: {
                        status: 'COMPLETED',
                        ...(leagueId && { leagueId }),
                        ...(seasonId && { seasonId }),
                    },
                },
            },
        });

        // Calculate standings for each team
        const standings = teams.map((team) => {
            let played = 0;
            let won = 0;
            let drawn = 0;
            let lost = 0;
            let goalsFor = 0;
            let goalsAgainst = 0;

            // Process matches where team was team1
            team.team1Matches.forEach((match) => {
                if (match.team1Score !== null && match.team2Score !== null) {
                    played++;
                    goalsFor += match.team1Score;
                    goalsAgainst += match.team2Score;

                    if (match.team1Score > match.team2Score) {
                        won++;
                    } else if (match.team1Score === match.team2Score) {
                        drawn++;
                    } else {
                        lost++;
                    }
                }
            });

            // Process matches where team was team2
            team.team2Matches.forEach((match) => {
                if (match.team1Score !== null && match.team2Score !== null) {
                    played++;
                    goalsFor += match.team2Score;
                    goalsAgainst += match.team1Score;

                    if (match.team2Score > match.team1Score) {
                        won++;
                    } else if (match.team1Score === match.team2Score) {
                        drawn++;
                    } else {
                        lost++;
                    }
                }
            });

            const goalDifference = goalsFor - goalsAgainst;
            const points = won * 3 + drawn * 1;

            return {
                teamId: team.id,
                team: team.name,
                logo: team.logo,
                played,
                won,
                drawn,
                lost,
                goalsFor,
                goalsAgainst,
                goalDifference,
                points,
                url: `/teams/${team.slug}`,
            };
        });

        // Sort by points (desc), then goal difference (desc), then goals for (desc)
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });

        // Add rank
        const rankedStandings = standings.map((standing, index) => ({
            ...standing,
            rank: index + 1,
        }));

        return new Response(JSON.stringify(rankedStandings), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error fetching standings:', error);
        return handleApiError(error, "fetch standings");
    }
};
