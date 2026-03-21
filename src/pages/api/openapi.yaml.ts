import { handleApiError } from '../../lib/apiError';
/**
 * Serves the OpenAPI specification as YAML.
 * No authentication required — the spec itself is not sensitive.
 */

import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const GET: APIRoute = async () => {
  try {
    const specPath = resolve(process.cwd(), 'openapi.yaml');
    const yaml = readFileSync(specPath, 'utf-8');

    return new Response(yaml, {
      status: 200,
      headers: {
        'Content-Type': 'application/yaml',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[openapi] Failed to read openapi.yaml:', error);
    return handleApiError(error, "OpenAPI spec not found");
  }
};
