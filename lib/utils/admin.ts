/**
 * Admin authorization utility
 * Checks if a user email is in the admin allowlist
 *
 * Security: This function should only be called server-side.
 * NEVER expose ADMIN_EMAILS to the client.
 */

/**
 * Checks if the given email is in the ADMIN_EMAILS allowlist
 *
 * @param email - User's email address to check
 * @returns true if email is in ADMIN_EMAILS, false otherwise
 *
 * @example
 * ```typescript
 * // Environment: ADMIN_EMAILS=admin@example.com,organizer@example.com
 * isAdmin("admin@example.com") // true
 * isAdmin("ADMIN@EXAMPLE.COM") // true (case-insensitive)
 * isAdmin("user@example.com")  // false
 * isAdmin(null)                // false
 * ```
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  return adminList.includes(email.toLowerCase());
}
