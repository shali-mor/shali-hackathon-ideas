import { desc, eq } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
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
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold tracking-tight">Judges only</h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          This page is accessible only via your private link.
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
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Accepted</span> ideas
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">Judge view · read-only</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[color:var(--color-muted)]">Judge</div>
          <div className="text-sm">{judge.name}</div>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="card text-center py-16 text-[color:var(--color-muted)]">
          No accepted ideas yet.
        </div>
      ) : (
        <ol className="space-y-5">
          {rows.map((s, i) => (
            <li key={s.id} className="card">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-xs text-[color:var(--color-muted)] tabular-nums">
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-2xl font-semibold tracking-tight">{s.title}</h2>
              </div>
              <section className="mt-4 space-y-1">
                <h3 className="text-xs text-[color:var(--color-muted)]">Idea</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.description}</p>
              </section>
              <section className="mt-4 space-y-1">
                <h3 className="text-xs text-[color:var(--color-muted)]">Motivation</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.motivation}</p>
              </section>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.developers.map((d) => (
                  <span
                    key={d}
                    className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[color:var(--color-foreground)]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
