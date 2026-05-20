import { desc, eq } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { verifyJudgeToken } from "@/lib/judge-tokens";

export const dynamic = "force-dynamic";

export default async function JudgesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const judge = token ? await verifyJudgeToken(token) : null;

  if (!judge) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Judges</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          This page is only accessible via your private link. If you&apos;re a
          judge and didn&apos;t receive one, contact the organizer.
        </p>
      </div>
    );
  }

  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "accepted"))
    .orderBy(desc(submissions.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hackathon ideas — judging
        </h1>
        <span className="text-xs text-neutral-500">
          Judge: <strong>{judge.name}</strong>
        </span>
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Read-only list of accepted ideas. Scoring is offline.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No accepted ideas yet.</p>
      ) : (
        <ol className="mt-6 space-y-4">
          {rows.map((s, i) => (
            <li
              key={s.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">#{i + 1}</span>
                <h2 className="font-medium">{s.title}</h2>
                <StatusBadge status={s.status} />
              </div>
              <section className="mt-3 space-y-1">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Idea
                </h3>
                <p className="whitespace-pre-wrap text-sm">{s.description}</p>
              </section>
              <section className="mt-3 space-y-1">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Motivation
                </h3>
                <p className="whitespace-pre-wrap text-sm">{s.motivation}</p>
              </section>
              <p className="mt-3 text-xs text-neutral-500">
                Developers: {s.developers.join(", ")}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
