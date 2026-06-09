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
      {/* Live score readout */}
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Your weighted score
          </span>
        </div>
        <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-md">
          <div className="flex-1 h-2 rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${liveTotal ?? 0}%`,
                background:
                  "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
              }}
            />
          </div>
          <span
            className={`text-3xl font-bold tabular-nums leading-none ${
              complete
                ? "gradient-text"
                : "text-[color:var(--color-muted)]/50"
            }`}
            style={{ minWidth: "5.5ch", textAlign: "right" }}
          >
            {liveTotal ?? "—"}
          </span>
          <span className="text-xs text-[color:var(--color-muted)]">/ 100</span>
        </div>
      </div>

      <form action={saveAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="submissionId" value={submissionId} />

        <div className="space-y-3">
          {CRITERIA.map((c) => {
            const val = scores[c.key];
            const hov = hovered?.key === c.key ? hovered.value : null;
            const displayVal = hov ?? val ?? 0;
            return (
              <div
                key={c.key}
                className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/40 px-4 py-3"
              >
                <input type="hidden" name={c.key} value={val ?? ""} />
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{c.label}</span>
                    <span className="pill border border-[color:var(--color-accent-2)]/40 bg-[color:var(--color-accent-2)]/10 text-[color:var(--color-accent-2)] text-[10px] tabular-nums shrink-0">
                      {Math.round(c.weight * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {displayVal > 0 && (
                      <span className="text-xs text-[color:var(--color-muted)] uppercase tracking-wider">
                        {LABELS[displayVal - 1]}
                      </span>
                    )}
                    <span
                      className={`text-xl font-bold tabular-nums w-6 text-right ${
                        val
                          ? "text-[color:var(--color-accent-2)]"
                          : "text-[color:var(--color-muted)]/40"
                      }`}
                    >
                      {val ?? "·"}
                    </span>
                  </div>
                </div>

                {/* Progressive segment bar — segments fill in cumulatively */}
                <div
                  className="flex gap-1.5"
                  onMouseLeave={() => setHovered(null)}
                >
                  {RANGE.map((n) => {
                    const selected = typeof val === "number" && n <= val;
                    const hoveredFill = hov !== null && n <= hov;
                    const lit = hov !== null ? hoveredFill : selected;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set(c.key, n)}
                        onMouseEnter={() => setHovered({ key: c.key, value: n })}
                        onFocus={() => setHovered({ key: c.key, value: n })}
                        onBlur={() => setHovered(null)}
                        aria-label={`${c.label}: ${n} of ${SCORE_MAX}`}
                        aria-pressed={selected}
                        className="flex-1 h-9 rounded-md border transition-all duration-150 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-2)]/60"
                        style={{
                          background: lit
                            ? "linear-gradient(135deg, var(--color-accent-2), var(--color-accent))"
                            : "color-mix(in oklab, var(--color-surface-2) 60%, transparent)",
                          borderColor: lit
                            ? "transparent"
                            : "var(--color-border)",
                          boxShadow:
                            n === val
                              ? "0 0 0 2px color-mix(in oklab, var(--color-accent-2) 35%, transparent)"
                              : "none",
                        }}
                      >
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums ${
                            lit
                              ? "text-[color:var(--color-background)]"
                              : "text-[color:var(--color-muted)]"
                          }`}
                        >
                          {n}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-[color:var(--color-muted)]">
            {saveState?.ok
              ? "Saved — re-save any time to update."
              : saveState?.error
              ? <span className="text-[color:var(--color-danger)]">{saveState.error}</span>
              : clearState?.ok
              ? "Cleared."
              : complete
              ? "Ready to save."
              : `${ratedCount} of ${CRITERIA.length} rated — pick all 4 to save.`}
          </div>
          <button
            type="submit"
            disabled={saving || !complete}
            className="btn btn-primary"
          >
            {saving ? "Saving…" : saveState?.ok ? "Saved ✓" : "Save score"}
          </button>
        </div>
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
