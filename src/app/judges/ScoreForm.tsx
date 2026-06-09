"use client";

import { useActionState, useState } from "react";
import {
  CRITERIA,
  SCORE_MIN,
  SCORE_MAX,
  weightedTotal,
  type CriterionKey,
  type CriterionScores,
} from "@/lib/judging";
import { saveScore, clearScore, type ScoreState } from "./actions";

const RANGE = Array.from(
  { length: SCORE_MAX - SCORE_MIN + 1 },
  (_, i) => SCORE_MIN + i,
);

const LABELS = ["Poor", "Below", "Solid", "Strong", "Wow"] as const;

const ICONS: Record<CriterionKey, string> = {
  impact: "🎯",
  demo: "⚡",
  pitch: "🎤",
  adoptability: "🚀",
};

export function ScoreForm({
  token,
  submissionId,
  initial,
}: {
  token: string;
  submissionId: string;
  initial?: Partial<CriterionScores>;
}) {
  const [scores, setScores] = useState<Partial<CriterionScores>>(initial ?? {});
  const [hovered, setHovered] = useState<{ key: CriterionKey; value: number } | null>(null);
  const [saveState, saveAction, saving] = useActionState<ScoreState, FormData>(
    saveScore,
    null,
  );
  const [clearState, clearActionFn, clearing] = useActionState<ScoreState, FormData>(
    clearScore,
    null,
  );

  const ratedCount = CRITERIA.filter((c) => typeof scores[c.key] === "number").length;
  const complete = ratedCount === CRITERIA.length;
  const liveTotal = complete ? weightedTotal(scores) : null;
  const hasAnyScore = ratedCount > 0;

  function set(key: CriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="mt-5 border-t border-[color:var(--color-border)] pt-5">
      <form action={saveAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="submissionId" value={submissionId} />

        <div className="space-y-2.5">
          {CRITERIA.map((c) => {
            const val = scores[c.key];
            const hov = hovered?.key === c.key ? hovered.value : null;
            const displayVal = hov ?? val;
            return (
              <div
                key={c.key}
                className="flex items-center justify-between gap-4 flex-wrap rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/40 px-4 py-3"
              >
                <input type="hidden" name={c.key} value={val ?? ""} />

                {/* left: icon + label + status */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-2xl leading-none shrink-0"
                    aria-hidden
                  >
                    {ICONS[c.key]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">
                      {c.label}
                    </div>
                    <div className="mt-0.5 text-xs text-[color:var(--color-muted)] flex items-center gap-2">
                      <span className="text-[color:var(--color-accent-2)] tabular-nums">
                        {Math.round(c.weight * 100)}%
                      </span>
                      <span aria-hidden>·</span>
                      <span>
                        {displayVal
                          ? `${displayVal}/${SCORE_MAX} — ${LABELS[displayVal - 1]}`
                          : "unrated"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* right: compact 1-5 button row */}
                <div
                  className="flex gap-1 shrink-0"
                  role="radiogroup"
                  aria-label={c.label}
                  onMouseLeave={() => setHovered(null)}
                >
                  {RANGE.map((n) => {
                    const selected = typeof val === "number" && n <= val;
                    const hovFill = hov !== null && n <= hov;
                    const lit = hov !== null ? hovFill : selected;
                    const isCurrent = n === val;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={isCurrent}
                        onClick={() => set(c.key, n)}
                        onMouseEnter={() => setHovered({ key: c.key, value: n })}
                        onFocus={() => setHovered({ key: c.key, value: n })}
                        onBlur={() => setHovered(null)}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-md text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-2)]/60"
                        style={{
                          background: lit
                            ? "linear-gradient(135deg, var(--color-accent-2), var(--color-accent))"
                            : "color-mix(in oklab, var(--color-surface-2) 70%, transparent)",
                          color: lit
                            ? "var(--color-background)"
                            : "var(--color-muted)",
                          borderWidth: lit ? 0 : 1,
                          borderStyle: "solid",
                          borderColor: "var(--color-border)",
                          boxShadow: isCurrent
                            ? "0 0 0 2px color-mix(in oklab, var(--color-accent-2) 35%, transparent)"
                            : "none",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* footer: rated progress, weighted total, save button */}
        <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-[220px] flex-1">
            <div className="flex gap-1">
              {CRITERIA.map((c) => (
                <span
                  key={c.key}
                  className="h-1.5 w-7 rounded-full transition-colors duration-200"
                  style={{
                    background:
                      typeof scores[c.key] === "number"
                        ? "var(--color-accent-2)"
                        : "color-mix(in oklab, white 12%, transparent)",
                  }}
                  aria-hidden
                />
              ))}
            </div>
            <div className="text-xs text-[color:var(--color-muted)]">
              {complete ? "All four rated" : `${ratedCount} of ${CRITERIA.length} rated`}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right leading-none">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Weighted
              </div>
              <div className="mt-1 flex items-baseline gap-1 justify-end">
                <span
                  className={`text-3xl font-bold tabular-nums ${
                    complete
                      ? "gradient-text"
                      : "text-[color:var(--color-muted)]/50"
                  }`}
                >
                  {liveTotal ?? "—"}
                </span>
                <span className="text-xs text-[color:var(--color-muted)]">/ 100</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !complete}
              className="btn btn-primary"
            >
              {saving ? "Saving…" : saveState?.ok ? "Saved ✓" : "Save score"}
            </button>
          </div>
        </div>

        {/* status line */}
        {(saveState || clearState) && (
          <div className="mt-3 text-xs">
            {saveState?.ok && (
              <span className="text-[color:var(--color-success)]">
                Saved — re-save any time to update.
              </span>
            )}
            {saveState && !saveState.ok && (
              <span className="text-[color:var(--color-danger)]">{saveState.error}</span>
            )}
            {clearState?.ok && (
              <span className="text-[color:var(--color-muted)]">Cleared.</span>
            )}
            {clearState && !clearState.ok && (
              <span className="text-[color:var(--color-danger)]">{clearState.error}</span>
            )}
          </div>
        )}
      </form>

      {hasAnyScore && (
        <form
          action={async (fd) => {
            setScores({});
            await clearActionFn(fd);
          }}
          className="mt-3 flex justify-end"
        >
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="submissionId" value={submissionId} />
          <button
            type="submit"
            disabled={clearing}
            className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-danger)] underline underline-offset-2 disabled:opacity-50"
          >
            {clearing ? "Clearing…" : "↺ Clear my scores"}
          </button>
        </form>
      )}
    </div>
  );
}
