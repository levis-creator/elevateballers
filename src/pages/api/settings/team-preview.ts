import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const team = await prisma.team.findFirst({
      where: { approved: true },
      orderBy: { name: 'asc' },
      select: { id: true, slug: true },
    });
    return new Response(JSON.stringify({ href: team ? `/teams/${team.slug || team.id}` : '/teams' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=60' },
    });
  } catch {
    return new Response(JSON.stringify({ href: '/teams' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
