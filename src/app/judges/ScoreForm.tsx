"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
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

// Each criterion gets its own colour theme so the form reads as four
// distinct dials instead of one grey block.
const THEME: Record<
  CriterionKey,
  {
    base: string;
    accent: string;
  }
> = {
  impact: {
    base: "var(--color-warn)",
    accent: "var(--color-accent)",
  },
  demo: {
    base: "var(--color-accent-3)",
    accent: "var(--color-accent-2)",
  },
  pitch: {
    base: "var(--color-accent-2)",
    accent: "var(--color-accent-3)",
  },
  adoptability: {
    base: "var(--color-success)",
    accent: "var(--color-accent-2)",
  },
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
  const partial = weightedTotal(scores); // counts the criteria that ARE rated
  const hasAnyScore = ratedCount > 0;

  function set(key: CriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="mt-5 border-t border-[color:var(--color-border)] pt-5">
      <form action={saveAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="submissionId" value={submissionId} />

        <div className="space-y-3">
          {CRITERIA.map((c) => {
            const val = scores[c.key];
            const hov = hovered?.key === c.key ? hovered.value : null;
            const displayVal = hov ?? val;
            const theme = THEME[c.key];
            const rated = typeof val === "number";

            return (
              <div
                key={c.key}
                className="relative overflow-hidden rounded-xl border transition-all duration-200"
                style={{
                  borderColor: rated
                    ? `color-mix(in oklab, ${theme.base} 55%, var(--color-border))`
                    : "var(--color-border)",
                  background: rated
                    ? `linear-gradient(90deg, color-mix(in oklab, ${theme.base} 8%, transparent), color-mix(in oklab, ${theme.accent} 4%, transparent) 60%, transparent)`
                    : "color-mix(in oklab, var(--color-surface) 50%, transparent)",
                  boxShadow: rated
                    ? `inset 4px 0 0 0 ${theme.base}, 0 0 0 1px color-mix(in oklab, ${theme.base} 18%, transparent)`
                    : `inset 4px 0 0 0 color-mix(in oklab, ${theme.base} 22%, transparent)`,
                }}
              >
                <input type="hidden" name={c.key} value={val ?? ""} />

                <div className="flex items-center justify-between gap-4 flex-wrap pl-5 pr-3 py-3">
                  {/* left: icon disc + label + status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 transition-all duration-200"
                      style={{
                        background: `color-mix(in oklab, ${theme.base} ${
                          rated ? 22 : 10
                        }%, transparent)`,
                        boxShadow: rated
                          ? `0 0 0 1px ${theme.base}, 0 0 14px -2px color-mix(in oklab, ${theme.base} 55%, transparent)`
                          : `0 0 0 1px color-mix(in oklab, ${theme.base} 30%, transparent)`,
                      }}
                      aria-hidden
                    >
                      {ICONS[c.key]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold tracking-tight">
                        {c.label}
                      </div>
                      <div className="mt-0.5 text-xs flex items-center gap-2 leading-none">
                        <span
                          className="tabular-nums font-semibold"
                          style={{ color: theme.base }}
                        >
                          {Math.round(c.weight * 100)}%
                        </span>
                        <span
                          aria-hidden
                          className="text-[color:var(--color-muted)]"
                        >
                          ·
                        </span>
                        <span
                          className={
                            displayVal
                              ? "text-[color:var(--color-foreground)] font-medium"
                              : "text-[color:var(--color-muted)]"
                          }
                        >
                          {displayVal
                            ? `${displayVal}/${SCORE_MAX} — ${LABELS[displayVal - 1]}`
                            : "Not yet rated"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* right: 1-5 button group */}
                  <div
                    className="flex gap-1.5 shrink-0"
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
                        <motion.button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={isCurrent}
                          whileTap={{ scale: 0.92 }}
                          whileHover={{ y: -1 }}
                          onClick={() => set(c.key, n)}
                          onMouseEnter={() =>
                            setHovered({ key: c.key, value: n })
                          }
                          onFocus={() =>
                            setHovered({ key: c.key, value: n })
                          }
                          onBlur={() => setHovered(null)}
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg text-sm font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2"
                          style={{
                            background: lit
                              ? `linear-gradient(135deg, ${theme.base}, ${theme.accent})`
                              : "color-mix(in oklab, var(--color-surface-2) 80%, transparent)",
                            color: lit
                              ? "var(--color-background)"
                              : "var(--color-muted)",
                            borderWidth: lit ? 0 : 1,
                            borderStyle: "solid",
                            borderColor: "var(--color-border)",
                            boxShadow: isCurrent
                              ? `0 0 0 2px color-mix(in oklab, ${theme.base} 45%, transparent), 0 6px 18px -8px color-mix(in oklab, ${theme.base} 70%, transparent)`
                              : lit
                              ? `0 4px 10px -6px color-mix(in oklab, ${theme.base} 60%, transparent)`
                              : "none",
                          }}
                        >
                          {n}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: weighted gauge + save */}
        <ScoreGauge
          ratedCount={ratedCount}
          complete={complete}
          partial={partial}
          liveTotal={liveTotal}
          scores={scores}
        />

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs">
            {saveState?.ok && (
              <span className="text-[color:var(--color-success)]">
                ✓ Saved — re-save any time to update.
              </span>
            )}
            {saveState && !saveState.ok && (
              <span className="text-[color:var(--color-danger)]">
                {saveState.error}
              </span>
            )}
            {!saveState && clearState?.ok && (
              <span className="text-[color:var(--color-muted)]">Cleared.</span>
            )}
            {!saveState && !clearState && !complete && (
              <span className="text-[color:var(--color-muted)]">
                Pick all four to save your score.
              </span>
            )}
            {!saveState && !clearState && complete && (
              <span className="text-[color:var(--color-foreground)]">
                Ready to save.
              </span>
            )}
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

function ScoreGauge({
  ratedCount,
  complete,
  partial,
  liveTotal,
  scores,
}: {
  ratedCount: number;
  complete: boolean;
  partial: number;
  liveTotal: number | null;
  scores: Partial<CriterionScores>;
}) {
  const total = liveTotal ?? partial;
  const R = 42;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - total / 100);

  return (
    <div className="mt-5 relative overflow-hidden rounded-xl border border-[color:var(--color-border)] px-5 py-4 flex items-center gap-5 flex-wrap"
      style={{
        background:
          "linear-gradient(120deg, color-mix(in oklab, var(--color-accent-2) 7%, transparent), color-mix(in oklab, var(--color-accent-3) 5%, transparent) 60%, color-mix(in oklab, var(--color-accent) 4%, transparent))",
      }}
    >
      {/* Circular gauge */}
      <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="judge-gauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-2)" />
              <stop offset="50%" stopColor="var(--color-accent-3)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="color-mix(in oklab, white 8%, transparent)"
            strokeWidth="9"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="url(#judge-gauge)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            className={`tabular-nums font-bold ${
              complete
                ? "gradient-text"
                : "text-[color:var(--color-muted)]/60"
            }`}
            style={{ fontSize: "1.65rem" }}
          >
            {complete ? total : partial > 0 ? Math.round(partial) : "—"}
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-[color:var(--color-muted)] mt-1">
            / 100
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-[180px]">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Your weighted score
        </div>
        <div className="mt-2 flex gap-1.5">
          {CRITERIA.map((c) => {
            const rated = typeof scores[c.key] === "number";
            const theme = THEME[c.key];
            return (
              <span
                key={c.key}
                aria-hidden
                className="flex-1 h-2 rounded-full transition-colors duration-200"
                style={{
                  background: rated
                    ? `linear-gradient(90deg, ${theme.base}, ${theme.accent})`
                    : "color-mix(in oklab, white 8%, transparent)",
                  boxShadow: rated
                    ? `0 0 10px -2px color-mix(in oklab, ${theme.base} 60%, transparent)`
                    : "none",
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 text-xs text-[color:var(--color-muted)]">
          {complete
            ? "All four rated"
            : `${ratedCount} of ${CRITERIA.length} rated`}
        </div>
      </div>
    </div>
  );
}
