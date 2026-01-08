import type { APIRoute } from 'astro';
import { createEmailReport, updateEmailReport } from '../../../features/reports/lib/mutations';
import { getReportGeneration } from '../../../features/reports/lib/queries';
import { sendEmailReport } from '../../../features/reports/lib/emailService';
import { requireAuth } from '../../../features/cms/lib/auth';

export const prerender = false;

/**
 * POST /api/reports/email
 * Send report via email
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);
    
    const body = await request.json();
    const { reportGenerationId, recipientEmail, recipientName, subject } = body;

    if (!reportGenerationId || !recipientEmail || !subject) {
      return new Response(
        JSON.stringify({ error: 'Report generation ID, recipient email, and subject are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify report generation exists and is completed
    const reportGeneration = await getReportGeneration(reportGenerationId);
    if (!reportGeneration) {
      return new Response(JSON.stringify({ error: 'Report generation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (reportGeneration.status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: 'Report generation is not completed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create email report record
    const emailReport = await createEmailReport({
      reportGenerationId,
      recipientEmail,
      recipientName,
      subject,
    });

    // Send email (async - don't wait for it)
    sendEmailReport(
      recipientEmail,
      recipientName,
      subject,
      reportGeneration.fileUrl || ''
    ).then((result) => {
      updateEmailReport(emailReport.id, {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
      });
    }).catch((error) => {
      updateEmailReport(emailReport.id, {
        status: 'FAILED',
        errorMessage: error.message,
      });
    });

    return new Response(
      JSON.stringify({
        emailReportId: emailReport.id,
        status: 'PENDING',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending email report:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
