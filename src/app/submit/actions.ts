"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, gte, count } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions } from "@/lib/db";
import { parseSubmissionForm } from "@/lib/submissions";
import { submissionsOpenFor } from "@/lib/dates";
import { isAllowedEmail } from "@/lib/admin";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5; // max submissions per window per email

export type ActionState =
  | { ok: false; error: string }
  | { ok: true; id: string }
  | null;

export async function createSubmission(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session?.user?.email || !isAllowedEmail(session.user.email)) {
    return { ok: false, error: "You must sign in with a Forcepoint email." };
  }
  if (!submissionsOpenFor(session.user.email)) {
    return { ok: false, error: "Submissions are closed." };
  }

  // Per-email rate limit: max N submissions in the last window
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const [{ recent } = { recent: 0 }] = await db
    .select({ recent: count() })
    .from(submissions)
    .where(
      and(
        eq(submissions.submittedByEmail, session.user.email),
        gte(submissions.createdAt, windowStart),
      ),
    );
  if (recent >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      error: `You've submitted ${recent} ideas in the last 10 minutes. Slow down — try again shortly.`,
    };
  }

  let input;
  try {
    input = parseSubmissionForm(formData);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    return { ok: false, error: msg };
  }

  const [row] = await db
    .insert(submissions)
    .values({
      title: input.title,
      description: input.description,
      motivation: input.motivation,
      category: input.category,
      categoryOther: input.category === "other" ? input.categoryOther : null,
      developers: input.developers,
      teamNeeded: input.teamNeeded,
      teamContact: input.teamContact,
      submittedByEmail: session.user.email,
      submittedByName: session.user.name,
    })
    .returning({ id: submissions.id });

  revalidatePath("/ideas");
  revalidatePath("/my-submissions");
  revalidatePath("/admin");
  return { ok: true, id: row.id };
}

export async function updateSubmission(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session?.user?.email) {
    return { ok: false, error: "Not signed in." };
  }
  if (!submissionsOpenFor(session.user.email)) {
    return { ok: false, error: "Submissions are closed; edits are locked." };
  }

  const existing = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });
  if (!existing) return { ok: false, error: "Not found." };
  if (existing.submittedByEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    return { ok: false, error: "You can only edit your own submission." };
  }

  let input;
  try {
    input = parseSubmissionForm(formData);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    return { ok: false, error: msg };
  }

  await db
    .update(submissions)
    .set({
      title: input.title,
      description: input.description,
      motivation: input.motivation,
      category: input.category,
      categoryOther: input.category === "other" ? input.categoryOther : null,
      developers: input.developers,
      teamNeeded: input.teamNeeded,
      teamContact: input.teamContact,
      // any edit reverts review state
      status: "pending",
      reviewNote: null,
      reviewedAt: null,
      reviewedByEmail: null,
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, id));

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/my-submissions");
  revalidatePath("/admin");
  redirect(`/ideas/${id}`);
}

export async function joinTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session?.user?.email || !isAllowedEmail(session.user.email)) {
    return { ok: false, error: "Sign in with a Forcepoint email to join." };
  }
  if (!submissionsOpenFor(session.user.email)) {
    return { ok: false, error: "Submissions are closed." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing idea id." };

  const idea = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });
  if (!idea) return { ok: false, error: "Idea not found." };
  if (!idea.teamNeeded) {
    return { ok: false, error: "This idea isn't looking for more devs." };
  }
  if (idea.developers.length >= 3) {
    return { ok: false, error: "Team is full." };
  }

  const me = (session.user.name?.trim() || session.user.email).slice(0, 80);
  if (idea.developers.some((d) => d.toLowerCase() === me.toLowerCase())) {
    return { ok: false, error: "You're already on this team." };
  }

  const nextDevs = [...idea.developers, me];
  const teamFull = nextDevs.length >= 3;

  await db
    .update(submissions)
    .set({
      developers: nextDevs,
      teamNeeded: !teamFull,
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, id));

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/my-submissions");
  revalidatePath("/admin");
  return { ok: true, id };
}

export async function deleteSubmission(id: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Not signed in.");
  if (!submissionsOpenFor(session.user.email)) {
    throw new Error("Submissions are closed; deletes are locked.");
  }

  await db
    .delete(submissions)
    .where(
      and(
        eq(submissions.id, id),
        eq(submissions.submittedByEmail, session.user.email),
      ),
    );

  revalidatePath("/ideas");
  revalidatePath("/my-submissions");
  revalidatePath("/admin");
  redirect("/my-submissions");
}
