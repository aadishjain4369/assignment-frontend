/**
 * Treat unknown JSON/API values as a plain object for safe spreading.
 * Returns `{}` for `null`, arrays, and primitives.
 * Mirrors `validatePlainObject` in `backend/src/lib/utils.ts`.
 */
export function validatePlainObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}
