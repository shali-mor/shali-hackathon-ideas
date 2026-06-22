import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions, judgeScores } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import {
  StatusBadge,
  TeamNeededBadge,
  ImmediateImplBadge,
} from "@/components/StatusBadge";
import { aggregateScores, type ScoreRow } from "@/lib/judging";
import {
  acceptSubmission,
  rejectSubmission,
  reopenSubmission,
} from "./actions";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: "pending" | "accepted" | "rejected" | "all" }>;
}) {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) redirect("/");

  const { status: filter = "pending" } = await searchParams;
  const all = await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  // Pull all judge scores once and map each submission → aggregate.
  const allScores = await db.select().from(judgeScores);
  const scoreRows: ScoreRow[] = allScores.map((s) => ({
    submissionId: s.submissionId,
    impact: s.impact,
    demo: s.demo,
    pitch: s.pitch,
    adoptability: s.adoptability,
  }));
  const aggBySubmission = new Map(
    aggregateScores(scoreRows).map((a) => [a.submissionId, a]),
  );

  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    accepted: all.filter((r) => r.status === "accepted").length,
    rejected: all.filter((r) => r.status === "rejected").length,
  };

  const STAT_TABS = [
    {
      key: "pending" as const,
      label: "Pending review",
      colorVar: "--color-warn",
    },
    {
      key: "accepted" as const,
      label: "Accepted",
      colorVar: "--color-success",
    },
    {
      key: "rejected" as const,
      label: "Rejected",
      colorVar: "--color-danger",
    },
    {
      key: "all" as const,
      label: "All ideas",
      colorVar: "--color-accent-2",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-none">
              <span className="gradient-text">Review</span> queue
            </h1>
            <p className="mt-3 text-sm text-[color:var(--color-muted)]">
              Accept or reject submissions · {all.length} total
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/screen"
              target="_blank"
              className="inline-flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition border bg-[color:var(--color-accent-2)]/15 hover:bg-[color:var(--color-accent-2)]/25"
              style={{
                borderColor: "color-mix(in oklab, var(--color-accent-2) 55%, transparent)",
                boxShadow:
                  "0 0 0 1px color-mix(in oklab, var(--color-accent-2) 18%, transparent), 0 6px 18px -10px color-mix(in oklab, var(--color-accent-2) 60%, transparent)",
              }}
            >
              <span className="dot-live" />
              <span>Live screen</span>
              <span className="text-xs opacity-70">↗</span>
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold border transition"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-accent-3) 55%, transparent)",
                background:
                  "color-mix(in oklab, var(--color-accent-3) 14%, transparent)",
                color: "var(--color-accent-3)",
              }}
            >
              <span aria-hidden>🗺️</span>
              <span>Roadmap</span>
            </Link>
            <Link
              href="/ideas/export"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-accent-2)]/40 transition"
            >
              <span aria-hidden>📄</span>
              <span>Export PDF</span>
            </Link>
          </div>
        </div>

        {/* Stat tiles that are also the status filter */}
        <nav className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/admin?status=${tab.key}`}
                aria-current={active ? "page" : undefined}
                className="group relative rounded-lg border px-4 py-3.5 transition overflow-hidden"
                style={{
                  borderColor: active
                    ? `color-mix(in oklab, var(${tab.colorVar}) 55%, transparent)`
                    : "var(--color-border)",
                  background: active
                    ? `color-mix(in oklab, var(${tab.colorVar}) 12%, transparent)`
                    : "color-mix(in oklab, white 2%, transparent)",
                  boxShadow: active
                    ? `inset 0 0 0 1px color-mix(in oklab, var(${tab.colorVar}) 30%, transparent)`
                    : "none",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{
                    color: active
                      ? `var(${tab.colorVar})`
                      : "var(--color-muted)",
                  }}
                >
                  {tab.label}
                </div>
                <div
                  className="mt-1 text-3xl font-bold tabular-nums leading-none"
                  style={{
                    color: active
                      ? "var(--color-foreground)"
                      : "var(--color-foreground)",
                  }}
                >
                  {counts[tab.key]}
                </div>
              </Link>
            );
          })}
        </nav>
      </header>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-[color:var(--color-muted)]">
          Nothing in this bucket.
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((s) => {
            const agg = aggBySubmission.get(s.id);
            return (
            <li key={s.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/ideas/${s.id}`}
                      className="text-lg font-semibold hover:gradient-text transition"
                    >
                      {s.title}
                    </Link>
                    <StatusBadge status={s.status} />
                    {s.teamNeeded && <TeamNeededBadge />}
                    {s.needsImmediateImpl && <ImmediateImplBadge />}
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                    {s.submittedByName ?? s.submittedByEmail} · contact {s.teamContact}
                  </p>
                  <p className="mt-3 text-sm text-[color:var(--color-foreground)]/90 line-clamp-3">
                    {s.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.developers.map((d) => (
                      <span
                        key={d}
                        className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[color:var(--color-muted)]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/judges"
                  className="shrink-0 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/40 px-3 py-2 text-right hover:border-[color:var(--color-accent-2)]/50 transition"
                  title={agg ? `Open judging leaderboard` : "Open judging board"}
                >
                  {agg ? (
                    <>
                      <div className="text-2xl font-bold tabular-nums gradient-text leading-none">
                        {agg.total}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mt-1">
                        / 100 · {agg.judges} judge{agg.judges === 1 ? "" : "s"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-[color:var(--color-muted)] leading-none">
                        —
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mt-1">
                        Not scored
                      </div>
                    </>
                  )}
                </Link>
              </div>

              <details className="mt-4 group">
                <summary className="cursor-pointer text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
                  ▸ Review
                </summary>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <form action={acceptSubmission} className="space-y-2">
                    <input type="hidden" name="id" value={s.id} />
                    <textarea
                      name="reviewNote"
                      placeholder="Optional note…"
                      rows={2}
                      className="input"
                    />
                    <button type="submit" className="btn btn-success w-full">
                      ✓ Accept
                    </button>
                  </form>
                  <form action={rejectSubmission} className="space-y-2">
                    <input type="hidden" name="id" value={s.id} />
                    <textarea
                      name="reviewNote"
                      placeholder="Optional reason…"
                      rows={2}
                      className="input"
                    />
                    <button type="submit" className="btn btn-danger w-full">
                      ✕ Reject
                    </button>
                  </form>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  {s.status !== "pending" && (
                    <form action={reopenSubmission}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                      >
                        ↻ Reopen
                      </button>
                    </form>
                  )}
                  <DeleteButton id={s.id} title={s.title} />
                </div>
              </details>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
