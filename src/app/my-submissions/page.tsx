import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { submissionsOpen, SUBMISSION_DEADLINE, formatInTZ } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MySubmissionsPage() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/my-submissions");

  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.submittedByEmail, session.user.email))
    .orderBy(desc(submissions.createdAt));

  const open = submissionsOpen();

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">My ideas</h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            {open
              ? `Editable until ${formatInTZ(SUBMISSION_DEADLINE)}. Edits reset status to pending.`
              : "Submissions are closed; entries are read-only."}
          </p>
        </div>
        {open && (
          <Link href="/submit" className="btn btn-primary">
            New idea →
          </Link>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">💡</div>
          <p className="text-[color:var(--color-muted)]">
            You haven&apos;t submitted any ideas yet.
          </p>
          {open && (
            <Link href="/submit" className="btn btn-primary mt-6">
              Submit your first
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li key={s.id} className="card card-hover">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <Link
                  href={`/ideas/${s.id}`}
                  className="text-lg font-semibold hover:gradient-text transition"
                >
                  {s.title}
                </Link>
                <StatusBadge status={s.status} />
              </div>
              {s.reviewNote && (
                <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                  Reviewer note: {s.reviewNote}
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <Link
                  href={`/ideas/${s.id}`}
                  className="text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                >
                  View
                </Link>
                {open && (
                  <Link
                    href={`/my-submissions/${s.id}/edit`}
                    className="text-[color:var(--color-accent-2)] hover:brightness-110"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
