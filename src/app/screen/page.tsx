import { db, submissions, judgeScores } from "@/lib/db";
import { computeStats, bucketByCategory } from "@/lib/insights";
import { aggregateScores } from "@/lib/judging";
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

  // Finalists — the six highest-scoring ideas across all judges. Empty until
  // judges start scoring; the kiosk reloads every few minutes so it fills in
  // live during judging.
  const scoreRows = await db.select().from(judgeScores).catch(() => []);
  const ranked = aggregateScores(
    scoreRows.map((s) => ({
      submissionId: s.submissionId,
      impact: s.impact,
      demo: s.demo,
      pitch: s.pitch,
      adoptability: s.adoptability,
    })),
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  const finalists = ranked
    .map((a) => {
      const sub = byId.get(a.submissionId);
      if (!sub || sub.status !== "accepted") return null;
      return { title: sub.title, team: sub.developers };
    })
    .filter((f): f is { title: string; team: string[] } => f !== null)
    .slice(0, 6);

  return (
    <KioskDeck
      participants={stats.participants}
      ideas={stats.total}
      accepted={stats.accepted}
      buckets={buckets}
      titles={titles}
      finalists={finalists}
    />
  );
}
