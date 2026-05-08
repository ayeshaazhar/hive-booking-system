/**
 * Admin access for API routes and UI.
 * Set ADMIN_EMAILS in env (comma-separated) or rely on the default allowlist below.
 */
const DEFAULT_ADMIN_EMAILS = [
  "admin@example.com",
  "ayesha.azhar.shaikh@gmail.com",
  "ayesha.chargeup@gmail.com",
]

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS
  if (raw?.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  }
  return DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase())
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.trim().toLowerCase())
}
