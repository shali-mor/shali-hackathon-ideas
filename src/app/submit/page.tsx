import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { submissionsOpen, SUBMISSION_DEADLINE, formatInTZ } from "@/lib/dates";
import { SubmissionForm } from "./SubmissionForm";
import { createSubmission } from "./actions";

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/submit");
  }
  const open = submissionsOpen();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Submit an idea</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Deadline: <strong>{formatInTZ(SUBMISSION_DEADLINE)}</strong> (Asia/Jerusalem).
        After admin review you&apos;ll get an email with the decision.
      </p>

      {!open ? (
        <div className="mt-6 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200">
          Submissions are closed.
        </div>
      ) : (
        <div className="mt-6">
          <SubmissionForm action={createSubmission} submitLabel="Submit idea" />
        </div>
      )}
    </div>
  );
}
