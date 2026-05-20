import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    redirect(params.callbackUrl ?? "/");
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Use your <strong>@forcepoint.com</strong> email. We&apos;ll send you a
        magic link.
      </p>

      {params.error && (
        <p className="mt-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
          {params.error === "AccessDenied"
            ? "That email isn't allowed. Only @forcepoint.com addresses can sign in."
            : "Sign-in failed. Try again."}
        </p>
      )}

      <form
        className="mt-6 space-y-3"
        action={async (formData: FormData) => {
          "use server";
          const email = String(formData.get("email") ?? "").trim();
          await signIn("resend", {
            email,
            redirectTo: params.callbackUrl ?? "/",
          });
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@forcepoint.com"
            className="mt-1 block w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white py-2 text-sm font-medium"
        >
          Send magic link
        </button>
      </form>
    </div>
  );
}
