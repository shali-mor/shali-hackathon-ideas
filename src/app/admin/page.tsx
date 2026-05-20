import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db, submissions } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { StatusBadge } from "@/components/StatusBadge";
import {
  acceptSubmission,
  rejectSubmission,
  reopenSubmission,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: "pending" | "accepted" | "rejected" | "all" }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/");

  const { status: filter = "pending" } = await searchParams;
  const all = await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt));
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    accepted: all.filter((r) => r.status === "accepted").length,
    rejected: all.filter((r) => r.status === "rejected").length,
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {(["pending", "accepted", "rejected", "all"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={
              filter === s
                ? "rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1"
                : "rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1"
            }
          >
            {s} ({counts[s]})
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">Nothing to review.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/ideas/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.title}
                    </Link>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    by {s.submittedByName ?? s.submittedByEmail} · contact{" "}
                    {s.teamContact}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                    {s.description}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    devs: {s.developers.join(", ")}
                  </p>
                </div>
              </div>

              <details className="mt-3">
                <summary className="text-sm cursor-pointer text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100">
                  Review actions
                </summary>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <form action={acceptSubmission} className="space-y-2">
                    <input type="hidden" name="id" value={s.id} />
                    <textarea
                      name="reviewNote"
                      placeholder="Optional note to submitter…"
                      rows={2}
                      className="input"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm"
                    >
                      Accept
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
                    <button
                      type="submit"
                      className="w-full rounded-md bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-sm"
                    >
                      Reject
                    </button>
                  </form>
                </div>
                {s.status !== "pending" && (
                  <form action={reopenSubmission} className="mt-3">
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="text-xs text-neutral-600 hover:underline"
                    >
                      Re-open (set to pending)
                    </button>
                  </form>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
