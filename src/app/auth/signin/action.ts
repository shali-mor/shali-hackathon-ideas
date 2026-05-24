"use server";

import { redirect } from "next/navigation";
import { createSession, clearSession } from "@/lib/session";
import { isAllowedEmail } from "@/lib/admin";

function safeCallback(raw: unknown): string {
  const v = typeof raw === "string" ? raw : "/";
  // only allow same-origin paths
  if (!v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

export async function signInAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const callbackUrl = safeCallback(formData.get("callbackUrl"));

  if (name.length < 2 || name.length > 80) {
    redirect(
      `/auth/signin?error=BadName&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }
  if (!isAllowedEmail(email)) {
    redirect(
      `/auth/signin?error=AccessDenied&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }

  await createSession({ email, name });
  redirect(callbackUrl);
}

export async function signOutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
