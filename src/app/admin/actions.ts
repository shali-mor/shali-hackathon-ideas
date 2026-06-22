"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { sendEmail, reviewEmail } from "@/lib/email";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

async function review(
  id: string,
  status: "accepted" | "rejected",
  reviewNote: string | null,
) {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) {
    throw new Error("Forbidden");
  }

  const [updated] = await db
    .update(submissions)
    .set({
      status,
      reviewNote,
      reviewedAt: new Date(),
      reviewedByEmail: session!.user!.email!,
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, id))
    .returning();

  if (!updated) throw new Error("Not found");

  const submissionUrl = `${appUrl()}/ideas/${updated.id}`;
  const { subject, html, text } = reviewEmail({
    title: updated.title,
    status,
    reviewNote: updated.reviewNote,
    appUrl: appUrl(),
    submissionUrl,
  });
  await sendEmail({ to: updated.submittedByEmail, subject, html, text });

  revalidatePath("/admin");
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/my-submissions");
}

export async function acceptSubmission(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim() || null;
  await review(id, "accepted", note);
}

export async function rejectSubmission(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim() || null;
  await review(id, "rejected", note);
}

export async function reopenSubmission(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");

  await db
    .update(submissions)
    .set({
      status: "pending",
      reviewNote: null,
      reviewedAt: null,
      reviewedByEmail: null,
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, id));

  revalidatePath("/admin");
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/my-submissions");
}

export async function toggleImmediateImpl(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) return;

  await db
    .update(submissions)
    .set({ needsImmediateImpl: next, updatedAt: new Date() })
    .where(eq(submissions.id, id));

  revalidatePath("/admin");
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/judges");
  revalidatePath("/my-submissions");
}

export async function togglePickedForQuarter(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) return;

  await db
    .update(submissions)
    .set({ pickedForQuarter: next, updatedAt: new Date() })
    .where(eq(submissions.id, id));

  revalidatePath("/roadmap");
  revalidatePath("/admin");
}

export async function adminDeleteSubmission(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!isAdmin(session?.user?.email)) throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(submissions).where(eq(submissions.id, id));

  revalidatePath("/admin");
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/my-submissions");
}
