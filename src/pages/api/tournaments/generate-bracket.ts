import type { APIRoute } from 'astro';
import { createBracketMatches, validateBracketOptions, type GeneratedMatch } from '@/features/tournaments/lib/bracket-generator';
import { calculateBracketStats } from '@/features/tournaments/lib/bracket-stats';
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

    // Check if matches were provided from review (approved matches)
    let matchesToCreate: GeneratedMatch[] | undefined;
    if (data.matches && Array.isArray(data.matches)) {
      // Convert date strings back to Date objects
      matchesToCreate = data.matches.map((match: any) => ({
        ...match,
        date: new Date(match.date),
      })) as GeneratedMatch[];
    }

    // Generate bracket (use provided matches if available)
    const result = await createBracketMatches(options, matchesToCreate);

    // Check if we had partial success
    const totalExpected = matchesToCreate ? matchesToCreate.length : calculateBracketStats(options.teamIds.length, options.bracketType).totalMatches;
    const hasErrors = result.errors.length > 0;
    const allCreated = result.created === totalExpected;

    return new Response(
      JSON.stringify({
        success: allCreated && !hasErrors,
        created: result.created,
        expected: totalExpected,
        matchIds: result.matchIds,
        errors: result.errors,
        warnings: validation.warnings,
        message: allCreated 
          ? `Successfully created ${result.created} matches`
          : `Created ${result.created} of ${totalExpected} matches${hasErrors ? ' (some errors occurred)' : ''}`,
      }),
      {
        status: allCreated ? 200 : 207, // 207 Multi-Status for partial success
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating bracket:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate bracket',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
