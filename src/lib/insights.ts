import { toZonedTime } from "date-fns-tz";
import { TZ } from "@/lib/dates";
import type { Submission } from "@/lib/db/schema";

// --- SDLC stage bucketing ------------------------------------------------
// The whole hackathon is about improving the software development lifecycle,
// so categories map to the six classic SDLC stages. Submitters pick a stage;
// anything that doesn't fit goes to "other" with a free-text label.
//
// For legacy/uncategorised rows we derive a best-guess stage from the idea's
// text using keyword scoring: each idea lands in exactly one bucket (highest
// keyword score wins; ties break by the order below). Tune keywords here.

export type CategoryKey =
  | "planning"
  | "design"
  | "development"
  | "testing"
  | "deployment"
  | "maintenance"
  | "other";

type CategoryDef = {
  key: CategoryKey;
  label: string;
  icon: string;
  keywords: string[];
};

// Order = SDLC sequence, and the tie-breaker when two stages score equally.
const CATEGORIES: CategoryDef[] = [
  {
    key: "planning",
    label: "Planning & Requirements",
    icon: "📋",
    keywords: ["plan", "requirement", "backlog", "roadmap", "estimat", "scoping", "scope", "user story", "grooming", "prioriti", "spec", "discovery"],
  },
  {
    key: "design",
    label: "Design & Architecture",
    icon: "🎨",
    keywords: ["design", "architect", "diagram", "ux", "ui", "mockup", "wireframe", "prototype", "blueprint", "schema", "api design", "data model"],
  },
  {
    key: "development",
    label: "Development",
    icon: "💻",
    keywords: ["develop", "code", "coding", "implement", "refactor", "feature", "programming", "sdk", "library", "boilerplate", "scaffold", "copilot", "autocomplete", "generate code"],
  },
  {
    key: "testing",
    label: "Testing & QA",
    icon: "🧪",
    keywords: ["test", "qa", "coverage", "e2e", "unit", "regression", "mock", "assertion", "quality", "bug", "defect", "flaky"],
  },
  {
    key: "deployment",
    label: "Deployment & Release",
    icon: "🚀",
    keywords: ["deploy", "release", "ci/cd", "cicd", "pipeline", "rollout", "jenkins", "terraform", "provision", "package", "ship", "build pipeline", "artifact"],
  },
  {
    key: "maintenance",
    label: "Maintenance & Operations",
    icon: "🛠️",
    keywords: ["monitor", "incident", "ops", "operation", "maintenance", "on-call", "observability", "alert", "log", "support", "upgrade", "patch", "security", "performance", "latency", "ticket", "triage"],
  },
];

const OTHER: Omit<CategoryDef, "keywords"> = {
  key: "other",
  label: "Other",
  icon: "✍️",
};

// UI-facing metadata for every category (label + icon), including "other".
// Used by the submission form and anywhere a category is displayed.
export const CATEGORY_META: Record<CategoryKey, { label: string; icon: string }> =
  Object.fromEntries(
    [...CATEGORIES, OTHER].map((c) => [c.key, { label: c.label, icon: c.icon }]),
  ) as Record<CategoryKey, { label: string; icon: string }>;

// Stable display order for selects/legends.
export const CATEGORY_ORDER: CategoryKey[] = [
  ...CATEGORIES.map((c) => c.key),
  OTHER.key,
];

export function categoryLabel(key: string): string {
  return CATEGORY_META[key as CategoryKey]?.label ?? CATEGORY_META.other.label;
}

export function categoryIcon(key: string): string {
  return CATEGORY_META[key as CategoryKey]?.icon ?? CATEGORY_META.other.icon;
}

// A distinct accent colour per SDLC stage, for charts, badges, and the PDF.
export const CATEGORY_COLOR: Record<CategoryKey, string> = {
  planning: "#6366f1", // indigo
  design: "#d946ef", // fuchsia
  development: "#3b82f6", // blue
  testing: "#10b981", // emerald
  deployment: "#f59e0b", // amber
  maintenance: "#06b6d4", // cyan
  other: "#64748b", // slate
};

export function categoryColor(key: string): string {
  return CATEGORY_COLOR[key as CategoryKey] ?? CATEGORY_COLOR.other;
}

// Resolves what to show for a submission's category, honouring the free-text
// label when the stage is "other".
export function categoryDisplay(
  key: string,
  other?: string | null,
): { icon: string; label: string } {
  if (key === "other" && other && other.trim()) {
    return { icon: CATEGORY_META.other.icon, label: other.trim() };
  }
  return { icon: categoryIcon(key), label: categoryLabel(key) };
}

export function categorize(s: Pick<Submission, "title" | "description" | "motivation">): CategoryKey {
  const haystack = `${s.title} ${s.description} ${s.motivation}`.toLowerCase();
  let best: { key: CategoryKey; score: number } = { key: "other", score: 0 };
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      // Count non-overlapping occurrences of each keyword.
      let from = 0;
      let idx: number;
      while ((idx = haystack.indexOf(kw, from)) !== -1) {
        score++;
        from = idx + kw.length;
      }
    }
    if (score > best.score) best = { key: cat.key, score };
  }
  return best.key;
}

export type CategoryBucket = {
  key: CategoryKey;
  label: string;
  icon: string;
  count: number;
};

export function bucketByCategory(rows: Submission[]): CategoryBucket[] {
  const counts = new Map<CategoryKey, number>();
  for (const r of rows) {
    // Use the stored category; fall back to a derived guess for any legacy
    // row that somehow lacks one.
    const key = (r.category as CategoryKey) ?? categorize(r);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const defs = [...CATEGORIES, OTHER];
  return defs
    .map((d) => ({ key: d.key, label: d.label, icon: d.icon, count: counts.get(d.key) ?? 0 }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);
}

// --- Submission trend ----------------------------------------------------
// Group submissions by calendar day (in the hackathon timezone) so the trend
// reflects when people actually hit submit, not UTC midnight boundaries.

export type TrendPoint = { day: string; label: string; count: number };

function dayKey(date: Date): string {
  const z = toZonedTime(date, TZ);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, "0");
  const d = String(z.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function submissionTrend(rows: Submission[]): TrendPoint[] {
  if (rows.length === 0) return [];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = dayKey(r.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const keys = [...counts.keys()].sort();
  // Fill the gaps between the first and last submission day so a quiet day
  // shows as an empty bar rather than vanishing from the trend.
  const out: TrendPoint[] = [];
  const cursor = new Date(`${keys[0]}T00:00:00Z`);
  const end = new Date(`${keys[keys.length - 1]}T00:00:00Z`);
  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    const k = `${y}-${m}-${d}`;
    out.push({
      day: k,
      label: `${m}-${d}`,
      count: counts.get(k) ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

// --- Headline KPIs -------------------------------------------------------

export type SubmissionStats = {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
  needTeam: number; // ideas flagged "team needed" — looking for owners/builders
  participants: number; // distinct people actually building (listed as developers)
};

export function computeStats(rows: Submission[]): SubmissionStats {
  const stats: SubmissionStats = {
    total: rows.length,
    accepted: 0,
    pending: 0,
    rejected: 0,
    needTeam: 0,
    participants: 0,
  };
  // People in the developers array are the actual builders. A submitter who
  // only proposed an idea (e.g. a "team needed" idea they're not joining) is
  // not listed there, so they're correctly excluded. Dedupe case-insensitively.
  const builders = new Set<string>();
  for (const r of rows) {
    if (r.status === "accepted") stats.accepted++;
    else if (r.status === "pending") stats.pending++;
    else if (r.status === "rejected") stats.rejected++;
    if (r.teamNeeded) {
      stats.needTeam++;
    }
    for (const dev of r.developers) {
      const name = dev.trim().toLowerCase();
      if (name) builders.add(name);
    }
  }
  stats.participants = builders.size;
  return stats;
}
