import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, submissions, judgeScores } from "@/lib/db";
import { verifyJudgeToken } from "@/lib/judge-tokens";
import { FilterableIdeas, type IdeaForJudging } from "./FilterableIdeas";
import { Leaderboard } from "./Leaderboard";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function JudgesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; view?: string }>;
}) {
  const { token, view } = await searchParams;

  // Two paths in: a signed link (for external judges) or an admin session.
  // Token wins if present; otherwise fall back to the signed-in admin.
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
          Open this page with your private judge link, or sign in as an
          admin.
        </p>
        <Link href="/auth/signin?callbackUrl=/judges" className="btn btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  const showResults = view === "results";
  // For admins (no token) use a token-less URL; for token-judges keep it on
  // the URL so refresh + tab links continue to work.
  const baseHref = token ? `/judges?token=${encodeURIComponent(token)}` : "/judges";
  const scoreHref = baseHref;
  const resultsHref = token
    ? `${baseHref}&view=results`
    : `${baseHref}?view=results`;

  const finalsHref = token
    ? `/judges/finals?token=${encodeURIComponent(token)}`
    : "/judges/finals";

  const accepted = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "accepted"))
    .orderBy(desc(submissions.createdAt));

  const semiScores = showResults ? await db.select().from(judgeScores) : [];
  const titleById = new Map(accepted.map((s) => [s.id, s.title]));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Semi-final</span> judging
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Score every accepted idea · {accepted.length} ideas
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
        <Tab href={baseHref} active label="Semi-final" />
        <Tab href={finalsHref} active={false} label="🏁 Final" />
      </div>

      <nav className="flex items-center gap-2">
        <Tab href={scoreHref} active={!showResults} label="Score ideas" />
        <Tab href={resultsHref} active={showResults} label="🏆 Semi-final leaderboard" />
      </nav>

      {showResults ? (
        <Leaderboard scores={semiScores} titleById={titleById} />
      ) : (
        <ScoringList token={token ?? ""} judgeEmail={me.email} accepted={accepted} />
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

  const ideas: IdeaForJudging[] = accepted.map((s) => {
    const mine = byId.get(s.id);
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      motivation: s.motivation,
      developers: s.developers,
      scored: !!mine,
      initial: mine
        ? {
            impact: mine.impact,
            demo: mine.demo,
            pitch: mine.pitch,
            adoptability: mine.adoptability,
          }
        : undefined,
    };
  });

  return <FilterableIdeas token={token} ideas={ideas} />;
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
