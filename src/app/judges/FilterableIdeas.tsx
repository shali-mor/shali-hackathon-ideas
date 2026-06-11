"use client";

import { useMemo, useState } from "react";
import type { CriterionScores } from "@/lib/judging";
import { ScoreForm } from "./ScoreForm";

export type IdeaForJudging = {
  id: string;
  title: string;
  description: string;
  motivation: string;
  developers: string[];
  initial?: Partial<CriterionScores>;
  scored: boolean;
};

export function FilterableIdeas({
  token,
  ideas,
  round = "semi",
}: {
  token: string;
  ideas: IdeaForJudging[];
  round?: "semi" | "final";
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unscored" | "scored">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ideas
      .map((s, originalIndex) => ({ s, originalIndex }))
      .filter(({ s }) => {
        if (filter === "unscored" && s.scored) return false;
        if (filter === "scored" && !s.scored) return false;
        if (!needle) return true;
        const hay = [
          s.title,
          s.description,
          s.motivation,
          s.developers.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
  }, [q, filter, ideas]);

  const scoredCount = ideas.filter((s) => s.scored).length;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-[color:var(--color-background)]/85 backdrop-blur-md border-b border-[color:var(--color-border)]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <span
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] pointer-events-none"
            >
              🔍
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, idea, motivation, developer…"
              className="input pl-10 pr-9 w-full"
              autoComplete="off"
              spellCheck={false}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <FilterPill
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All"
              count={ideas.length}
            />
            <FilterPill
              active={filter === "unscored"}
              onClick={() => setFilter("unscored")}
              label="Unscored"
              count={ideas.length - scoredCount}
            />
            <FilterPill
              active={filter === "scored"}
              onClick={() => setFilter("scored")}
              label="Scored"
              count={scoredCount}
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-[color:var(--color-muted)]">
          Showing <span className="tabular-nums">{filtered.length}</span> of{" "}
          <span className="tabular-nums">{ideas.length}</span> ideas ·{" "}
          <span className="tabular-nums">{scoredCount}</span> scored so far
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 mt-5 text-[color:var(--color-muted)]">
          No ideas match{q ? <> &ldquo;{q}&rdquo;</> : ""}.
        </div>
      ) : (
        <ol className="space-y-4 mt-5">
          {filtered.map(({ s, originalIndex }) => (
            <li key={s.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-xs text-[color:var(--color-muted)] tabular-nums">
                      #{String(originalIndex + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {s.title}
                    </h2>
                    {s.scored && (
                      <span className="pill border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] text-[10px] uppercase tracking-wider">
                        ✓ scored
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-[color:var(--color-muted)] leading-snug">
                    {summarize(s.description)}
                  </p>
                </div>
                {s.developers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 shrink-0 max-w-full justify-end">
                    {s.developers.map((d) => (
                      <span
                        key={d}
                        className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[color:var(--color-foreground)] text-xs"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <details className="mt-3 group">
                <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition">
                  <span className="inline-block transition group-open:rotate-90">▸</span>
                  <span className="group-open:hidden">Show full pitch</span>
                  <span className="hidden group-open:inline">Hide full pitch</span>
                </summary>
                <div className="mt-3 space-y-3 text-sm leading-relaxed">
                  <section>
                    <h3 className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                      Idea
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap">{s.description}</p>
                  </section>
                  <section>
                    <h3 className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                      Motivation
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap">{s.motivation}</p>
                  </section>
                </div>
              </details>

              <details className="mt-2 group/score">
                <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition">
                  <span className="inline-block transition group-open/score:rotate-90">▸</span>
                  {s.scored ? (
                    <>
                      <span className="group-open/score:hidden">Edit your scores</span>
                      <span className="hidden group-open/score:inline">Hide scoring</span>
                    </>
                  ) : (
                    <>
                      <span className="group-open/score:hidden">Score this idea</span>
                      <span className="hidden group-open/score:inline">Hide scoring</span>
                    </>
                  )}
                </summary>
                <ScoreForm
                  token={token}
                  submissionId={s.id}
                  initial={s.initial}
                  round={round}
                />
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Pull a short, scannable preview out of a multi-paragraph idea.
// Skip short header-only lines (e.g. "Overview", "Problem Statement"),
// take the first sentence of the first real paragraph, cap at 180 chars.
function summarize(text: string): string {
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
  return out.length > 180 ? out.slice(0, 177) + "…" : out;
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`pill border text-sm transition ${
        active
          ? "border-[color:var(--color-accent-2)] bg-[color:var(--color-accent-2)]/15 text-[color:var(--color-foreground)]"
          : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-accent-2)]/50"
      }`}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
    </button>
  );
}
