import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  computeStats,
  submissionTrend,
  bucketByCategory,
  type CategoryBucket,
  type TrendPoint,
} from "@/lib/insights";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insights — Forcepoint Hackathon",
  description: "Submission metadata: ideas needing owners, submission trend, and topic breakdown.",
};

export default async function InsightsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/insights");

  const rows = await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt));

  const stats = computeStats(rows);
  const trend = submissionTrend(rows);
  const buckets = bucketByCategory(rows);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Insights</h1>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Submission metadata across every entry — counts, trend, and topics.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* KPI cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="Total ideas" value={stats.total} accent="accent" />
            <Kpi
              label="Need an owner"
              value={stats.needTeam}
              accent="accent-2"
              hint="Ideas flagged “team needed” — looking for someone to build them."
            />
            <Kpi
              label="Open team spots"
              value={stats.openSpots}
              accent="accent-3"
              hint="Unfilled developer seats across team-needed ideas."
            />
            <Kpi label="Pending review" value={stats.pending} accent="warn" />
          </section>

          <section className="grid grid-cols-3 gap-4">
            <Kpi label="Accepted" value={stats.accepted} accent="success" small />
            <Kpi label="Pending" value={stats.pending} accent="warn" small />
            <Kpi label="Rejected" value={stats.rejected} accent="danger" small />
          </section>

          {/* Ideas needing owners — recruiting CTA */}
          {stats.needTeam > 0 && (
            <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {stats.needTeam} idea{stats.needTeam === 1 ? "" : "s"} still need a team
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                  These were submitted by people who want them built but aren&apos;t
                  necessarily joining. Pick one up.
                </p>
              </div>
              <Link href="/ideas?filter=team" className="btn btn-primary shrink-0">
                Browse open ideas →
              </Link>
            </div>
          )}

          {/* Submission trend */}
          <section className="space-y-4">
            <SectionHead title="Submission trend" sub="Entries per day" />
            <Trend points={trend} />
          </section>

          {/* Topic buckets */}
          <section className="space-y-4">
            <SectionHead
              title="By SDLC stage"
              sub="Which lifecycle stage each idea targets"
            />
            <Buckets buckets={buckets} total={stats.total} />
          </section>
        </>
      )}
    </div>
  );
}

const ACCENTS: Record<string, string> = {
  accent: "var(--color-accent)",
  "accent-2": "var(--color-accent-2)",
  "accent-3": "var(--color-accent-3)",
  success: "var(--color-success)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
};

function Kpi({
  label,
  value,
  accent,
  hint,
  small,
}: {
  label: string;
  value: number;
  accent: keyof typeof ACCENTS;
  hint?: string;
  small?: boolean;
}) {
  const color = ACCENTS[accent];
  return (
    <div className="card" title={hint}>
      <div
        className={small ? "text-2xl font-bold" : "text-4xl font-bold tracking-tight"}
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-[color:var(--color-muted)]">{label}</div>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <span className="text-xs text-[color:var(--color-muted)]">{sub}</span>
    </div>
  );
}

function Trend({ points }: { points: TrendPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <div className="card">
      <div className="flex items-end gap-1.5 h-40">
        {points.map((p) => (
          <div key={p.day} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full flex items-end justify-center flex-1">
              <div
                className="w-full max-w-10 rounded-t-md transition-all"
                style={{
                  height: `${(p.count / max) * 100}%`,
                  minHeight: p.count > 0 ? "4px" : "0",
                  background:
                    "linear-gradient(to top, var(--color-accent), var(--color-accent-2))",
                }}
                title={`${p.label}: ${p.count}`}
              />
            </div>
            <span className="text-[10px] text-[color:var(--color-muted)] tabular-nums">
              {p.count}
            </span>
            <span className="text-[10px] text-[color:var(--color-muted)] font-mono whitespace-nowrap">
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Buckets({ buckets, total }: { buckets: CategoryBucket[]; total: number }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="card space-y-3">
      {buckets.map((b) => {
        const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
        return (
          <div key={b.key} className="flex items-center gap-3">
            <div className="w-44 shrink-0 text-sm flex items-center gap-2">
              <span>{b.icon}</span>
              <span className="truncate">{b.label}</span>
            </div>
            <div className="flex-1 h-2.5 rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(b.count / max) * 100}%`,
                  background:
                    "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
                }}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-sm tabular-nums">
              {b.count}
              <span className="ml-1 text-xs text-[color:var(--color-muted)]">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-16">
      <div className="text-5xl mb-4">📊</div>
      <p className="text-[color:var(--color-muted)]">
        No submissions yet — nothing to chart.
      </p>
    </div>
  );
}
