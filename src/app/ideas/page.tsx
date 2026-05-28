import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { StatusBadge, TeamNeededBadge } from "@/components/StatusBadge";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const session = await getSession();
  const admin = isAdmin(session?.user?.email);

  const rows = admin
    ? await db.select().from(submissions).orderBy(desc(submissions.createdAt))
    : await db
        .select()
        .from(submissions)
        .where(eq(submissions.status, "accepted"))
        .orderBy(desc(submissions.createdAt));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">
          {admin ? "All submissions" : "Accepted ideas"}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          {admin
            ? "Admin view — every submission, every status."
            : "What teams are building on 2026-06-09."}
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState admin={admin} />
      ) : (
        <ul className="grid md:grid-cols-2 gap-4">
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/ideas/${s.id}`} className="card card-hover block h-full">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-tight">{s.title}</h2>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {s.teamNeeded && <TeamNeededBadge />}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                  Submitted by {s.submittedByName ?? s.submittedByEmail}
                </p>
                <p className="mt-3 text-sm text-[color:var(--color-muted)] line-clamp-3">
                  {s.description}
                </p>
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {s.developers.slice(0, 4).map((d) => (
                    <span
                      key={d}
                      className="pill border border-[color:var(--color-border)] text-[color:var(--color-muted)] bg-[color:var(--color-surface-2)]/70"
                    >
                      {d}
                    </span>
                  ))}
                  {s.developers.length > 4 && (
                    <span className="text-xs text-[color:var(--color-muted)]">
                      +{s.developers.length - 4}
                    </span>
                  )}
                  {s.teamNeeded && s.developers.length === 0 && (
                    <span className="text-xs text-[color:var(--color-muted)] italic">
                      No team yet — devs can join later
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ admin }: { admin: boolean }) {
  return (
    <div className="card text-center py-16">
      <div className="text-5xl mb-4">🚀</div>
      <p className="text-[color:var(--color-muted)]">
        {admin ? "No submissions yet." : "No accepted ideas yet — check back soon."}
      </p>
      {!admin && (
        <Link href="/submit" className="btn btn-primary mt-6">
          Submit the first one
        </Link>
      )}
    </div>
  );
}
