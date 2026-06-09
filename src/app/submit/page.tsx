import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  submissionsOpen,
  submissionsOpenFor,
  lateSubmitterGraceFor,
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
  const open = submissionsOpenFor(session.user.email);
  const grace =
    !submissionsOpen() && open ? lateSubmitterGraceFor(session.user.email) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Pitch your idea</h1>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Deadline:{" "}
          <span className="text-[color:var(--color-foreground)]">
            {formatInTZ(SUBMISSION_DEADLINE)}
          </span>{" "}
          (Asia/Jerusalem).{" "}
          <Link href="/rules" className="underline hover:text-[color:var(--color-foreground)]">
            Read the rules first
          </Link>{" "}
          — teams of up to 3, SDLC ideas only.
        </p>
      </div>

      {!open ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-[color:var(--color-muted)]">Submissions are closed.</p>
        </div>
      ) : (
        <>
          {grace && (
            <div className="mb-6 card border-[color:var(--color-warn)]/40 bg-[color:var(--color-warn)]/10">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none" aria-hidden>⏳</span>
                <div className="text-sm">
                  <div className="font-semibold text-[color:var(--color-warn)]">
                    Late-submission grace window
                  </div>
                  <p className="mt-1 text-[color:var(--color-muted)]">
                    The public deadline has passed, but you have a one-time
                    extension until{" "}
                    <span className="text-[color:var(--color-foreground)]">
                      {formatInTZ(grace)}
                    </span>{" "}
                    (Asia/Jerusalem). Submit your remaining idea before then.
                  </p>
                </div>
              </div>
            </div>
          )}
          <SubmissionForm
            action={createSubmission}
            submitter={session.user.name ?? session.user.email ?? undefined}
            submitLabel="Submit idea"
            celebrate
          />
        </>
      )}
    </div>
  );
}
