"use client";

import { useEffect, useState } from "react";

type Props = {
  target: string; // ISO date string
  label?: string;
};

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s, expired: ms === 0 };
}

export function Countdown({ target, label = "Submissions close in" }: Props) {
  const t = new Date(target);
  const [now, setNow] = useState(() => diff(t));

  useEffect(() => {
    const id = setInterval(() => setNow(diff(t)), 1000);
    return () => clearInterval(id);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (now.expired) {
    return (
      <div className="pill bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]">
        submissions closed
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[color:var(--color-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <Cell n={now.d} u="d" />
        <Cell n={now.h} u="h" />
        <Cell n={now.m} u="m" />
        <Cell n={now.s} u="s" pulse />
      </div>
    </div>
  );
}

function Cell({ n, u, pulse }: { n: number; u: string; pulse?: boolean }) {
  return (
    <div
      className={`rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 px-2 py-1 tabular-nums text-sm flex items-baseline gap-1 ${pulse ? "glow-ring" : ""}`}
    >
      <span className="text-[color:var(--color-foreground)] font-semibold">
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-[color:var(--color-muted)] uppercase">{u}</span>
    </div>
  );
}
