import { db, submissions } from "@/lib/db";
import { computeStats, bucketByCategory } from "@/lib/insights";
import { KioskDeck } from "@/components/KioskDeck";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forcepoint Hackathon — Live",
  description: "Live event display: stats, judges, and judging criteria.",
};

// Full-screen, auto-looping kiosk display for the event. Public (no auth) so it
// can run on any screen all day; it pulls live counts and reloads periodically.
export default async function ScreenPage() {
  const rows = await db
    .select()
    .from(submissions)
    .catch(() => []);

  const stats = computeStats(rows);
  const buckets = bucketByCategory(rows).map((b) => ({
    label: b.label,
    icon: b.icon,
    count: b.count,
  }));

  // Idea titles for the scrolling ticker — celebrate the accepted set, falling
  // back to everything that isn't rejected, then to all.
  const accepted = rows.filter((r) => r.status === "accepted").map((r) => r.title);
  const nonRejected = rows.filter((r) => r.status !== "rejected").map((r) => r.title);
  const titles = (accepted.length ? accepted : nonRejected.length ? nonRejected : rows.map((r) => r.title));

  return (
    <KioskDeck
      participants={stats.participants}
      ideas={stats.total}
      accepted={stats.accepted}
      buckets={buckets}
      titles={titles}
    />
  );
}
