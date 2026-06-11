import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, submissions, judgeScores, finalScores } from "@/lib/db";
import { verifyJudgeToken } from "@/lib/judge-tokens";
import { aggregateScores } from "@/lib/judging";
import { FilterableIdeas, type IdeaForJudging } from "../FilterableIdeas";
import { Leaderboard } from "../Leaderboard";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// How many of the top semi-final ideas advance to the final round.
const FINALIST_COUNT = 6;

export default async function FinalsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; view?: string }>;
}) {
  const { token, view } = await searchParams;

  // Same access model as the semi-final page: a signed judge link, or an
  // admin session.
  const tokenJudge = token ? await verifyJudgeToken(token) : null;
  const session = await getSession();
  const isSignedInAdmin = isAdmin(session?.user?.email);
  const me =
    tokenJudge ??
    (isSignedInAdmin && session?.user?.email
      ? {
          name: session.user.name ?? session.user.email,
          email: session.user.email,
        }
      : null);

  if (!me) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold tracking-tight">Judges only</h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          Open this page with your private judge link, or sign in as an admin.
        </p>
        <Link href="/auth/signin?callbackUrl=/judges/finals" className="btn btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  const showResults = view === "results";
  const baseHref = token
    ? `/judges/finals?token=${encodeURIComponent(token)}`
    : "/judges/finals";
  const scoreHref = baseHref;
  const resultsHref = token ? `${baseHref}&view=results` : `${baseHref}?view=results`;
  const semiHref = token ? `/judges?token=${encodeURIComponent(token)}` : "/judges";

  // The finalists are the top FINALIST_COUNT accepted ideas by combined
  // semi-final score. Computed live so it tracks the semi-final leaderboard.
  const accepted = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "accepted"));
  const acceptedById = new Map(accepted.map((s) => [s.id, s]));

  const semiAll = await db.select().from(judgeScores);
  const ranked = aggregateScores(
    semiAll.map((s) => ({
      submissionId: s.submissionId,
      impact: s.impact,
      demo: s.demo,
      pitch: s.pitch,
      adoptability: s.adoptability,
    })),
  );
  const finalists = ranked
    .map((a) => acceptedById.get(a.submissionId))
    .filter((s): s is (typeof accepted)[number] => Boolean(s))
    .slice(0, FINALIST_COUNT);

  const titleById = new Map(finalists.map((s) => [s.id, s.title]));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Final</span> judging
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Score the top {finalists.length} finalist
            {finalists.length === 1 ? "" : "s"} — a fresh round, separate from
            the semi-final scores
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[color:var(--color-muted)]">
            {tokenJudge ? "Judge" : "Admin"}
          </div>
          <div className="text-sm">{me.name}</div>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mr-1">
          Round
        </span>
        <Tab href={semiHref} active={false} label="Semi-final" />
        <Tab href={baseHref} active label="🏁 Final" />
      </div>

      {finalists.length === 0 ? (
        <div className="card text-center py-16 text-[color:var(--color-muted)]">
          No finalists yet. The top {FINALIST_COUNT} ideas appear here once
          they&apos;ve been scored in the{" "}
          <Link href={semiHref} className="text-[color:var(--color-accent-2)] hover:underline">
            semi-final round
          </Link>
          .
        </div>
      ) : (
        <>
          <nav className="flex items-center gap-2">
            <Tab href={scoreHref} active={!showResults} label="Score finalists" />
            <Tab href={resultsHref} active={showResults} label="🏆 Leaderboard" />
          </nav>

          {showResults ? (
            <FinalLeaderboard finalistIds={finalists.map((s) => s.id)} titleById={titleById} />
          ) : (
            <FinalScoringList
              token={token ?? ""}
              judgeEmail={me.email}
              finalists={finalists}
            />
          )}
        </>
      )}
    </div>
  );
}

async function FinalScoringList({
  token,
  judgeEmail,
  finalists,
}: {
  token: string;
  judgeEmail: string;
  finalists: (typeof submissions.$inferSelect)[];
}) {
  const mine = await db
    .select()
    .from(finalScores)
    .where(eq(finalScores.judgeEmail, judgeEmail.toLowerCase()));
  const byId = new Map(mine.map((s) => [s.submissionId, s]));

  const ideas: IdeaForJudging[] = finalists.map((s) => {
    const score = byId.get(s.id);
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      motivation: s.motivation,
      developers: s.developers,
      scored: !!score,
      initial: score
        ? {
            impact: score.impact,
            demo: score.demo,
            pitch: score.pitch,
            adoptability: score.adoptability,
          }
        : undefined,
    };
  });

  return <FilterableIdeas token={token} ideas={ideas} round="final" />;
}

async function FinalLeaderboard({
  finalistIds,
  titleById,
}: {
  finalistIds: string[];
  titleById: Map<string, string>;
}) {
  const ids = new Set(finalistIds);
  const all = await db.select().from(finalScores);
  // Guard against stale rows: only ever rank the current finalists.
  const scores = all.filter((s) => ids.has(s.submissionId));

  return (
    <Leaderboard
      scores={scores}
      titleById={titleById}
      intro="Final-round scores, combined across all judges — weighted by the rubric, highest first. Expand a card to see what each judge submitted."
      emptyHint="No final-round scores submitted yet. The leaderboard fills in as judges score the finalists."
    />
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
