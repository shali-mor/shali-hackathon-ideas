"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CRITERIA } from "@/lib/judging";

type Bucket = { label: string; icon: string; count: number };

type Judge = {
  name: string;
  initials: string;
  title?: string;
  company?: string;
  photo?: string;
};

type Props = {
  participants: number;
  ideas: number;
  accepted: number;
  buckets: Bucket[];
  titles: string[];
  judgingTs: number;
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

export function KioskDeck({
  participants,
  ideas,
  accepted,
  buckets,
  titles,
  judgingTs,
}: Props) {
  const slides: { key: string; node: ReactNode }[] = [
    { key: "welcome", node: <Welcome judgingTs={judgingTs} /> },
    {
      key: "numbers",
      node: <Numbers participants={participants} ideas={ideas} accepted={accepted} />,
    },
    ...(buckets.length > 0 ? [{ key: "sdlc", node: <Sdlc buckets={buckets} /> }] : []),
    { key: "judges", node: <Judges /> },
    { key: "criteria", node: <Criteria /> },
  ];

  const [i, setI] = useState(0);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % slides.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    const id = setInterval(() => window.location.reload(), RELOAD_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

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
      <AnimatedBackdrop />

      {/* top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-10 py-6 text-sm text-[color:var(--color-muted)]">
        <span className="flex items-center gap-2.5">
          <span className="dot-live" />
          <span className="font-semibold tracking-tight">
            <span className="gradient-text">hack</span>.fp
          </span>
        </span>
        <span className="tabular-nums">{clock}</span>
      </div>

      {/* slide */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[i].key}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -28, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-6xl"
          >
            {slides[i].node}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress dots */}
      <div className="absolute bottom-16 inset-x-0 z-10 flex items-center justify-center gap-2.5">
        {slides.map((s, n) => (
          <span
            key={s.key}
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: n === i ? "2.5rem" : "0.5rem",
              background:
                n === i ? "var(--color-accent-2)" : "color-mix(in oklab, white 18%, transparent)",
            }}
          />
        ))}
      </div>

      <Ticker titles={titles} />
    </div>
  );
}

/* ---------- ambient motion ---------- */

function AnimatedBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          top: "-12%",
          left: "-8%",
          background: "radial-gradient(circle, color-mix(in oklab, var(--color-accent-2) 30%, transparent), transparent 65%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, 70, 0], y: [0, 50, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          top: "-10%",
          right: "-8%",
          background: "radial-gradient(circle, color-mix(in oklab, var(--color-accent) 28%, transparent), transparent 65%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          bottom: "-25%",
          left: "25%",
          background: "radial-gradient(circle, color-mix(in oklab, var(--color-accent-3) 20%, transparent), transparent 65%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 27, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ---------- widgets ---------- */

function CountUp({ value, color }: { value: number; color: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className="tabular-nums" style={{ color }}>
      {n}
    </span>
  );
}

function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = target - now;
  if (ms <= 0) {
    return <span className="gradient-text font-semibold">Judging is live</span>;
  }
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor(ms / 3_600_000) % 24;
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const Unit = ({ v, l }: { v: number; l: string }) => (
    <span className="inline-flex flex-col items-center">
      <span className="tabular-nums font-bold gradient-text" style={{ fontSize: "clamp(1.6rem,4vw,3rem)" }}>
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest">{l}</span>
    </span>
  );
  return (
    <div className="inline-flex items-end gap-5">
      <Unit v={d} l="days" />
      <Unit v={h} l="hrs" />
      <Unit v={m} l="min" />
      <Unit v={s} l="sec" />
    </div>
  );
}

function Ticker({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null;
  const items = [...titles, ...titles];
  const duration = Math.max(24, titles.length * 4.5);
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 h-12 flex items-center overflow-hidden border-t border-[color:var(--color-border)] bg-[color:var(--color-background)]/60 backdrop-blur-sm">
      <motion.div
        className="flex shrink-0 items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {items.map((t, idx) => (
          <span key={idx} className="flex items-center text-sm text-[color:var(--color-muted)]">
            <span className="mx-5 text-[color:var(--color-accent-2)]">◆</span>
            <span className="font-medium text-[color:var(--color-foreground)]/90">{t}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- slides ---------- */

function Welcome({ judgingTs }: { judgingTs: number }) {
  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-lg sm:text-2xl text-[color:var(--color-muted)] tracking-[0.3em] uppercase"
      >
        Forcepoint
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-4 font-bold tracking-tight leading-[0.95] gradient-text"
        style={{ fontSize: "clamp(3rem, 12vw, 11rem)" }}
      >
        Hackathon
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8 text-[color:var(--color-muted)]"
        style={{ fontSize: "clamp(1.2rem,3vw,2.2rem)" }}
      >
        Build. Ship. Pitch. · June 9, 2026
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-12 inline-flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
          Judging in
        </span>
        <Countdown target={judgingTs} />
      </motion.div>
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
  const stats = [
    { value: participants, label: "Participants", color: "var(--color-accent)" },
    { value: ideas, label: "Ideas", color: "var(--color-accent-2)" },
    { value: accepted, label: "Accepted", color: "var(--color-success)" },
  ];
  return (
    <div className="text-center">
      <h2
        className="text-[color:var(--color-muted)] uppercase tracking-[0.25em]"
        style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}
      >
        By the numbers
      </h2>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        {stats.map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + idx * 0.15, ease: "easeOut" }}
          >
            <div className="font-bold leading-none" style={{ fontSize: "clamp(4rem, 14vw, 12rem)" }}>
              <CountUp value={s.value} color={s.color} />
            </div>
            <div
              className="mt-4 text-[color:var(--color-muted)]"
              style={{ fontSize: "clamp(1rem,2.5vw,1.8rem)" }}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Sdlc({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div>
      <h2
        className="text-center text-[color:var(--color-muted)] uppercase tracking-[0.25em]"
        style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}
      >
        Ideas by SDLC stage
      </h2>
      <div className="mt-10 space-y-4">
        {buckets.map((b, idx) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-5"
          >
            <div
              className="w-72 shrink-0 flex items-center gap-3"
              style={{ fontSize: "clamp(1rem,2vw,1.6rem)" }}
            >
              <span>{b.icon}</span>
              <span className="truncate">{b.label}</span>
            </div>
            <div className="flex-1 h-6 rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(b.count / max) * 100}%` }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                  background: "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
                }}
              />
            </div>
            <div
              className="w-12 text-right tabular-nums font-semibold"
              style={{ fontSize: "clamp(1.2rem,2.5vw,2rem)" }}
            >
              {b.count}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Judges() {
  return (
    <div className="text-center">
      <h2
        className="text-[color:var(--color-muted)] uppercase tracking-[0.25em]"
        style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}
      >
        Meet the judges
      </h2>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {JUDGES.map((j, idx) => {
          const dim = "clamp(6rem,14vw,11rem)";
          return (
            <motion.div
              key={j.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.18, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4 + idx, repeat: Infinity, ease: "easeInOut" }}
              >
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
              </motion.div>
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Criteria() {
  return (
    <div>
      <h2
        className="text-center text-[color:var(--color-muted)] uppercase tracking-[0.25em]"
        style={{ fontSize: "clamp(1rem,2.5vw,1.6rem)" }}
      >
        How it&apos;s judged
      </h2>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CRITERIA.map((c, idx) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.12, ease: "easeOut" }}
            className="card flex items-baseline gap-4"
          >
            <span
              className="font-bold tabular-nums gradient-text"
              style={{ fontSize: "clamp(1.6rem,4vw,3rem)" }}
            >
              {Math.round(c.weight * 100)}%
            </span>
            <span className="font-semibold" style={{ fontSize: "clamp(1.1rem,2.2vw,1.8rem)" }}>
              {c.label}
            </span>
          </motion.div>
        ))}
      </div>
      <p
        className="mt-10 text-center text-[color:var(--color-muted)]"
        style={{ fontSize: "clamp(1rem,2vw,1.5rem)" }}
      >
        Demos &amp; judging — Thursday, June 11
      </p>
    </div>
  );
}
