import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { generateMatchStatSheetPDF } from '../../../../features/reports/lib/matchStatSheet';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);

    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { pdf, fileName } = await generateMatchStatSheetPDF(matchId);

    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to generate stat sheet';
    if (message === 'Match not found') {
      return new Response(JSON.stringify({ error: message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (message === 'Stat sheet is only available for completed matches') {
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handleApiError(error, 'generate stat sheet', request);
  }
};
