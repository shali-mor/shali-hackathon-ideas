import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  submissionsOpen,
  SUBMISSION_DEADLINE,
  formatInTZ,
} from "@/lib/dates";
import { SubmissionForm } from "./SubmissionForm";
import { createSubmission } from "./actions";

export default async function SubmitPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/submit");
  }
  const open = submissionsOpen();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Pitch your idea</h1>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Deadline:{" "}
          <span className="text-[color:var(--color-foreground)]">
            {formatInTZ(SUBMISSION_DEADLINE)}
          </span>{" "}
          (Asia/Jerusalem).
        </p>
      </div>

      {!open ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-[color:var(--color-muted)]">Submissions are closed.</p>
        </div>
      ) : (
        <SubmissionForm
          action={createSubmission}
          submitLabel="Submit idea"
          celebrate
        />
      )}
    </div>
  );
}
