import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions } from "@/lib/db";
import { submissionsOpenFor } from "@/lib/dates";
import { SubmissionForm } from "@/app/submit/SubmissionForm";
import { updateSubmission, deleteSubmission } from "@/app/submit/actions";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.email) redirect("/auth/signin");

  const idea = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });
  if (!idea) notFound();
  if (idea.submittedByEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    redirect("/my-submissions");
  }
  if (!submissionsOpenFor(session.user.email)) {
    redirect(`/ideas/${id}`);
  }

  const boundUpdate = updateSubmission.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Tune the pitch</h1>
        <p className="mt-2 text-xs text-[color:var(--color-muted)]">
          Edits reset status to{" "}
          <span className="text-[color:var(--color-warn)]">pending</span> for re-review.
        </p>
      </div>

      <SubmissionForm
        action={boundUpdate}
        submitter={idea.submittedByName ?? idea.submittedByEmail}
        defaultValues={{
          title: idea.title,
          description: idea.description,
          motivation: idea.motivation,
          category: idea.category,
          categoryOther: idea.categoryOther ?? "",
          developers: idea.developers,
          teamNeeded: idea.teamNeeded,
          teamContact: idea.teamContact,
        }}
        submitLabel="Save changes"
      />

      <form
        action={async () => {
          "use server";
          await deleteSubmission(id);
        }}
        className="mt-12 border-t border-[color:var(--color-border)] pt-6"
      >
        <button
          type="submit"
          className="text-sm text-[color:var(--color-danger)] hover:underline"
        >
          Delete this submission
        </button>
      </form>
    </div>
  );
}
