import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { auth } from "@/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdmin } from "@/lib/admin";
import { submissionsOpen } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
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
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        This idea isn&apos;t public yet.{" "}
        <Link href="/ideas" className="underline">
          Back to ideas
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{idea.title}</h1>
        <StatusBadge status={idea.status} />
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Submitted by {idea.submittedByName ?? idea.submittedByEmail}
      </p>

      <section className="mt-6 space-y-1">
        <h2 className="text-sm font-medium text-neutral-500">Idea</h2>
        <p className="whitespace-pre-wrap text-sm">{idea.description}</p>
      </section>

      <section className="mt-6 space-y-1">
        <h2 className="text-sm font-medium text-neutral-500">Motivation</h2>
        <p className="whitespace-pre-wrap text-sm">{idea.motivation}</p>
      </section>

      <section className="mt-6 space-y-1">
        <h2 className="text-sm font-medium text-neutral-500">Developers</h2>
        <ul className="text-sm list-disc list-inside">
          {idea.developers.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-1">
        <h2 className="text-sm font-medium text-neutral-500">Team contact</h2>
        <p className="text-sm">{idea.teamContact}</p>
      </section>

      {idea.reviewNote && (
        <section className="mt-6 rounded-md bg-neutral-100 dark:bg-neutral-800 p-3">
          <h2 className="text-sm font-medium">Reviewer note</h2>
          <p className="text-sm mt-1 whitespace-pre-wrap">{idea.reviewNote}</p>
        </section>
      )}

      {isOwner && submissionsOpen() && (
        <div className="mt-8">
          <Link
            href={`/my-submissions/${idea.id}/edit`}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm"
          >
            Edit
          </Link>
        </div>
      )}
    </article>
  );
}
