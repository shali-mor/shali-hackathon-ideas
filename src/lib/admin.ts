export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "shali.mor@forcepoint.com";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export const ALLOWED_EMAIL_DOMAIN = "forcepoint.com";

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  if (lower.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) return true;
  // External admins (judges/guests on non-Forcepoint domains) can sign in too.
  return getAdminEmails().includes(lower);
}
