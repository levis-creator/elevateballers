import type { z } from 'zod';

/**
 * Parses a request body against a zod schema. Throws ZodError on mismatch —
 * routes already funnel their catch block through handleApiError(), which
 * maps ZodError to a 400 with field-level issues, so no route-level try/catch
 * changes are needed to adopt this.
 */
export async function parseBody<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T>> {
  return schema.parse(await request.json());
}
