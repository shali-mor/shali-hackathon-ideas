import { desc, or, eq, and, ne } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import type { Submission } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { BrandMark } from "@/components/Brand";
import { PrintButton } from "@/components/PrintButton";
import { categoryDisplay } from "@/lib/insights";

export const dynamic = "force-dynamic";

const HACKATHON_DATE = "2026-06-09";
const JUDGING_DATE = "2026-06-11";

function categoryTag(key: string, other?: string | null): string {
  const c = categoryDisplay(key, other);
  return `${c.icon} ${c.label}`;
}

function statusLabel(status: string): string {
  if (status === "accepted") return "✓ Accepted";
  if (status === "rejected") return "✕ Rejected";
  return "● Pending";
}

export default async function ExportPage() {
  const session = await getSession();
  const admin = isAdmin(session?.user?.email);

  const rows: Submission[] = admin
    ? await db.select().from(submissions).orderBy(desc(submissions.createdAt))
    : await db
        .select()
        .from(submissions)
        .where(
          or(
            eq(submissions.status, "accepted"),
            and(
              eq(submissions.teamNeeded, true),
              ne(submissions.status, "rejected"),
            ),
          ),
        )
        .orderBy(desc(submissions.createdAt));

  const generatedOn = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date());

  return (
    <div className="export-root mx-auto max-w-3xl">
      {/* On-screen (dark theme) preview styling. The @media print block in
          globals.css overrides all of this for an ink-friendly PDF. */}
      <style>{`
        .export-doc { display: block; }
        .export-cover {
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 1.25rem;
          margin-bottom: 1.75rem;
        }
        .export-cover-brand { display: flex; align-items: center; gap: 0.875rem; }
        .export-title {
          font-size: 1.875rem; font-weight: 800; letter-spacing: -0.02em;
          margin: 0; line-height: 1.1;
          background: linear-gradient(120deg, var(--color-accent), var(--color-accent-2) 55%, var(--color-accent-3));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .export-subtitle { font-size: 0.875rem; color: var(--color-muted); margin: 0.25rem 0 0; }
        .export-meta {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem; margin-top: 1.25rem;
        }
        .export-meta dt {
          font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--color-muted); margin: 0;
        }
        .export-meta dd {
          font-size: 0.8125rem; font-weight: 600; margin: 0.25rem 0 0;
          color: var(--color-foreground);
        }
        .export-list { display: flex; flex-direction: column; gap: 1rem; }
        .export-card {
          border: 1px solid var(--color-border); border-radius: 0.625rem;
          padding: 1.25rem 1.375rem;
          background: color-mix(in oklab, var(--color-surface) 75%, transparent);
        }
        .export-card-head { display: flex; align-items: baseline; gap: 0.625rem; margin-bottom: 0.5rem; }
        .export-index {
          font-size: 0.875rem; font-weight: 700; color: var(--color-accent);
          font-variant-numeric: tabular-nums;
        }
        .export-card-title { font-size: 1.125rem; font-weight: 700; margin: 0; line-height: 1.25; }
        .export-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.75rem; }
        .export-tag {
          font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem;
          border-radius: 999px; border: 1px solid var(--color-border);
          color: var(--color-muted);
        }
        .export-tag-cat {
          border-color: color-mix(in oklab, var(--color-accent) 40%, var(--color-border));
          color: var(--color-accent);
        }
        .export-tag-team {
          border-color: color-mix(in oklab, var(--color-accent-2) 40%, var(--color-border));
          color: var(--color-accent-2);
        }
        .export-section { margin-bottom: 0.625rem; }
        .export-section h3 {
          font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--color-muted); margin: 0 0 0.1875rem; font-weight: 700;
        }
        .export-section p {
          font-size: 0.875rem; line-height: 1.5; margin: 0;
          color: color-mix(in oklab, var(--color-foreground) 90%, transparent);
          white-space: pre-wrap;
        }
        .export-devs { display: flex; flex-wrap: wrap; gap: 0.3125rem; }
        .export-dev {
          font-size: 0.75rem; padding: 0.0625rem 0.5rem; border-radius: 999px;
          border: 1px solid var(--color-border);
          background: color-mix(in oklab, var(--color-surface-2) 70%, transparent);
          color: var(--color-muted);
        }
        .export-card-foot {
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;
          margin-top: 0.75rem; padding-top: 0.625rem;
          border-top: 1px solid var(--color-border);
          font-size: 0.75rem; color: var(--color-muted);
        }
        .export-footer {
          margin-top: 1.5rem; padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
          text-align: center; font-size: 0.6875rem; color: var(--color-muted);
        }
        .export-empty { color: var(--color-muted); }
      `}</style>

      {/* Screen-only action bar — hidden in print */}
      <div className="no-print mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-[color:var(--color-muted)]">
          {admin
            ? "Admin export — every submission is included."
            : "Public export — accepted ideas and open team-needed ideas."}{" "}
          Use your browser&rsquo;s &ldquo;Save as PDF&rdquo; destination for a
          clean document.
        </p>
        <PrintButton />
      </div>

      {/* The printable document */}
      <article className="export-doc">
        <header className="export-cover">
          <div className="export-cover-brand">
            <BrandMark size={44} />
            <div>
              <h1 className="export-title">Forcepoint Hackathon</h1>
              <p className="export-subtitle">Ideas &amp; Submissions</p>
            </div>
          </div>

          <dl className="export-meta">
            <div>
              <dt>Hackathon</dt>
              <dd>{HACKATHON_DATE}</dd>
            </div>
            <div>
              <dt>Judging</dt>
              <dd>{JUDGING_DATE}</dd>
            </div>
            <div>
              <dt>Ideas</dt>
              <dd>{rows.length}</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{generatedOn} UTC</dd>
            </div>
          </dl>
        </header>

        {rows.length === 0 ? (
          <p className="export-empty">No ideas to export yet.</p>
        ) : (
          <div className="export-list">
            {rows.map((s, i) => {
              const category = s.category ?? "other";
              return (
                <section key={s.id} className="export-card">
                  <div className="export-card-head">
                    <span className="export-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="export-card-title">{s.title}</h2>
                  </div>

                  <div className="export-tags">
                    <span className="export-tag export-tag-cat">
                      {categoryTag(category, s.categoryOther)}
                    </span>
                    <span className="export-tag">{statusLabel(s.status)}</span>
                    {s.teamNeeded && (
                      <span className="export-tag export-tag-team">
                        ＋ Team needed
                      </span>
                    )}
                  </div>

                  <div className="export-section">
                    <h3>Motivation</h3>
                    <p>{s.motivation}</p>
                  </div>

                  <div className="export-section">
                    <h3>Description</h3>
                    <p>{s.description}</p>
                  </div>

                  {s.developers.length > 0 && (
                    <div className="export-section">
                      <h3>Developers</h3>
                      <div className="export-devs">
                        {s.developers.map((d) => (
                          <span key={d} className="export-dev">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <footer className="export-card-foot">
                    <span>
                      Submitted by{" "}
                      <strong>{s.submittedByName ?? s.submittedByEmail}</strong>
                    </span>
                    <span>Contact: {s.teamContact}</span>
                  </footer>
                </section>
              );
            })}
          </div>
        )}

        <footer className="export-footer">
          Forcepoint Hackathon · {HACKATHON_DATE} · {rows.length} idea
          {rows.length === 1 ? "" : "s"}
        </footer>
      </article>
    </div>
  );
}
