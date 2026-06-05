// Judging rubric — the single source of truth for criteria, weights, and the
// scoring maths. Shared by the public /rules page, the judges scoring form,
// and the leaderboard. Pure TS (no server-only deps) so it's client-safe.

export type CriterionKey = "impact" | "demo" | "pitch" | "adoptability";

export type Criterion = {
  key: CriterionKey;
  label: string;
  weight: number; // 0..1, the four weights sum to 1
  blurb: string;
};

export const CRITERIA: Criterion[] = [
  {
    key: "impact",
    label: "Impact & value",
    weight: 0.35,
    blurb:
      "Size of the pain removed × how many roles benefit. Bonus for measurable time/cost savings and value that compounds.",
  },
  {
    key: "demo",
    label: "Working demo",
    weight: 0.3,
    blurb:
      "A live, working result by end of day — not slideware. How much actually runs.",
  },
  {
    key: "pitch",
    label: "Pitch & presentation",
    weight: 0.2,
    blurb:
      "How well the team sells it: clear problem framing, a compelling story, a sharp wow moment, and confident Q&A.",
  },
  {
    key: "adoptability",
    label: "Adoptability",
    weight: 0.15,
    blurb:
      "Realistic to build in a day and something the whole org can use tomorrow with low upkeep.",
  },
];

export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

export const CRITERION_KEYS = CRITERIA.map((c) => c.key);

export type CriterionScores = Record<CriterionKey, number>;

/** Weighted total on a 0–100 scale from per-criterion 1–5 scores. */
export function weightedTotal(scores: Partial<CriterionScores>): number {
  let sum = 0;
  for (const c of CRITERIA) {
    const v = scores[c.key];
    if (typeof v === "number" && !Number.isNaN(v)) sum += v * c.weight;
  }
  // weights sum to 1, scores are 1–5 → sum is 1–5 → ×20 → 20–100.
  return Math.round(sum * 20 * 10) / 10;
}

export type ScoreRow = {
  submissionId: string;
} & CriterionScores;

export type Aggregate = {
  submissionId: string;
  judges: number;
  averages: CriterionScores;
  total: number; // weighted total of the averages, 0–100
};

/** Combine every judge's scores into one aggregate per submission. */
export function aggregateScores(rows: ScoreRow[]): Aggregate[] {
  const groups = new Map<string, ScoreRow[]>();
  for (const r of rows) {
    const list = groups.get(r.submissionId) ?? [];
    list.push(r);
    groups.set(r.submissionId, list);
  }

  const out: Aggregate[] = [];
  for (const [submissionId, list] of groups) {
    const averages = {} as CriterionScores;
    for (const c of CRITERIA) {
      const sum = list.reduce((acc, r) => acc + r[c.key], 0);
      averages[c.key] = Math.round((sum / list.length) * 10) / 10;
    }
    out.push({
      submissionId,
      judges: list.length,
      averages,
      total: weightedTotal(averages),
    });
  }

  // Highest combined score first.
  out.sort((a, b) => b.total - a.total);
  return out;
}
