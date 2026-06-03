import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const TZ = "Asia/Jerusalem";

export const SUBMISSION_DEADLINE = fromZonedTime("2026-06-04 23:59:59", TZ);
export const HACKATHON_DAY = fromZonedTime("2026-06-09 09:00:00", TZ);
export const JUDGING_DAY = fromZonedTime("2026-06-11 09:00:00", TZ);

export function submissionsOpen(now: Date = new Date()): boolean {
  return now.getTime() <= SUBMISSION_DEADLINE.getTime();
}

export function formatInTZ(date: Date): string {
  const zoned = toZonedTime(date, TZ);
  return zoned.toLocaleString("en-GB", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
