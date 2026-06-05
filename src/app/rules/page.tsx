import Link from "next/link";
import { submissionsOpen, SUBMISSION_DEADLINE, formatInTZ } from "@/lib/dates";
import { CRITERIA } from "@/lib/judging";

export const metadata = {
  title: "Rules · Forcepoint Hackathon",
  description: "The few rules that apply to the 2026-06-09 Forcepoint hackathon.",
};

export default function RulesPage() {
  const open = submissionsOpen();

  const rules: { n: number; title: string; body: string }[] = [
    {
      n: 1,
      title: "Submit before the deadline",
      body: `Submissions close ${formatInTZ(SUBMISSION_DEADLINE)} Asia/Jerusalem. After that, the form locks — no new entries, no edits.`,
    },
    {
      n: 2,
      title: "Teams of up to 3",
      body: "Maximum three developers per team. Smaller is fine — even solo is fine.",
    },
    {
      n: 3,
      title: "In the office, full day",
      body: "Show up. The whole point is hacking together on the day, in person.",
    },
    {
      n: 4,
      title: "SDLC-only — no customer features",
      body: "Ideas must improve our velocity, productivity, or quality. Product- or project-related is fine; customer-facing features are out of scope for this hackathon.",
    },
    {
      n: 5,
      title: "External judges",
      body: "Judges come from outside Forcepoint. They review accepted ideas only.",
    },
    {
      n: 6,
      title: "Judging is two days after",
      body: "Demos and judging happen on Thursday 2026-06-11 — two days after the hackathon.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Rules</h1>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          A few non-negotiables. Read before you submit.
        </p>
      </header>

      <ol className="space-y-4">
        {rules.map((r) => (
          <li key={r.n} className="card">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-semibold text-[color:var(--color-accent)] tabular-nums leading-none mt-0.5">
                {String(r.n).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{r.title}</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                  {r.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">How ideas are judged</h2>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          External judges score each idea 1–5 on these four criteria during the
          demos. Scores are weighted and combined to rank the winners.
        </p>
        <ol className="mt-5 space-y-3">
          {CRITERIA.map((c) => (
            <li key={c.key} className="card flex items-start gap-4">
              <span className="pill border border-[color:var(--color-accent-2)]/40 bg-[color:var(--color-accent-2)]/15 text-[color:var(--color-accent-2)] tabular-nums shrink-0">
                {Math.round(c.weight * 100)}%
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold">{c.label}</h3>
                <p className="mt-0.5 text-sm text-[color:var(--color-muted)] leading-relaxed">
                  {c.blurb}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {open ? (
          <Link href="/submit" className="btn btn-primary">
            Submit an idea
          </Link>
        ) : (
          <span className="btn btn-ghost text-[color:var(--color-muted)]">
            Submissions closed
          </span>
        )}
        <Link href="/ideas" className="btn btn-ghost">
          See ideas
        </Link>
      </div>
    </div>
  );
}
