import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const TZ = "Asia/Jerusalem";

export const SUBMISSION_DEADLINE = fromZonedTime("2026-06-07 23:59:59", TZ);
export const HACKATHON_DAY = fromZonedTime("2026-06-09 09:00:00", TZ);
// Pencils-down — the kiosk's "Time remaining" counts down to this.
export const HACKATHON_END = fromZonedTime("2026-06-10 04:00:00", TZ);
export const JUDGING_DAY = fromZonedTime("2026-06-11 09:00:00", TZ);

export function submissionsOpen(now: Date = new Date()): boolean {
  return now.getTime() <= SUBMISSION_DEADLINE.getTime();
}

// Per-email grace window for late submissions/edits. The global
// SUBMISSION_DEADLINE has passed, but a handful of submitters were
// missed and need a tail window. Keys are lowercase emails; values are
// the expiry. Remove entries once they lapse.
export const LATE_SUBMITTER_GRACE: Record<string, Date> = {
  "benny.zemmour@forcepoint.com": fromZonedTime("2026-06-09 16:30:00", TZ),
};

export function submissionsOpenFor(
  email: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (submissionsOpen(now)) return true;
  if (!email) return false;
  const grace = LATE_SUBMITTER_GRACE[email.toLowerCase()];
  if (!grace) return false;
  return now.getTime() <= grace.getTime();
}

export function lateSubmitterGraceFor(
  email: string | null | undefined,
): Date | null {
  if (!email) return null;
  return LATE_SUBMITTER_GRACE[email.toLowerCase()] ?? null;
}

export function formatInTZ(date: Date): string {
  const zoned = toZonedTime(date, TZ);
  return zoned.toLocaleString("en-GB", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
