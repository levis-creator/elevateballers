import type { APIRoute } from 'astro';
import { previewBracketMatches, validateBracketOptions } from '@/features/tournaments/lib/bracket-generator';
import { requireAdmin } from '@/features/cms/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    const options = {
      teamIds: data.teamIds as string[],
      seasonId: data.seasonId as string,
      leagueId: data.leagueId as string | undefined,
      tournamentDays: (data.tournamentDays as string[]).map((d: string) => new Date(d)),
      bracketType: (data.bracketType || 'single') as 'single' | 'double',
    };

    // Validate options
    const validation = validateBracketOptions(options);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: validation.errors.join(', '),
          warnings: validation.warnings,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Preview bracket (generate without saving)
    const matches = await previewBracketMatches(options);

    // Convert dates to ISO strings for JSON serialization
    const serializedMatches = matches.map(match => ({
      ...match,
      date: match.date.toISOString(),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        matches: serializedMatches,
        warnings: validation.warnings,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error previewing bracket:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to preview bracket',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
