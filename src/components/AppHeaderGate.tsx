"use client";

import { usePathname } from "next/navigation";

/**
 * Returns null on routes that want to render standalone chrome (no
 * hack.fp header). Wrap the global header in this so the root layout
 * stays a server component but specific routes can opt out.
 *
 * Today: /roadmap (and any sub-routes) render as a separate site.
 */
const STANDALONE_PREFIXES = ["/roadmap"];

export function AppHeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isStandalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isStandalone) return null;
  return <>{children}</>;
}
