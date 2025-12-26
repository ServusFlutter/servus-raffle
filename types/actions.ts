/**
 * Standard result type for all Server Actions
 * Never throw errors from Server Actions - always return this shape
 */
export type ActionResult<T> = {
  data: T | null
  error: string | null
}

/**
 * Helper to create a successful result
 */
export function success<T>(data: T): ActionResult<T> {
  return { data, error: null }
}

/**
 * Helper to create an error result
 */
export function failure<T = never>(error: string): ActionResult<T> {
  return { data: null, error }
}
