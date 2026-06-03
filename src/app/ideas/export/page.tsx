import type { CSSProperties } from "react";
import { desc, or, eq, and, ne } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import type { Submission } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { BrandMark } from "@/components/Brand";
import { PrintButton } from "@/components/PrintButton";
import { categoryDisplay, categoryColor } from "@/lib/insights";

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

function statusClass(status: string): string {
  if (status === "accepted") return "export-tag-accepted";
  if (status === "rejected") return "export-tag-rejected";
  return "export-tag-pending";
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
      {/* Self-contained, colourful styling that works on screen AND in the PDF.
          The @media print block in globals.css only hides chrome, sets page
          margins, and forces colour printing (print-color-adjust: exact). */}
      <style>{`
        .export-doc {
          background: #ffffff; color: #1e2330;
          border-radius: 16px; overflow: hidden;
          border: 1px solid #e7e7ef;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-hero {
          background: linear-gradient(125deg, #4f46e5 0%, #7c3aed 45%, #d946ef 100%);
          color: #fff; padding: 2.1rem 2rem 1.9rem; position: relative;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-hero::after {
          content: ""; position: absolute; inset: 0;
          background: radial-gradient(120% 80% at 90% -10%, rgba(255,255,255,.28), transparent 55%);
          pointer-events: none;
        }
        .export-hero-brand { display: flex; align-items: center; gap: .8rem; position: relative; }
        .export-hero-chip {
          width: 46px; height: 46px; border-radius: 12px;
          background: rgba(255,255,255,.16); display: flex; align-items: center; justify-content: center;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-eyebrow {
          font-size: .66rem; text-transform: uppercase; letter-spacing: .16em;
          font-weight: 700; color: rgba(255,255,255,.82); margin: 0;
        }
        .export-title {
          font-size: 2.1rem; font-weight: 800; letter-spacing: -.025em;
          margin: .55rem 0 0; line-height: 1.02; color: #fff;
        }
        .export-subtitle { font-size: .92rem; margin: .4rem 0 0; color: rgba(255,255,255,.88); }
        .export-meta {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem;
          padding: 1.1rem 2rem 1.3rem; background: #faf9ff;
          border-bottom: 1px solid #ececf4;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-meta dt {
          font-size: .58rem; text-transform: uppercase; letter-spacing: .09em;
          color: #8b8b9e; margin: 0; font-weight: 700;
        }
        .export-meta dd { font-size: .85rem; font-weight: 700; margin: .22rem 0 0; color: #4338ca; }
        .export-list { display: flex; flex-direction: column; gap: 1rem; padding: 1.4rem 2rem 1.8rem; }
        .export-card {
          position: relative; background: #fff;
          border: 1px solid #e7e7ef; border-left: 5px solid var(--stage);
          border-radius: 12px; padding: 1.1rem 1.3rem 1.05rem;
          box-shadow: 0 1px 3px rgba(16,16,40,.05);
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-card-head { display: flex; align-items: center; gap: .7rem; margin-bottom: .6rem; }
        .export-index {
          flex: none; width: 1.95rem; height: 1.95rem; border-radius: 999px;
          background: var(--stage); color: #fff; font-size: .78rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          font-variant-numeric: tabular-nums;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-card-title { font-size: 1.16rem; font-weight: 800; margin: 0; line-height: 1.2; color: #1e2330; }
        .export-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .85rem; }
        .export-tag {
          font-size: .67rem; font-weight: 700; padding: .2rem .62rem; border-radius: 999px;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-tag-cat { background: var(--stage); color: #fff; }
        .export-tag-accepted { background: #dcfce7; color: #15803d; }
        .export-tag-pending { background: #fef3c7; color: #b45309; }
        .export-tag-rejected { background: #ffe4e6; color: #be123c; }
        .export-tag-team { background: #ede9fe; color: #6d28d9; }
        .export-section { margin-bottom: .6rem; }
        .export-section h3 {
          font-size: .61rem; text-transform: uppercase; letter-spacing: .08em;
          color: var(--stage); margin: 0 0 .2rem; font-weight: 800;
        }
        .export-section p { font-size: .86rem; line-height: 1.55; margin: 0; color: #33384a; white-space: pre-wrap; }
        .export-devs { display: flex; flex-wrap: wrap; gap: .35rem; }
        .export-dev {
          font-size: .74rem; padding: .1rem .55rem; border-radius: 999px;
          background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb;
          print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .export-card-foot {
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem;
          margin-top: .85rem; padding-top: .6rem; border-top: 1px dashed #e5e7eb;
          font-size: .74rem; color: #6b7280;
        }
        .export-card-foot strong { color: #1e2330; }
        .export-footer {
          text-align: center; font-size: .7rem; color: #9aa0ad;
          padding: 1rem 2rem 1.5rem; border-top: 1px solid #ececf4;
        }
        .export-empty { color: #9aa0ad; padding: 2.5rem 2rem; text-align: center; }
      `}</style>

      {/* Screen-only action bar — hidden in print */}
      <div className="no-print mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-[color:var(--color-muted)]">
          {admin
            ? "Admin export — every submission is included."
            : "Public export — accepted ideas and open team-needed ideas."}{" "}
          Use your browser&rsquo;s &ldquo;Save as PDF&rdquo; destination, and keep
          &ldquo;Background graphics&rdquo; on for the colours.
        </p>
        <PrintButton />
      </div>

      {/* The printable document */}
      <article className="export-doc">
        <div className="export-hero">
          <div className="export-hero-brand">
            <span className="export-hero-chip">
              <BrandMark size={30} />
            </span>
            <div>
              <p className="export-eyebrow">Forcepoint Hackathon · {HACKATHON_DATE}</p>
              <h1 className="export-title">Ideas &amp; Submissions</h1>
              <p className="export-subtitle">
                Built around the software development lifecycle.
              </p>
            </div>
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

        {rows.length === 0 ? (
          <p className="export-empty">No ideas to export yet.</p>
        ) : (
          <div className="export-list">
            {rows.map((s, i) => {
              const category = s.category ?? "other";
              const stageStyle = { "--stage": categoryColor(category) } as CSSProperties;
              return (
                <section key={s.id} className="export-card" style={stageStyle}>
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
                    <span className={`export-tag ${statusClass(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
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
