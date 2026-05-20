import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, submissions } from "@/lib/db";
import { submissionsOpen } from "@/lib/dates";
import { SubmissionForm } from "@/app/submit/SubmissionForm";
import { updateSubmission, deleteSubmission } from "@/app/submit/actions";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const idea = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });
  if (!idea) notFound();
  if (idea.submittedByEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    redirect("/my-submissions");
  }
  if (!submissionsOpen()) {
    redirect(`/ideas/${id}`);
  }

  const boundUpdate = updateSubmission.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Edit submission</h1>
      <p className="mt-2 text-xs text-neutral-500">
        Any edit will reset your status to <strong>pending</strong> for re-review.
      </p>

      <div className="mt-6">
        <SubmissionForm
          action={boundUpdate}
          defaultValues={{
            title: idea.title,
            description: idea.description,
            motivation: idea.motivation,
            developers: idea.developers,
            teamContact: idea.teamContact,
          }}
          submitLabel="Save changes"
        />
      </div>

      <form
        action={async () => {
          "use server";
          await deleteSubmission(id);
        }}
        className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6"
      >
        <button
          type="submit"
          className="text-sm text-rose-700 dark:text-rose-300 hover:underline"
        >
          Delete this submission
        </button>
      </form>
    </div>
  );
}
