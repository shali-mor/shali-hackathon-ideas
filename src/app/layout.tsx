import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { signOutAction } from "@/app/auth/signin/action";
import { BrandMark } from "@/components/Brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Elegant display serif — used sparingly for headline moments (e.g. the
// finalists reveal) via the --font-serif CSS variable.
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Forcepoint Hackathon — submit your idea",
  description:
    "One-day Forcepoint hackathon. Pitch your idea, get accepted, ship it on 2026-06-09.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const admin = isAdmin(session?.user?.email);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-background)]/70 border-b border-[color:var(--color-border)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-semibold tracking-tight text-base">
                <span className="gradient-text">hack</span>
                <span className="text-[color:var(--color-foreground)]">.fp</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-5 text-sm text-[color:var(--color-muted)]">
              <Link href="/rules" className="hover:text-[color:var(--color-foreground)] transition">
                Rules
              </Link>
              <Link href="/present" className="hover:text-[color:var(--color-foreground)] transition">
                Present
              </Link>
              {session && (
                <Link href="/submit" className="hover:text-[color:var(--color-foreground)] transition">
                  Submit
                </Link>
              )}
              {session && (
                <Link href="/my-submissions" className="hover:text-[color:var(--color-foreground)] transition">
                  My ideas
                </Link>
              )}
              <Link href="/ideas" className="hover:text-[color:var(--color-foreground)] transition">
                Browse
              </Link>
              <Link href="/insights" className="hover:text-[color:var(--color-foreground)] transition">
                Insights
              </Link>
              {session && admin && (
                <>
                  <Link
                    href="/admin"
                    className="text-sm text-[color:var(--color-accent)] hover:brightness-110"
                  >
                    ⚡ Admin
                  </Link>
                  <Link
                    href="/judges"
                    className="text-sm text-[color:var(--color-accent-2)] hover:brightness-110"
                  >
                    🏆 Judging
                  </Link>
                  <Link
                    href="/judges/finals"
                    className="text-sm text-[color:var(--color-accent-2)] hover:brightness-110"
                  >
                    🏁 Final
                  </Link>
                  <Link
                    href="/screen"
                    target="_blank"
                    className="text-sm inline-flex items-center gap-1.5 text-[color:var(--color-accent-3)] hover:brightness-110"
                  >
                    <span className="dot-live" />
                    📺 Live
                  </Link>
                </>
              )}
            </nav>

            <div className="ml-auto flex items-center gap-3 text-sm">
              {session?.user ? (
                <form action={signOutAction} className="flex items-center gap-3">
                  <span className="hidden md:inline text-[color:var(--color-muted)] text-xs">
                    {session.user.email}
                  </span>
                  <button
                    className="text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                    type="submit"
                  >
                    sign out
                  </button>
                </form>
              ) : (
                <Link href="/auth/signin" className="btn btn-primary">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">{children}</main>

        <footer className="border-t border-[color:var(--color-border)] py-6 text-center text-xs text-[color:var(--color-muted)]">
          <span className="dot-live mr-2 align-middle" />
          Hackathon · 2026-06-09 · judging 2026-06-11
        </footer>
      </body>
    </html>
  );
}
