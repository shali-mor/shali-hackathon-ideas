import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const session = await auth();
  const admin = isAdmin(session?.user?.email);

  const rows = admin
    ? await db.select().from(submissions).orderBy(desc(submissions.createdAt))
    : await db
        .select()
        .from(submissions)
        .where(eq(submissions.status, "accepted"))
        .orderBy(desc(submissions.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {admin ? "All submissions" : "Accepted ideas"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {admin
          ? "Admin view — all submissions regardless of status."
          : "Only accepted ideas are shown publicly."}
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No ideas yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              <Link href={`/ideas/${s.id}`} className="block">
                <div className="flex items-center gap-3">
                  <h2 className="font-medium">{s.title}</h2>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {s.description}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  by {s.developers.join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
