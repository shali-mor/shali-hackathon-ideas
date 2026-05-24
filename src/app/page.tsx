import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db, submissions } from "@/lib/db";
import { SUBMISSION_DEADLINE, submissionsOpen } from "@/lib/dates";
import { Countdown } from "@/components/Countdown";
import { HeroClient } from "@/components/HeroClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  const open = submissionsOpen();

  const [{ accepted } = { accepted: 0 }] = await db
    .select({ accepted: count() })
    .from(submissions)
    .where(eq(submissions.status, "accepted"))
    .catch(() => [{ accepted: 0 }]);

  return (
    <HeroClient>
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="dot-live" />
          <span className="text-xs text-[color:var(--color-muted)]">
            Live · 2026-06-01
          </span>
        </div>

        <h1 className="text-6xl sm:text-8xl font-bold leading-[0.95] tracking-tight">
          Pitch.{" "}
          <span className="gradient-text">Build.</span>{" "}
          Ship.
        </h1>

        <p className="mt-6 text-lg text-[color:var(--color-muted)] max-w-xl">
          One day. One idea. One demo.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {open ? (
            <Link
              href={session ? "/submit" : "/auth/signin?callbackUrl=/submit"}
              className="btn btn-primary text-base px-6 py-3"
            >
              Submit an idea →
            </Link>
          ) : (
            <span className="btn btn-ghost text-[color:var(--color-muted)]">
              Submissions closed
            </span>
          )}
          <Link href="/ideas" className="btn btn-ghost px-5 py-3">
            See ideas {accepted > 0 && <span className="ml-1 text-[color:var(--color-accent)]">({accepted})</span>}
          </Link>
        </div>

        <div className="mt-12">
          <Countdown target={SUBMISSION_DEADLINE.toISOString()} />
        </div>
      </div>
    </HeroClient>
  );
}
