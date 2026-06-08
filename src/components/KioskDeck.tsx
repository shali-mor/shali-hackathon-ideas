"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CRITERIA } from "@/lib/judging";

type Bucket = { label: string; icon: string; count: number };

type Props = {
  participants: number;
  ideas: number;
  accepted: number;
  buckets: Bucket[];
};

type Judge = {
  name: string;
  initials: string;
  title?: string;
  company?: string;
  photo?: string;
};

const JUDGES: Judge[] = [
  {
    name: "Eyal Fingold",
    initials: "EF",
    title: "Co-Founder & CTO",
    company: "Native",
    photo: "/judge-photos/eyal-fingold.png",
  },
  {
    name: "Tal Shapiro",
    initials: "TS",
    title: "Director of Engineering",
    company: "FundGuard",
    photo: "/judge-photos/tal-shapiro.png",
  },
  {
    name: "Roy Fintuch",
    initials: "RF",
    title: "Advisor & Investor",
    company: "Ex Founder & CTO · Dome9 ($200M exit)",
    photo: "/judge-photos/roy-fintuch.png",
  },
];

const ADVANCE_MS = 12_000; // seconds per slide
const RELOAD_MS = 5 * 60_000; // refresh live numbers every 5 minutes

export function KioskDeck({ participants, ideas, accepted, buckets }: Props) {
  const slides: { key: string; node: ReactNode }[] = [
    { key: "welcome", node: <Welcome /> },
    {
      key: "numbers",
      node: <Numbers participants={participants} ideas={ideas} accepted={accepted} />,
    },
    ...(buckets.length > 0
      ? [{ key: "sdlc", node: <Sdlc buckets={buckets} /> }]
      : []),
    { key: "judges", node: <Judges /> },
    { key: "criteria", node: <Criteria /> },
  ];

  const [i, setI] = useState(0);
  const [clock, setClock] = useState("");

  // Auto-advance through the slides forever.
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % slides.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  // Periodically reload so the live numbers stay current through the day.
  useEffect(() => {
    const id = setInterval(() => window.location.reload(), RELOAD_MS);
    return () => clearInterval(id);
  }, []);

  // Live clock (HH:MM).
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  // Presenter controls: arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => (n + 1) % slides.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[color:var(--color-background)]">
      {/* ambient gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 10%, color-mix(in oklab, var(--color-accent-2) 16%, transparent), transparent 70%), radial-gradient(55% 45% at 85% 5%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 72%), radial-gradient(70% 60% at 50% 110%, color-mix(in oklab, var(--color-accent-3) 10%, transparent), transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-10 py-6 text-sm text-[color:var(--color-muted)]">
        <span className="flex items-center gap-2.5">
          <span className="dot-live" />
          <span className="font-semibold tracking-tight">
            <span className="gradient-text">hack</span>.fp
          </span>
        </span>
        <span className="tabular-nums">{clock}</span>
      </div>

      {/* slide */}
      <div className="absolute inset-0 flex items-center justify-center px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[i].key}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-6xl"
          >
            {slides[i].node}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress dots */}
      <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-2.5">
        {slides.map((s, n) => (
          <span
            key={s.key}
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: n === i ? "2.5rem" : "0.5rem",
              background:
                n === i
                  ? "var(--color-accent-2)"
                  : "color-mix(in oklab, white 18%, transparent)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <div className="text-center">
      <p className="text-lg sm:text-2xl text-[color:var(--color-muted)] tracking-[0.3em] uppercase">
        Forcepoint
      </p>
      <h1
        className="mt-4 font-bold tracking-tight leading-[0.95] gradient-text"
        style={{ fontSize: "clamp(3rem, 12vw, 11rem)" }}
      >
        Hackathon
      </h1>
      <p className="mt-8 text-[color:var(--color-muted)]" style={{ fontSize: "clamp(1.2rem,3vw,2.2rem)" }}>
        Build. Ship. Pitch. · June 9, 2026
      </p>
    </div>
  );
}

function Numbers({
  participants,
  ideas,
  accepted,
}: {
  participants: number;
  ideas: number;
  accepted: number;
}) {
  return (
    <div className="text-center">
      <h2 className="text-[color:var(--color-muted)] uppercase tracking-[0.25em]" style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}>
        By the numbers
      </h2>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <Stat value={participants} label="Participants" color="var(--color-accent)" />
        <Stat value={ideas} label="Ideas" color="var(--color-accent-2)" />
        <Stat value={accepted} label="Accepted" color="var(--color-success)" />
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <div
        className="font-bold tabular-nums leading-none"
        style={{ fontSize: "clamp(4rem, 14vw, 12rem)", color }}
      >
        {value}
      </div>
      <div className="mt-4 text-[color:var(--color-muted)]" style={{ fontSize: "clamp(1rem,2.5vw,1.8rem)" }}>
        {label}
      </div>
    </div>
  );
}

function Sdlc({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div>
      <h2 className="text-center text-[color:var(--color-muted)] uppercase tracking-[0.25em]" style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}>
        Ideas by SDLC stage
      </h2>
      <div className="mt-10 space-y-4">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-5">
            <div className="w-72 shrink-0 flex items-center gap-3" style={{ fontSize: "clamp(1rem,2vw,1.6rem)" }}>
              <span>{b.icon}</span>
              <span className="truncate">{b.label}</span>
            </div>
            <div className="flex-1 h-6 rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(b.count / max) * 100}%`,
                  background: "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
                }}
              />
            </div>
            <div className="w-12 text-right tabular-nums font-semibold" style={{ fontSize: "clamp(1.2rem,2.5vw,2rem)" }}>
              {b.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Judges() {
  return (
    <div className="text-center">
      <h2 className="text-[color:var(--color-muted)] uppercase tracking-[0.25em]" style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}>
        Meet the judges
      </h2>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {JUDGES.map((j) => {
          const dim = "clamp(6rem,14vw,11rem)";
          return (
            <div key={j.name} className="flex flex-col items-center">
              {j.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={j.photo}
                  alt={j.name}
                  className="rounded-full object-cover glow-ring"
                  style={{ width: dim, height: dim }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center font-bold text-[color:var(--color-background)] glow-ring"
                  style={{
                    width: dim,
                    height: dim,
                    fontSize: "clamp(2rem,5vw,4rem)",
                    background:
                      "linear-gradient(135deg, var(--color-accent), var(--color-accent-2) 60%, var(--color-accent-3))",
                  }}
                >
                  {j.initials}
                </div>
              )}
              <div className="mt-5 font-semibold" style={{ fontSize: "clamp(1.3rem,3vw,2.2rem)" }}>
                {j.name}
              </div>
              {j.title ? (
                <>
                  <div style={{ fontSize: "clamp(1rem,1.9vw,1.5rem)" }}>{j.title}</div>
                  <div
                    className="mt-0.5 gradient-text font-semibold"
                    style={{ fontSize: "clamp(0.95rem,1.7vw,1.35rem)" }}
                  >
                    {j.company}
                  </div>
                </>
              ) : (
                <div
                  className="mt-1 text-[color:var(--color-muted)]"
                  style={{ fontSize: "clamp(0.9rem,1.6vw,1.2rem)" }}
                >
                  External judge
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Criteria() {
  return (
    <div>
      <h2 className="text-center text-[color:var(--color-muted)] uppercase tracking-[0.25em]" style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}>
        How it&apos;s judged
      </h2>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CRITERIA.map((c) => (
          <div key={c.key} className="card flex items-baseline gap-4">
            <span className="font-bold tabular-nums gradient-text" style={{ fontSize: "clamp(1.6rem,4vw,3rem)" }}>
              {Math.round(c.weight * 100)}%
            </span>
            <span className="font-semibold" style={{ fontSize: "clamp(1.1rem,2.2vw,1.8rem)" }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-[color:var(--color-muted)]" style={{ fontSize: "clamp(1rem,2vw,1.5rem)" }}>
        Demos &amp; judging — Thursday, June 11
      </p>
    </div>
  );
}
