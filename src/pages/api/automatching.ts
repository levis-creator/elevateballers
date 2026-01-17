/**
 * Automatching Feature API Endpoint
 * 
 * Returns whether the automatching feature is enabled.
 * This endpoint is used by client-side code to check if automatching is enabled.
 */

import type { APIRoute } from 'astro';
import { getEnvBoolean } from '../../lib/env';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const enabled = getEnvBoolean('ENABLE_AUTOMATCHING', true);
    
    return new Response(JSON.stringify({ enabled }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error checking automatching status:', error);
    
    return new Response(
      JSON.stringify({ enabled: true }), // Default to enabled on error
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
