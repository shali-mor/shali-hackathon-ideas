import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, submissions } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { submissionsOpen, SUBMISSION_DEADLINE, formatInTZ } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MySubmissionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/my-submissions");

  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.submittedByEmail, session.user.email))
    .orderBy(desc(submissions.createdAt));

  const open = submissionsOpen();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My submissions</h1>
        {open && (
          <Link
            href="/submit"
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 text-sm"
          >
            New
          </Link>
        )}
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {open
          ? `Editable until ${formatInTZ(SUBMISSION_DEADLINE)}. Any edit resets status to pending.`
          : "Submissions are closed; entries are read-only."}
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          You haven&apos;t submitted any ideas yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <div className="flex items-center gap-3">
                <Link href={`/ideas/${s.id}`} className="font-medium hover:underline">
                  {s.title}
                </Link>
                <StatusBadge status={s.status} />
              </div>
              {s.reviewNote && (
                <p className="mt-1 text-xs text-neutral-500">
                  Reviewer note: {s.reviewNote}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-sm">
                <Link href={`/ideas/${s.id}`} className="text-neutral-600 hover:underline">
                  View
                </Link>
                {open && (
                  <Link
                    href={`/my-submissions/${s.id}/edit`}
                    className="text-neutral-600 hover:underline"
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
