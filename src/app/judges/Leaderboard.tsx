import {
  CRITERIA,
  aggregateScores,
  weightedTotal,
  type ScoreRow,
} from "@/lib/judging";

// Raw per-(judge, submission) score row — the shape shared by both the
// semi-final (judge_scores) and final (final_scores) tables.
export type RawScore = {
  submissionId: string;
  judgeEmail: string;
  judgeName: string | null;
  impact: number;
  demo: number;
  pitch: number;
  adoptability: number;
};

// Presentational leaderboard, used by both judging rounds. The caller fetches
// the raw rows from whichever table the round uses and the idea titles; this
// component aggregates, ranks, and renders.
export function Leaderboard({
  scores,
  titleById,
  intro,
  emptyHint,
}: {
  scores: RawScore[];
  titleById: Map<string, string>;
  intro?: string;
  emptyHint?: string;
}) {
  const rows: ScoreRow[] = scores.map((s) => ({
    submissionId: s.submissionId,
    impact: s.impact,
    demo: s.demo,
    pitch: s.pitch,
    adoptability: s.adoptability,
  }));
  const ranked = aggregateScores(rows);

  // Group raw rows by submission so we can show the per-judge breakdown.
  const byIdea = new Map<string, RawScore[]>();
  for (const s of scores) {
    const list = byIdea.get(s.submissionId) ?? [];
    list.push(s);
    byIdea.set(s.submissionId, list);
  }

  if (ranked.length === 0) {
    return (
      <div className="card text-center py-16 text-[color:var(--color-muted)]">
        {emptyHint ??
          "No scores submitted yet. The leaderboard fills in as judges score ideas."}
      </div>
    );
  }

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[color:var(--color-muted)]">
        {intro ??
          "Combined across all judges — weighted by the rubric, highest first. Expand a card to see what each judge submitted."}
      </p>
      <ol className="space-y-4">
        {ranked.map((a, i) => {
          const rank = i + 1;
          const podium = rank <= 3;
          const judgeRows = byIdea.get(a.submissionId) ?? [];
          const title = titleById.get(a.submissionId) ?? "(unknown idea)";
          return (
            <li
              key={a.submissionId}
              className={`card relative overflow-hidden ${
                rank === 1 ? "glow-ring" : ""
              }`}
            >
              {/* gradient wash for the podium */}
              {podium && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{
                    background:
                      "radial-gradient(circle at 0% 50%, color-mix(in oklab, var(--color-accent-2) 14%, transparent), transparent 60%)",
                  }}
                />
              )}

              <div className="flex items-start gap-5">
                {/* rank badge */}
                <div className="shrink-0 text-center w-14">
                  {podium ? (
                    <div className="text-4xl leading-none">{MEDALS[i]}</div>
                  ) : (
                    <div className="text-3xl font-bold tabular-nums text-[color:var(--color-muted)] leading-none">
                      {rank}
                    </div>
                  )}
                </div>

                {/* main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                      {title}
                    </h2>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-bold tabular-nums gradient-text leading-none">
                          {a.total}
                        </span>
                        <span className="text-xs text-[color:var(--color-muted)]">
                          / 100
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                        {a.judges} judge{a.judges === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  {/* weighted progress bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${a.total}%`,
                        background:
                          "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
                      }}
                    />
                  </div>

                  {/* per-criterion averages */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CRITERIA.map((c) => {
                      const v = a.averages[c.key];
                      return (
                        <div
                          key={c.key}
                          className="rounded-md bg-[color:var(--color-surface-2)]/40 border border-[color:var(--color-border)] px-3 py-2"
                        >
                          <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] truncate">
                            {c.label}
                          </div>
                          <div className="mt-0.5 flex items-baseline gap-1">
                            <span className="text-lg font-semibold tabular-nums">
                              {v.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-[color:var(--color-muted)]">
                              / 5
                            </span>
                          </div>
                          <div className="mt-1 h-[3px] rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(v / 5) * 100}%`,
                                background:
                                  "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* per-judge breakdown — collapsed by default */}
                  <details className="mt-4 group">
                    <summary className="cursor-pointer list-none flex items-center gap-2 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition">
                      <span className="inline-block transition group-open:rotate-90">▸</span>
                      <span>By judge ({judgeRows.length})</span>
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                            <th className="text-left font-normal pb-2 pr-3">Judge</th>
                            {CRITERIA.map((c) => (
                              <th
                                key={c.key}
                                className="text-center font-normal pb-2 px-2 hidden sm:table-cell"
                                title={c.label}
                              >
                                {c.label.split(" ")[0]}
                              </th>
                            ))}
                            <th className="text-right font-normal pb-2 pl-3">Weighted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--color-border)]">
                          {judgeRows
                            .map((r) => ({
                              ...r,
                              weighted: weightedTotal({
                                impact: r.impact,
                                demo: r.demo,
                                pitch: r.pitch,
                                adoptability: r.adoptability,
                              }),
                            }))
                            .sort((x, y) => y.weighted - x.weighted)
                            .map((r) => (
                              <tr key={r.judgeEmail}>
                                <td className="py-2 pr-3 truncate">
                                  {r.judgeName ?? r.judgeEmail}
                                </td>
                                {CRITERIA.map((c) => (
                                  <td
                                    key={c.key}
                                    className="text-center tabular-nums py-2 px-2 hidden sm:table-cell"
                                  >
                                    {r[c.key]}
                                  </td>
                                ))}
                                <td className="text-right py-2 pl-3">
                                  <span className="font-semibold tabular-nums text-[color:var(--color-accent-2)]">
                                    {r.weighted}
                                  </span>
                                  <span className="text-[10px] text-[color:var(--color-muted)] ml-1">
                                    / 100
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
