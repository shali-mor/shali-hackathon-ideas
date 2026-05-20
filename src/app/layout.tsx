import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/auth";
import { isAdmin } from "@/lib/admin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forcepoint Hackathon Ideas",
  description: "Submit and browse hackathon ideas for 2026-06-01",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const admin = isAdmin(session?.user?.email);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              Hackathon Ideas
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/ideas" className="hover:underline">
                Browse
              </Link>
              {session ? (
                <>
                  <Link href="/submit" className="hover:underline">
                    Submit
                  </Link>
                  <Link href="/my-submissions" className="hover:underline">
                    My submissions
                  </Link>
                  {admin && (
                    <Link href="/admin" className="hover:underline text-amber-600">
                      Admin
                    </Link>
                  )}
                </>
              ) : null}
            </nav>
            <div className="ml-auto text-sm">
              {session?.user ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="text-neutral-500">{session.user.email}</span>
                  <button
                    className="text-neutral-700 dark:text-neutral-300 hover:underline"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <Link
                  href="/auth/signin"
                  className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500">
          Hackathon · 2026-06-01 · judging 2026-06-02
        </footer>
      </body>
    </html>
  );
}
