import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, submissions, judgeScores } from "@/lib/db";
import { verifyJudgeToken } from "@/lib/judge-tokens";
import {
  CRITERIA,
  aggregateScores,
  type ScoreRow,
  type CriterionScores,
} from "@/lib/judging";
import { ScoreForm } from "./ScoreForm";

export const dynamic = "force-dynamic";

export default async function JudgesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; view?: string }>;
}) {
  const { token, view } = await searchParams;
  const judge = token ? await verifyJudgeToken(token) : null;

  if (!judge || !token) {
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

  const showResults = view === "results";
  const scoreHref = `/judges?token=${encodeURIComponent(token)}`;
  const resultsHref = `${scoreHref}&view=results`;

  const accepted = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "accepted"))
    .orderBy(desc(submissions.createdAt));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Judging</span> board
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Score each idea as it&apos;s presented · {accepted.length} finalists
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[color:var(--color-muted)]">Judge</div>
          <div className="text-sm">{judge.name}</div>
        </div>
      </header>

      <nav className="flex items-center gap-2">
        <Tab href={scoreHref} active={!showResults} label="Score ideas" />
        <Tab href={resultsHref} active={showResults} label="🏆 Leaderboard" />
      </nav>

      {showResults ? (
        <Leaderboard accepted={accepted} />
      ) : (
        <ScoringList token={token} judgeEmail={judge.email} accepted={accepted} />
      )}
    </div>
  );
}

async function ScoringList({
  token,
  judgeEmail,
  accepted,
}: {
  token: string;
  judgeEmail: string;
  accepted: (typeof submissions.$inferSelect)[];
}) {
  const myScores = await db
    .select()
    .from(judgeScores)
    .where(eq(judgeScores.judgeEmail, judgeEmail.toLowerCase()));
  const byId = new Map(myScores.map((s) => [s.submissionId, s]));

  if (accepted.length === 0) {
    return (
      <div className="card text-center py-16 text-[color:var(--color-muted)]">
        No accepted ideas to score yet.
      </div>
    );
  }

  return (
    <ol className="space-y-5">
      {accepted.map((s, i) => {
        const mine = byId.get(s.id);
        const initial: Partial<CriterionScores> | undefined = mine
          ? {
              impact: mine.impact,
              demo: mine.demo,
              pitch: mine.pitch,
              adoptability: mine.adoptability,
            }
          : undefined;
        return (
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
            <ScoreForm token={token} submissionId={s.id} initial={initial} />
          </li>
        );
      })}
    </ol>
  );
}

async function Leaderboard({
  accepted,
}: {
  accepted: (typeof submissions.$inferSelect)[];
}) {
  const all = await db.select().from(judgeScores);
  const rows: ScoreRow[] = all.map((s) => ({
    submissionId: s.submissionId,
    impact: s.impact,
    demo: s.demo,
    pitch: s.pitch,
    adoptability: s.adoptability,
  }));
  const ranked = aggregateScores(rows);
  const titleById = new Map(accepted.map((s) => [s.id, s.title]));

  if (ranked.length === 0) {
    return (
      <div className="card text-center py-16 text-[color:var(--color-muted)]">
        No scores submitted yet. The leaderboard fills in as judges score ideas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[color:var(--color-muted)]">
        Combined across all judges — weighted by the rubric, highest first.
      </p>
      <ol className="space-y-3">
        {ranked.map((a, i) => (
          <li key={a.submissionId} className="card">
            <div className="flex items-center gap-4">
              <span
                className={`text-2xl font-bold tabular-nums w-8 text-center ${
                  i === 0 ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-muted)]"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {titleById.get(a.submissionId) ?? "(unknown idea)"}
                </h2>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[color:var(--color-muted)]">
                  {CRITERIA.map((c) => (
                    <span key={c.key}>
                      {c.label}: <span className="tabular-nums">{a.averages[c.key]}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold tabular-nums text-[color:var(--color-accent-2)]">
                  {a.total}
                </div>
                <div className="text-[10px] text-[color:var(--color-muted)]">
                  / 100 · {a.judges} judge{a.judges === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`pill border text-sm transition ${
        active
          ? "border-[color:var(--color-accent-2)] bg-[color:var(--color-accent-2)]/15 text-[color:var(--color-foreground)]"
          : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-accent-2)]/50"
      }`}
    >
      {label}
    </Link>
  );
}
