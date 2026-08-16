import { z } from 'zod';

/**
 * Wraps a numeric schema so an empty string (a cleared form field) is treated
 * as absent rather than an invalid number. Matches the existing hand-rolled
 * pattern across the codebase, e.g.
 *   heightCm === undefined || heightCm === '' ? undefined : Number(heightCm)
 */
export function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
}

/**
 * Wraps a schema so the UI's "no selection" sentinel string is treated as
 * absent. Matches the existing `stage !== '__none'` checks scattered across
 * select-driven fields.
 */
export function noneableSelect<T extends z.ZodTypeAny>(schema: T, sentinel = '__none') {
  return z.preprocess((value) => (value === sentinel ? undefined : value), schema.optional());
}
