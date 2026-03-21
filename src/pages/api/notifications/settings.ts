import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../features/cms/lib/auth';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth(request);

    const settings = await prisma.userNotificationSetting.findUnique({
      where: { userId: user.id },
      select: { enabled: true, emailEnabled: true, emailPreferences: true },
    });

    return new Response(
      JSON.stringify({
        enabled: settings?.enabled ?? true,
        emailEnabled: settings?.emailEnabled ?? true,
        emailPreferences: settings?.emailPreferences ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error, 'fetch notification settings', request);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth(request);

    let body: any;
    try {
      body = await request.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const enabled = Boolean(body?.enabled);
    const emailEnabled = body?.emailEnabled === undefined ? undefined : Boolean(body?.emailEnabled);
    const emailPreferences = body?.emailPreferences ?? undefined;

    const settings = await prisma.userNotificationSetting.upsert({
      where: { userId: user.id },
      update: {
        enabled,
        ...(emailEnabled === undefined ? {} : { emailEnabled }),
        ...(emailPreferences === undefined ? {} : { emailPreferences }),
      },
      create: {
        userId: user.id,
        enabled,
        emailEnabled: emailEnabled ?? true,
        emailPreferences: emailPreferences ?? null,
      },
      select: { enabled: true, emailEnabled: true, emailPreferences: true },
    });

    return new Response(
      JSON.stringify({
        enabled: settings.enabled,
        emailEnabled: settings.emailEnabled,
        emailPreferences: settings.emailPreferences ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error, 'update notification settings', request);
  }
};
