import Link from "next/link";
import { auth } from "@/auth";
import { SUBMISSION_DEADLINE, submissionsOpen, formatInTZ } from "@/lib/dates";

export default async function Home() {
  const session = await auth();
  const open = submissionsOpen();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Forcepoint Hackathon — submit your idea
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400 max-w-2xl">
          One-day hackathon on <strong>2026-06-01</strong>. External judges
          review accepted ideas the day after. Submit your idea below, get it
          accepted by the deadline, and you&apos;re in.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <Card title="Submit by" value={formatInTZ(SUBMISSION_DEADLINE)} hint="Asia/Jerusalem" />
        <Card title="Hackathon" value="2026-06-01" hint="One day" />
        <Card title="Judging" value="2026-06-02" hint="External judges" />
      </section>

      <section className="flex flex-wrap gap-3">
        {open ? (
          <Link
            href={session ? "/submit" : "/auth/signin?callbackUrl=/submit"}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            Submit an idea
          </Link>
        ) : (
          <span className="rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-4 py-2 text-sm">
            Submissions closed
          </span>
        )}
        <Link
          href="/ideas"
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium"
        >
          Browse accepted ideas
        </Link>
      </section>

      <section className="text-sm">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="list-decimal list-inside space-y-1 text-neutral-700 dark:text-neutral-300 mt-2">
          <li>Sign in with your @forcepoint.com email (magic link).</li>
          <li>Submit your idea — title, description, motivation, developers.</li>
          <li>Edit freely until the submission deadline.</li>
          <li>Admin reviews and accepts/rejects. You&apos;ll get an email.</li>
          <li>Build it on 2026-06-01. Judges review the next day.</li>
        </ol>
      </section>
    </div>
  );
}

function Card({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{title}</div>
      <div className="mt-1 font-medium">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{hint}</div>
    </div>
  );
}
