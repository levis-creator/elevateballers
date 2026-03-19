import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { generateMatchStatSheetPDF } from '../../../../features/reports/lib/matchStatSheet';

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
    const status =
      message === 'Match not found'
        ? 404
        : message === 'Unauthorized'
          ? 401
          : message === 'Stat sheet is only available for completed matches'
            ? 400
            : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
