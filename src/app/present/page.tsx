import Link from "next/link";
import { CRITERIA } from "@/lib/judging";
import { CopyButton } from "@/components/CopyButton";

export const metadata = {
  title: "Pitch & demo guide · Forcepoint Hackathon",
  description:
    "A suggested 10-minute presentation template for hackathon demos, plus tips and a copy-paste slide outline.",
};

type Step = {
  time: string;
  title: string;
  body: string;
  tip: string;
  emphasis?: boolean;
};

const STEPS: Step[] = [
  {
    time: "0:00",
    title: "Problem & who hurts",
    body: "Open with the pain. Who feels it, how often, and what it costs today — concrete and specific.",
    tip: "Lead with a real moment, not a definition.",
  },
  {
    time: "2:00",
    title: "The idea + approach",
    body: "Your idea in one sentence, then how you tackle it. Just enough for the demo to make sense.",
    tip: "If you can't say it in one line, tighten it.",
  },
  {
    time: "3:00",
    title: "Live demo — the wow moment",
    body: "The heart of the pitch. Show it actually working, and open with the single most impressive thing it does.",
    tip: "Spend the most time here. Demo first, explain second.",
    emphasis: true,
  },
  {
    time: "7:00",
    title: "How it works",
    body: "A brief look under the hood — the architecture in a sentence or two, and what's real vs. stubbed for the demo.",
    tip: "Be honest about what's a prototype — judges respect it.",
  },
  {
    time: "8:00",
    title: "Impact & adoption",
    body: "Who benefits, the measurable saving, and how the whole org could adopt it tomorrow with low upkeep.",
    tip: "Put a number on it — hours, dollars, or bugs avoided.",
  },
  {
    time: "9:00",
    title: "Ask & Q&A",
    body: "End with a clear ask (a next step, a team, a decision) and leave room for judges' questions.",
    tip: "Rehearse the last line — finish strong, not by running out of time.",
  },
];

const DOS = [
  "Anchor everything on the live demo — show, don't tell.",
  "Pick one wow moment and build the pitch around it.",
  "Record a fallback demo video in case the live run fails.",
  "Name who benefits and a measurable saving.",
  "Rehearse to time — 10 minutes goes fast.",
  "End with a concrete ask.",
];

const DONTS = [
  "Don't spend three minutes on setup and config.",
  "Don't read slides full of bullet points aloud.",
  "Don't demo blind — have seeded data ready.",
  "Don't oversell a prototype as production-ready.",
  "Don't run over — you'll get cut off mid-demo.",
];

const OUTLINE = `Slide 1 — Title
  Idea name · team · one-line tagline

Slide 2 — The problem
  Who hurts, how often, what it costs today

Slide 3 — The idea
  Your idea in one sentence + the approach

Slide 4 — LIVE DEMO (no slide — switch to the product)
  Lead with the most impressive thing it does

Slide 5 — How it works
  Architecture in 1–2 lines · what's real vs. stubbed

Slide 6 — Impact & adoption
  Who benefits · measurable saving · how the org adopts it

Slide 7 — The ask
  Clear next step + thank you / Q&A`;

export default function PresentPage() {
  const criteria = CRITERIA.map((c) => c.label).join(" · ");

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="gradient-text">Pitch</span> &amp; demo guide
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          You get ~10 minutes to present. Judges score on {criteria}. This
          template is built to be demo-first and land all four.
        </p>
      </header>

      {/* 10-minute template */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight">The 10-minute template</h2>
        <ol className="mt-5 space-y-3">
          {STEPS.map((s) => (
            <li
              key={s.time}
              className={`card flex items-start gap-4 ${
                s.emphasis ? "glow-ring" : ""
              }`}
            >
              <span className="pill border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] tabular-nums shrink-0 font-mono">
                {s.time}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  {s.title}
                  {s.emphasis && (
                    <span className="ml-2 text-xs text-[color:var(--color-accent-2)]">
                      ★ spend the most time here
                    </span>
                  )}
                </h3>
                <p className="mt-0.5 text-sm text-[color:var(--color-muted)] leading-relaxed">
                  {s.body}
                </p>
                <p className="mt-1.5 text-xs text-[color:var(--color-accent-2)] italic">
                  {s.tip}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Tips */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Tips</h2>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-[color:var(--color-success)]">Do</h3>
            <ul className="mt-3 space-y-2">
              {DOS.map((t) => (
                <li key={t} className="text-sm text-[color:var(--color-muted)] flex gap-2">
                  <span className="text-[color:var(--color-success)]">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-[color:var(--color-danger)]">Don&apos;t</h3>
            <ul className="mt-3 space-y-2">
              {DONTS.map((t) => (
                <li key={t} className="text-sm text-[color:var(--color-muted)] flex gap-2">
                  <span className="text-[color:var(--color-danger)]">✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Copy-paste slide outline */}
      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Slide outline</h2>
          <CopyButton text={OUTLINE} label="Copy outline" />
        </div>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          A skeleton to paste straight into Slides or PowerPoint — titles plus a
          one-line prompt for each.
        </p>
        <pre className="card mt-4 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-[color:var(--color-foreground)]">
{OUTLINE}
        </pre>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link href="/rules" className="btn btn-ghost">
          ← Rules &amp; judging
        </Link>
        <Link href="/ideas" className="btn btn-ghost">
          See ideas
        </Link>
      </div>
    </div>
  );
}
