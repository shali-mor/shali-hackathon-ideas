import { redirect } from "next/navigation";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db, submissions } from "@/lib/db";
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  CATEGORY_COLOR,
  categoryDisplay,
  type CategoryKey,
} from "@/lib/insights";
import { ImmediateImplBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Skills Roadmap · Forcepoint Hackathon",
  description:
    "Quarterly AI-skills roadmap synthesised from the hackathon ideas.",
};

// Two strategic additions that aren't hackathon submissions but belong on
// the quarterly roadmap. Pin them at the top of their stages.
type SyntheticSkill = {
  key: string;
  title: string;
  summary: string;
  category: CategoryKey;
  categoryOther?: string;
  pinned: true;
};

const EXTRA_SKILLS: SyntheticSkill[] = [
  {
    key: "classifier-rules",
    title: "Classifier Rules",
    summary:
      "A reusable AI skill that generates and tunes DLP/CPS classifier rules (regex, dictionaries, scoring) from natural-language examples — turning new policy intent into shippable detection without hand-crafted patterns.",
    category: "development",
    pinned: true,
  },
  {
    key: "skill-reviewer",
    title: "Skill Reviewer",
    summary:
      "A meta-skill that audits every other AI skill across cost, latency, efficiency, security, prompt drift, and adherence to org standards — so the skill catalog stays accountable as it grows.",
    category: "other",
    categoryOther: "Governance & meta",
    pinned: true,
  },
];

type Card = {
  key: string;
  title: string;
  summary: string;
  category: CategoryKey;
  categoryOther?: string | null;
  developers?: string[];
  needsImmediateImpl?: boolean;
  pinned?: boolean;
  shortId?: string;
};

// Pull the first usable sentence from a multi-paragraph idea. Skip short
// header-only lines like "Overview".
function summarise(text: string, max = 180): string {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const body =
    lines.find(
      (l) => l.length > 30 || (l.length > 0 && !/^[\w &/]{1,30}$/.test(l)),
    ) ?? lines[0] ?? "";
  const sentence = body.match(/^[^.!?\n]+[.!?]/)?.[0] ?? body;
  const out = sentence.trim();
  return out.length > max ? out.slice(0, max - 3) + "…" : out;
}

export default async function RoadmapPage() {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) redirect("/");

  const accepted = await db
    .select()
    .from(submissions)
    .orderBy(asc(submissions.createdAt));

  // Map accepted submissions → roadmap cards.
  const submitted: Card[] = accepted
    .filter((s) => s.status === "accepted")
    .map((s) => ({
      key: s.id,
      title: s.title,
      summary: summarise(s.description),
      category: (s.category as CategoryKey) ?? "other",
      categoryOther: s.categoryOther ?? null,
      developers: s.developers,
      needsImmediateImpl: s.needsImmediateImpl,
      shortId: s.id.slice(0, 4).toUpperCase(),
    }));

  // Group: pinned extras at the top of their stage, then submitted ideas.
  const cardsByStage = new Map<CategoryKey, Card[]>();
  for (const e of EXTRA_SKILLS) {
    const list = cardsByStage.get(e.category) ?? [];
    list.push({ ...e, pinned: true });
    cardsByStage.set(e.category, list);
  }
  for (const c of submitted) {
    const list = cardsByStage.get(c.category) ?? [];
    list.push(c);
    cardsByStage.set(c.category, list);
  }

  const stages = CATEGORY_ORDER.filter((k) => (cardsByStage.get(k)?.length ?? 0) > 0);
  const total = submitted.length + EXTRA_SKILLS.length;
  const immediateCount = submitted.filter((c) => c.needsImmediateImpl).length;

  let cardIndex = 0;

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <BranchMark />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-none">
                <span className="gradient-text">AI Skills</span> Roadmap
              </h1>
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-muted)] max-w-2xl">
              <span className="tabular-nums font-semibold text-[color:var(--color-foreground)]">
                {total}
              </span>{" "}
              skills sequenced across the SDLC — synthesised from{" "}
              <span className="tabular-nums font-semibold text-[color:var(--color-foreground)]">
                {submitted.length}
              </span>{" "}
              accepted hackathon ideas, plus{" "}
              <span className="tabular-nums font-semibold text-[color:var(--color-foreground)]">
                {EXTRA_SKILLS.length}
              </span>{" "}
              strategic additions. Each card is a commitment for the coming quarter.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[color:var(--color-muted)]">
              <span className="tabular-nums">{stages.length}</span> stages
            </span>
            {immediateCount > 0 && (
              <span className="pill border border-[color:var(--color-danger)]/45 bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]">
                ⚡ {immediateCount} immediate
              </span>
            )}
          </div>
        </div>

        {/* Stage legend strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {stages.map((k) => {
            const meta = CATEGORY_META[k];
            const color = CATEGORY_COLOR[k];
            const count = cardsByStage.get(k)?.length ?? 0;
            return (
              <a
                key={k}
                href={`#stage-${k}`}
                className="pill border text-xs transition hover:brightness-110"
                style={{
                  borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
                  background: `color-mix(in oklab, ${color} 10%, transparent)`,
                  color: color,
                }}
              >
                <span aria-hidden className="mr-1">
                  {meta.icon}
                </span>
                {meta.label}
                <span className="ml-1.5 tabular-nums opacity-80">{count}</span>
              </a>
            );
          })}
        </div>
      </header>

      {/* Stage sections */}
      <div className="space-y-12">
        {stages.map((k) => {
          const meta = CATEGORY_META[k];
          const color = CATEGORY_COLOR[k];
          const list = cardsByStage.get(k) ?? [];
          return (
            <section
              key={k}
              id={`stage-${k}`}
              className="scroll-mt-24 space-y-5"
            >
              <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-3">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: `color-mix(in oklab, ${color} 18%, transparent)`,
                    boxShadow: `0 0 0 1px ${color}, 0 0 20px -4px color-mix(in oklab, ${color} 60%, transparent)`,
                  }}
                  aria-hidden
                >
                  {meta.icon}
                </span>
                <div className="min-w-0">
                  <div
                    className="text-[10px] uppercase tracking-[0.25em] font-semibold"
                    style={{ color }}
                  >
                    Stage · {k === "other" ? "Cross-cutting" : "SDLC"}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {meta.label}
                  </h2>
                </div>
                <div className="ml-auto text-sm text-[color:var(--color-muted)]">
                  <span className="tabular-nums font-semibold text-[color:var(--color-foreground)]">
                    {list.length}
                  </span>{" "}
                  skill{list.length === 1 ? "" : "s"}
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((c) => {
                  cardIndex++;
                  return (
                    <SkillCard
                      key={c.key}
                      n={cardIndex}
                      card={c}
                      color={color}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Legend */}
      <footer className="border-t border-[color:var(--color-border)] pt-6 flex items-center gap-6 flex-wrap text-xs text-[color:var(--color-muted)]">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--color-accent-2)" }}
          />
          Hackathon submission
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--color-accent-3)" }}
          />
          Strategic addition
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--color-danger)" }}
          />
          Marked for immediate implementation
        </span>
        <Link
          href="/admin"
          className="ml-auto text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] underline underline-offset-2"
        >
          ← Back to Admin
        </Link>
      </footer>
    </div>
  );
}

function SkillCard({
  n,
  card,
  color,
}: {
  n: number;
  card: Card;
  color: string;
}) {
  const display = categoryDisplay(card.category, card.categoryOther);
  const flagged = card.needsImmediateImpl;
  const pinned = card.pinned;
  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-[color:var(--color-surface)]/40 p-5 transition hover:bg-[color:var(--color-surface)]/60"
      style={{
        borderColor: flagged
          ? "color-mix(in oklab, var(--color-danger) 55%, var(--color-border))"
          : pinned
          ? `color-mix(in oklab, ${color} 45%, var(--color-border))`
          : "var(--color-border)",
        boxShadow: flagged
          ? `inset 4px 0 0 0 var(--color-danger)`
          : `inset 4px 0 0 0 color-mix(in oklab, ${color} ${pinned ? 80 : 30}%, transparent)`,
      }}
    >
      {/* faint stage wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at 0% 0%, color-mix(in oklab, ${color} 10%, transparent), transparent 70%)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold tabular-nums shrink-0"
            style={{
              background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 65%, var(--color-accent-2)))`,
              color: "var(--color-background)",
            }}
          >
            {n}
          </span>
          <span
            className="text-2xl leading-none"
            aria-hidden
            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.05))" }}
          >
            {display.icon}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {pinned && (
            <span
              className="pill border text-[10px] uppercase tracking-[0.18em]"
              style={{
                borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
                background: `color-mix(in oklab, ${color} 14%, transparent)`,
                color,
              }}
            >
              ★ Strategic
            </span>
          )}
          {flagged && <ImmediateImplBadge />}
        </div>
      </div>

      <div
        className="mt-3 text-[10px] uppercase tracking-[0.2em] font-semibold"
        style={{ color }}
      >
        {display.label} · Skill
      </div>
      <h3 className="mt-1 text-lg font-bold tracking-tight leading-tight">
        {card.title}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-snug line-clamp-3">
        {card.summary}
      </p>

      {card.developers && card.developers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[color:var(--color-border)]/60 flex flex-wrap gap-1">
          {card.developers.slice(0, 4).map((d) => (
            <span
              key={d}
              className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[10px] text-[color:var(--color-muted)]"
              style={{ letterSpacing: "0" }}
            >
              {d}
            </span>
          ))}
          {card.developers.length > 4 && (
            <span className="text-[10px] text-[color:var(--color-muted)] self-center ml-1">
              +{card.developers.length - 4}
            </span>
          )}
        </div>
      )}

      {card.shortId && (
        <div className="mt-3 text-[10px] tabular-nums text-[color:var(--color-muted)]/60 font-mono">
          ID · {card.shortId}
        </div>
      )}
    </div>
  );
}

function BranchMark() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      aria-hidden
      className="shrink-0"
      style={{ filter: "drop-shadow(0 0 18px color-mix(in oklab, var(--color-accent-2) 35%, transparent))" }}
    >
      <circle cx="10" cy="10" r="5" fill="var(--color-accent-2)" />
      <circle cx="10" cy="30" r="5" fill="var(--color-accent-3)" />
      <circle cx="30" cy="20" r="5" fill="var(--color-accent)" />
      <path
        d="M10 15 Q 10 20 30 20 Q 10 20 10 25"
        stroke="var(--color-accent-2)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.65"
      />
    </svg>
  );
}
