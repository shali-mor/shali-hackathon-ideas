import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const msg =
    error === "AccessDenied"
      ? "That email isn't allowed. Only @forcepoint.com addresses can sign in."
      : "Sign-in failed. Please try again.";
  return (
    <div className="max-w-md mx-auto mt-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sign-in error</h1>
      <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{msg}</p>
      <Link
        href="/auth/signin"
        className="mt-6 inline-block rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm"
      >
        Try again
      </Link>
    </div>
  );
}
