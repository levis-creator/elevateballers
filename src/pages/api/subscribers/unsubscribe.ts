import type { APIRoute } from 'astro';

export const prerender = false;

// Redirect to the proper unsubscribe page — all logic is handled there
export const GET: APIRoute = async ({ url, redirect }) => {
  const token = url.searchParams.get('token');
  return redirect(`/unsubscribe${token ? `?token=${token}` : ''}`, 302);
};
