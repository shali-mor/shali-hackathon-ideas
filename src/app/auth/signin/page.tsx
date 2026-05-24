import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { signInAction } from "./action";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  if (session?.user) {
    redirect(params.callbackUrl ?? "/");
  }

  const error =
    params.error === "AccessDenied"
      ? "Only @forcepoint.com emails are allowed."
      : params.error === "BadName"
      ? "Enter your name (2–80 chars)."
      : null;

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-4xl font-bold tracking-tight">
        Let&apos;s <span className="gradient-text">hack</span>.
      </h1>
      <p className="mt-3 text-sm text-[color:var(--color-muted)]">
        Enter your name and{" "}
        <span className="text-[color:var(--color-foreground)]">
          @forcepoint.com
        </span>{" "}
        email. No password — we trust you.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3.5 py-2.5 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      )}

      <form action={signInAction} className="mt-8 space-y-3">
        <input
          type="hidden"
          name="callbackUrl"
          value={params.callbackUrl ?? "/"}
        />
        <label className="block">
          <span className="text-sm font-medium">Your name</span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            placeholder="Shali Mor"
            className="input mt-1.5"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Forcepoint email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@forcepoint.com"
            pattern=".*@forcepoint\.com$"
            className="input mt-1.5"
            autoComplete="email"
          />
        </label>
        <button type="submit" className="btn btn-primary w-full">
          Sign in →
        </button>
      </form>
    </div>
  );
}
