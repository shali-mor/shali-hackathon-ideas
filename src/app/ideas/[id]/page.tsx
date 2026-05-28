import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { getSession } from "@/lib/session";
import { StatusBadge, TeamNeededBadge } from "@/components/StatusBadge";
import { isAdmin } from "@/lib/admin";
import { submissionsOpen } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const admin = isAdmin(session?.user?.email);

  const idea = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });
  if (!idea) notFound();

  const isOwner =
    session?.user?.email?.toLowerCase() === idea.submittedByEmail.toLowerCase();
  const canView = admin || isOwner || idea.status === "accepted";

  if (!canView) {
    return (
      <div className="card text-center py-16">
        <p className="text-[color:var(--color-muted)]">
          This idea isn&apos;t public yet.
        </p>
        <Link href="/ideas" className="btn btn-ghost mt-4">
          ← Back to ideas
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={idea.status} />
          {idea.teamNeeded && <TeamNeededBadge />}
          <span className="text-xs text-[color:var(--color-muted)]">
            submitted by {idea.submittedByName ?? idea.submittedByEmail}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          {idea.title}
        </h1>
      </header>

      <Section title="Idea">
        <p className="whitespace-pre-wrap leading-relaxed">{idea.description}</p>
      </Section>

      <Section title="Motivation">
        <p className="whitespace-pre-wrap leading-relaxed">{idea.motivation}</p>
      </Section>

      <Section title="Developers">
        <div className="flex flex-wrap gap-2 items-center">
          {idea.developers.map((d) => (
            <span
              key={d}
              className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[color:var(--color-foreground)]"
            >
              {d}
            </span>
          ))}
          {idea.developers.length === 0 && (
            <span className="text-sm text-[color:var(--color-muted)] italic">
              No developers yet.
            </span>
          )}
        </div>
        {idea.teamNeeded && (
          <p className="mt-3 text-sm text-[color:var(--color-muted)]">
            This idea is <span className="text-[color:var(--color-accent-2)]">open
            for developers to join</span>. Reach out to the submitter via the
            contact below.
          </p>
        )}
      </Section>

      <Section title={idea.teamNeeded ? "Submitter / contact" : "Team contact"}>
        <p className="text-sm">{idea.teamContact}</p>
      </Section>

      {idea.reviewNote && (
        <div className="card">
          <div className="text-xs text-[color:var(--color-muted)] mb-2">Reviewer note</div>
          <p className="text-sm whitespace-pre-wrap">{idea.reviewNote}</p>
        </div>
      )}

      {isOwner && submissionsOpen() && (
        <div className="pt-4 border-t border-[color:var(--color-border)]">
          <Link href={`/my-submissions/${idea.id}/edit`} className="btn btn-ghost">
            Edit submission
          </Link>
        </div>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs text-[color:var(--color-muted)]">{title}</h2>
      <div className="text-[color:var(--color-foreground)]">{children}</div>
    </section>
  );
}
