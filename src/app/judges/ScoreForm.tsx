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
import { saveScore, type ScoreState } from "./actions";

const RANGE = Array.from(
  { length: SCORE_MAX - SCORE_MIN + 1 },
  (_, i) => SCORE_MIN + i,
);

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
  const [state, formAction, pending] = useActionState<ScoreState, FormData>(
    saveScore,
    null,
  );

  const complete = CRITERIA.every((c) => typeof scores[c.key] === "number");
  const subtotal = complete ? weightedTotal(scores) : null;

  function set(key: CriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }

  return (
    <form action={formAction} className="mt-5 border-t border-[color:var(--color-border)] pt-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="space-y-3">
        {CRITERIA.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {c.label}
                <span className="ml-2 text-xs text-[color:var(--color-muted)]">
                  {Math.round(c.weight * 100)}%
                </span>
              </div>
            </div>
            <input type="hidden" name={c.key} value={scores[c.key] ?? ""} />
            <div className="flex gap-1 shrink-0" role="radiogroup" aria-label={c.label}>
              {RANGE.map((n) => {
                const active = scores[c.key] === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set(c.key, n)}
                    className={`h-9 w-9 rounded-md border text-sm font-semibold transition ${
                      active
                        ? "border-[color:var(--color-accent-2)] bg-[color:var(--color-accent-2)] text-[color:var(--color-background)]"
                        : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent-2)]/60 hover:text-[color:var(--color-foreground)]"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-sm">
          {subtotal !== null ? (
            <>
              <span className="text-[color:var(--color-muted)]">Your score:</span>{" "}
              <span className="font-semibold text-[color:var(--color-accent-2)] tabular-nums">
                {subtotal} / 100
              </span>
            </>
          ) : (
            <span className="text-xs text-[color:var(--color-muted)]">
              Rate all four to compute a score.
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={pending || !complete}
          className="btn btn-primary"
        >
          {pending ? "Saving…" : state?.ok ? "Saved ✓" : "Save score"}
        </button>
      </div>

      {state && !state.ok && (
        <p className="mt-2 text-sm text-[color:var(--color-danger)]">{state.error}</p>
      )}
      {state?.ok && (
        <p className="mt-2 text-xs text-[color:var(--color-success)]">
          Saved — re-save any time to update.
        </p>
      )}
    </form>
  );
}
