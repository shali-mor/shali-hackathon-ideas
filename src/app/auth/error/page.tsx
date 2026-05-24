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
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-3xl font-bold tracking-tight">Sign-in error</h1>
      <p className="mt-3 text-sm text-[color:var(--color-danger)]">{msg}</p>
      <Link href="/auth/signin" className="btn btn-ghost mt-8">
        ← Try again
      </Link>
    </div>
  );
}
