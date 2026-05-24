import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { StatusBadge } from "@/components/StatusBadge";
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

  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    accepted: all.filter((r) => r.status === "accepted").length,
    rejected: all.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Review queue</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Accept or reject submissions. Submitters see status update in their dashboard.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {(["pending", "accepted", "rejected", "all"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`pill border ${
              filter === s
                ? "bg-[color:var(--color-foreground)] text-[color:var(--color-background)] border-transparent"
                : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
            }`}
          >
            {s} <span className="opacity-60">({counts[s]})</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-[color:var(--color-muted)]">
          Nothing in this bucket.
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((s) => (
            <li key={s.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/ideas/${s.id}`}
                      className="text-lg font-semibold hover:gradient-text transition"
                    >
                      {s.title}
                    </Link>
                    <StatusBadge status={s.status} />
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
          ))}
        </ul>
      )}
    </div>
  );
}
