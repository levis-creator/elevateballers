/**
 * Feature Flags API Endpoint
 * 
 * Returns the current feature flags configuration as JSON.
 * This endpoint is used by client-side code to fetch feature flags.
 */

import type { APIRoute } from 'astro';
import { getFeatureFlags } from '../../lib/feature-flags';

export const GET: APIRoute = async () => {
  try {
    const flags = getFeatureFlags();
    
    return new Response(JSON.stringify(flags), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch feature flags' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

