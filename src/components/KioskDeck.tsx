"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { CRITERIA } from "@/lib/judging";
import { HACKATHON_END } from "@/lib/dates";

// The wireframe orb (three.js) — client-only, same component the home hero uses.
const Hero3D = dynamic(() => import("./Hero3D").then((m) => m.Hero3D), {
  ssr: false,
  loading: () => null,
});

type Bucket = { label: string; icon: string; count: number };

type Finalist = { title: string; team: string[] };

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
  finalists: Finalist[];
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
    name: "Roy Feintuch",
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
  finalists,
}: Props) {
  const endTs = useHackathonEnd();
  const slides: { key: string; node: ReactNode }[] = [
    { key: "welcome", node: <Welcome endTs={endTs} /> },
    { key: "slack", node: <SlackInfo /> },
    {
      key: "numbers",
      node: <Numbers participants={participants} ideas={ideas} accepted={accepted} />,
    },
    ...(buckets.length > 0 ? [{ key: "sdlc", node: <Sdlc buckets={buckets} /> }] : []),
    ...(finalists.length > 0
      ? [{ key: "finalists", node: <Finalists finalists={finalists} /> }]
      : []),
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
      <div
        className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-[3vw] py-5 text-[color:var(--color-muted)]"
        style={{ fontSize: "clamp(0.85rem,1.1vw,1.25rem)" }}
      >
        <span className="flex items-center gap-3">
          <span className="dot-live" />
          <span className="font-semibold tracking-tight">
            <span className="gradient-text">hack</span>.fp
          </span>
        </span>
        <span className="tabular-nums">{clock}</span>
      </div>

      {/* slide — welcome uses a 2-column hero (text + orb); all other
          slides use a single centered column. The orb stays mounted
          either way (display:none on non-welcome) so the WebGL canvas
          isn't re-initialised every time we return to slide 1.
          Sizing targets a 1920x1080 TV: content fills ~92vw with a
          1800px cap, with ~64px outer padding inside the TV safe area. */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-[4vw] py-[6vh]">
        {(() => {
          const isWelcome = slides[i].key === "welcome";
          return (
            <div
              className={
                isWelcome
                  ? "grid w-full max-w-[1800px] items-center gap-[5vw] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]"
                  : "w-full max-w-[1800px]"
              }
            >
              <div className="relative min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slides[i].key}
                    initial={{ opacity: 0, y: 28, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    {slides[i].node}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div
                aria-hidden
                className={`pointer-events-none mx-auto aspect-square w-[min(40vh,460px)] opacity-85 ${
                  isWelcome ? "block" : "hidden"
                }`}
              >
                <Hero3D />
              </div>
            </div>
          );
        })()}
      </div>

      {/* progress dots — sits just above the ticker */}
      <div className="absolute bottom-[6vh] inset-x-0 z-10 flex items-center justify-center gap-3">
        {slides.map((s, n) => (
          <span
            key={s.key}
            className="rounded-full transition-all duration-500"
            style={{
              height: "clamp(0.4rem,0.55vh,0.6rem)",
              width: n === i ? "clamp(2.5rem,3.5vw,4.5rem)" : "clamp(0.5rem,0.7vw,0.85rem)",
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

// "Time remaining" counts down to HACKATHON_END (pencils-down).
function useHackathonEnd(): number | null {
  return HACKATHON_END.getTime();
}

function Countdown24({ endTs }: { endTs: number | null }) {
  // Initialise `now` on the client only — Date.now() at render time would
  // differ between SSR and hydration and trigger a mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (endTs == null || now == null) return null;
  const ms = endTs - now;
  if (ms <= 0) {
    return (
      <span className="gradient-text font-bold" style={{ fontSize: "clamp(2rem,6vw,4.5rem)" }}>
        Pencils down — time&apos;s up!
      </span>
    );
  }
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const Unit = ({ v, l }: { v: number; l: string }) => (
    <span className="inline-flex flex-col items-center">
      <span
        className="tabular-nums font-bold gradient-text leading-none"
        style={{ fontSize: "clamp(3.5rem,10vw,11rem)" }}
      >
        {String(v).padStart(2, "0")}
      </span>
      <span
        className="mt-2 text-[color:var(--color-muted)] uppercase tracking-[0.25em]"
        style={{ fontSize: "clamp(0.8rem,1.4vw,1.4rem)" }}
      >
        {l}
      </span>
    </span>
  );
  const Sep = () => (
    <span
      className="font-bold text-[color:var(--color-muted)] leading-none"
      style={{ fontSize: "clamp(3rem,8vw,8rem)" }}
    >
      :
    </span>
  );
  return (
    <div className="inline-flex items-start gap-3 sm:gap-5">
      <Unit v={h} l="hours" />
      <Sep />
      <Unit v={m} l="min" />
      <Sep />
      <Unit v={s} l="sec" />
    </div>
  );
}

function Ticker({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null;
  const items = [...titles, ...titles];
  const duration = Math.max(24, titles.length * 4.5);
  return (
    <div
      className="absolute bottom-0 inset-x-0 z-10 flex items-center overflow-hidden border-t border-[color:var(--color-border)] bg-[color:var(--color-background)]/60 backdrop-blur-sm"
      style={{ height: "clamp(2.75rem,4.2vh,4.2rem)" }}
    >
      <motion.div
        className="flex shrink-0 items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {items.map((t, idx) => (
          <span
            key={idx}
            className="flex items-center text-[color:var(--color-muted)]"
            style={{ fontSize: "clamp(0.95rem,1.25vw,1.4rem)" }}
          >
            <span className="mx-7 text-[color:var(--color-accent-2)]">◆</span>
            <span className="font-medium text-[color:var(--color-foreground)]/90">{t}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- slides ---------- */

function Welcome({ endTs }: { endTs: number | null }) {
  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-[color:var(--color-muted)] tracking-[0.3em] uppercase"
        style={{ fontSize: "clamp(1rem,2vw,1.8rem)" }}
      >
        Forcepoint
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-5 font-bold tracking-tight leading-[0.95] gradient-text"
        style={{ fontSize: "clamp(3rem, 9vw, 12rem)" }}
      >
        Hackathon
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-10 text-[color:var(--color-muted)]"
        style={{ fontSize: "clamp(1.4rem,2.6vw,3rem)" }}
      >
        Build. Ship. Pitch. · June 9, 2026
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-12 inline-flex flex-col items-center gap-3"
      >
        <span
          className="uppercase tracking-[0.25em] text-[color:var(--color-muted)]"
          style={{ fontSize: "clamp(0.75rem,1.2vw,1.1rem)" }}
        >
          Time remaining
        </span>
        <Countdown24 endTs={endTs} />
      </motion.div>
    </div>
  );
}

function SlackInfo() {
  return (
    <div className="text-center">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="text-[color:var(--color-muted)] uppercase tracking-[0.3em]"
        style={{ fontSize: "clamp(1rem,1.6vw,1.6rem)" }}
      >
        Join the conversation
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-8 flex items-center justify-center gap-5 flex-wrap"
      >
        <SlackMark />
        <h1
          className="font-bold tracking-tight gradient-text leading-none"
          style={{ fontSize: "clamp(2.4rem,7vw,7rem)" }}
        >
          #sdlc-hackathon
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-10 text-[color:var(--color-foreground)]/85"
        style={{ fontSize: "clamp(1.3rem,2.3vw,2.6rem)" }}
      >
        Slack channel — <span className="font-semibold">free to join</span>, open to everyone.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5"
      >
        <SlackPanel
          icon="📣"
          title="Instructions"
          body="Live updates and announcements throughout the day."
        />
        <SlackPanel
          icon="❓"
          title="Q&A"
          body="Stuck on something? Ask — organisers and peers are watching."
        />
        <SlackPanel
          icon="🤝"
          title="Find a team"
          body="Solo idea? Looking to join one? Post in the channel."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="mt-10 flex items-center justify-center gap-3"
      >
        <span className="dot-live" />
        <span
          className="pill border border-[color:var(--color-accent)]/45 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] uppercase tracking-[0.2em]"
          style={{ fontSize: "clamp(0.9rem,1.3vw,1.4rem)" }}
        >
          Live throughout the hackathon
        </span>
      </motion.div>
    </div>
  );
}

function SlackPanel({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card text-left">
      <div className="flex items-center gap-3">
        <span
          className="leading-none"
          style={{ fontSize: "clamp(1.8rem,2.4vw,2.8rem)" }}
          aria-hidden
        >
          {icon}
        </span>
        <h3
          className="font-semibold tracking-tight"
          style={{ fontSize: "clamp(1.1rem,1.5vw,1.8rem)" }}
        >
          {title}
        </h3>
      </div>
      <p
        className="mt-3 text-[color:var(--color-muted)] leading-snug"
        style={{ fontSize: "clamp(0.95rem,1.15vw,1.4rem)" }}
      >
        {body}
      </p>
    </div>
  );
}

function SlackMark() {
  // Slack hash-bubble in brand colours.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ width: "clamp(2.4rem,5vw,5rem)", height: "clamp(2.4rem,5vw,5rem)" }}
    >
      <path d="M5.042 15.165a2.528 2.528 0 1 1-2.52-2.52h2.52v2.52zm1.27 0a2.528 2.528 0 0 1 5.055 0v6.302a2.528 2.528 0 0 1-5.054 0v-6.302z" fill="#E01E5A" />
      <path d="M8.84 5.042a2.528 2.528 0 1 1 2.52-2.52v2.52h-2.52zm0 1.27a2.528 2.528 0 0 1 0 5.055H2.522a2.528 2.528 0 0 1 0-5.054H8.84z" fill="#36C5F0" />
      <path d="M18.956 8.834a2.528 2.528 0 1 1 2.52 2.52h-2.52V8.834zm-1.27 0a2.528 2.528 0 0 1-5.054 0V2.522a2.528 2.528 0 1 1 5.055 0V8.84z" fill="#2EB67D" />
      <path d="M15.165 18.956a2.528 2.528 0 1 1-2.52 2.52v-2.52h2.52zm0-1.27a2.528 2.528 0 0 1 0-5.054h6.318a2.528 2.528 0 0 1 0 5.055h-6.318z" fill="#ECB22E" />
    </svg>
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
        className="text-[color:var(--color-muted)] uppercase tracking-[0.3em]"
        style={{ fontSize: "clamp(1rem,1.8vw,1.8rem)" }}
      >
        By the numbers
      </h2>
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-14">
        {stats.map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + idx * 0.15, ease: "easeOut" }}
          >
            <div className="font-bold leading-none" style={{ fontSize: "clamp(4.5rem, 14vw, 16rem)" }}>
              <CountUp value={s.value} color={s.color} />
            </div>
            <div
              className="mt-6 text-[color:var(--color-muted)] uppercase tracking-[0.2em]"
              style={{ fontSize: "clamp(1.1rem,2.2vw,2.4rem)" }}
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
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const topCount = Math.max(...buckets.map((b) => b.count));

  return (
    <div>
      <div className="text-center">
        <h2
          className="text-[color:var(--color-muted)] uppercase tracking-[0.3em]"
          style={{ fontSize: "clamp(1rem,1.6vw,1.6rem)" }}
        >
          Ideas by SDLC stage
        </h2>
        <p
          className="mt-3 text-[color:var(--color-foreground)]/85"
          style={{ fontSize: "clamp(1.3rem,2.3vw,2.4rem)" }}
        >
          <span className="font-bold gradient-text tabular-nums">{total}</span>{" "}
          ideas across the lifecycle
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {buckets.map((b, idx) => {
          const pct = (b.count / max) * 100;
          const isTop = b.count === topCount && b.count > 0;
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
              className={`relative card overflow-hidden ${
                isTop ? "glow-ring" : ""
              }`}
            >
              {/* glow fill — width tracks the count */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                  delay: 0.2 + idx * 0.08,
                  duration: 1,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in oklab, var(--color-accent-2) 28%, transparent), color-mix(in oklab, var(--color-accent-2) 6%, transparent) 65%, transparent)",
                }}
              />

              {isTop && (
                <span className="absolute top-3 right-3 pill border border-[color:var(--color-success)]/45 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] text-[10px] tracking-[0.18em] uppercase">
                  Leading
                </span>
              )}

              <div className="relative flex items-start gap-4 pr-20">
                <span
                  className="leading-none shrink-0"
                  style={{ fontSize: "clamp(2.2rem,3.4vw,4rem)" }}
                  aria-hidden
                >
                  {b.icon}
                </span>
                <span
                  className="font-semibold tracking-tight leading-tight"
                  style={{ fontSize: "clamp(1.15rem,1.7vw,1.9rem)" }}
                >
                  {b.label}
                </span>
              </div>

              <div className="relative mt-6 flex items-end gap-3">
                <span
                  className="font-bold tabular-nums gradient-text leading-none"
                  style={{ fontSize: "clamp(3.2rem,5.8vw,6.5rem)" }}
                >
                  {b.count}
                </span>
                <span
                  className="mb-2 text-[color:var(--color-muted)] uppercase tracking-[0.18em]"
                  style={{ fontSize: "clamp(0.85rem,1.1vw,1.2rem)" }}
                >
                  {b.count === 1 ? "idea" : "ideas"}
                </span>
              </div>

              <div className="relative mt-4 h-[3px] rounded-full bg-[color:var(--color-surface-2)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    delay: 0.3 + idx * 0.08,
                    duration: 1.2,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  style={{
                    background:
                      "linear-gradient(to right, var(--color-accent-2), var(--color-accent))",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Finalists({ finalists }: { finalists: Finalist[] }) {
  return (
    <div>
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="text-[color:var(--color-muted)] uppercase tracking-[0.3em]"
          style={{ fontSize: "clamp(1rem,1.6vw,1.6rem)" }}
        >
          🏆 To the finals
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-3 font-bold tracking-tight leading-none gradient-text"
          style={{ fontSize: "clamp(2.8rem,8vw,9rem)" }}
        >
          Finalists
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-[color:var(--color-foreground)]/85"
          style={{ fontSize: "clamp(1.3rem,2.3vw,2.6rem)" }}
        >
          of the <span className="font-semibold">SDLC Hackathon</span>
        </motion.p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {finalists.map((f, idx) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25 + idx * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative card overflow-hidden glow-ring"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, color-mix(in oklab, var(--color-accent-2) 16%, transparent), transparent 60%)",
              }}
            />
            <span
              className="absolute top-3 right-3 pill border border-[color:var(--color-success)]/45 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] uppercase tracking-[0.18em]"
              style={{ fontSize: "clamp(0.6rem,0.8vw,0.95rem)" }}
            >
              Finalist
            </span>

            <div className="flex items-start gap-4 pr-24">
              <span
                aria-hidden
                className="leading-none shrink-0 gradient-text font-bold"
                style={{ fontSize: "clamp(2rem,3vw,3.4rem)" }}
              >
                ✦
              </span>
              <div className="min-w-0">
                <h3
                  className="font-semibold tracking-tight leading-tight line-clamp-2"
                  style={{ fontSize: "clamp(1.3rem,2vw,2.4rem)" }}
                >
                  {f.title}
                </h3>
                {f.team.length > 0 && (
                  <p
                    className="mt-2 text-[color:var(--color-muted)] leading-snug line-clamp-2"
                    style={{ fontSize: "clamp(0.95rem,1.2vw,1.5rem)" }}
                  >
                    {f.team.join(" · ")}
                  </p>
                )}
              </div>
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
        className="text-[color:var(--color-muted)] uppercase tracking-[0.3em]"
        style={{ fontSize: "clamp(1rem,1.8vw,1.8rem)" }}
      >
        Meet the judges
      </h2>
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-12">
        {JUDGES.map((j, idx) => {
          const dim = "clamp(7rem,14vw,14rem)";
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
                      fontSize: "clamp(2.4rem,5vw,5rem)",
                      background:
                        "linear-gradient(135deg, var(--color-accent), var(--color-accent-2) 60%, var(--color-accent-3))",
                    }}
                  >
                    {j.initials}
                  </div>
                )}
              </motion.div>
              <div
                className="mt-6 font-semibold"
                style={{ fontSize: "clamp(1.5rem,2.6vw,2.8rem)" }}
              >
                {j.name}
              </div>
              {j.title ? (
                <>
                  <div style={{ fontSize: "clamp(1.1rem,1.7vw,2rem)" }}>{j.title}</div>
                  <div
                    className="mt-1 gradient-text font-semibold"
                    style={{ fontSize: "clamp(1.05rem,1.6vw,1.8rem)" }}
                  >
                    {j.company}
                  </div>
                </>
              ) : (
                <div
                  className="mt-2 text-[color:var(--color-muted)]"
                  style={{ fontSize: "clamp(1rem,1.5vw,1.5rem)" }}
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
  const ICONS: Record<string, string> = {
    impact: "🎯",
    demo: "⚡",
    pitch: "🎤",
    adoptability: "🚀",
  };
  const topWeight = Math.max(...CRITERIA.map((c) => c.weight));

  return (
    <div>
      <div className="text-center">
        <h2
          className="text-[color:var(--color-muted)] uppercase tracking-[0.3em]"
          style={{ fontSize: "clamp(1rem,1.6vw,1.6rem)" }}
        >
          How it&apos;s judged
        </h2>
        <p
          className="mt-3 text-[color:var(--color-foreground)]/85"
          style={{ fontSize: "clamp(1.3rem,2.3vw,2.4rem)" }}
        >
          Four signals, weighted to{" "}
          <span className="font-bold gradient-text tabular-nums">100</span>
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
        {CRITERIA.map((c, idx) => {
          const pct = Math.round(c.weight * 100);
          const isTop = c.weight === topWeight;
          const gradId = `critGrad-${c.key}`;
          const R = 42;
          const C = 2 * Math.PI * R;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              className={`card relative overflow-hidden flex items-center gap-4 lg:gap-6 ${
                isTop ? "glow-ring" : ""
              }`}
            >
              {/* ambient gradient wash, weighted by the criterion */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(circle at 0% 50%, color-mix(in oklab, var(--color-accent-2) 14%, transparent), transparent 65%)",
                }}
              />

              {/* circular progress ring + % in center */}
              <div
                className="relative shrink-0"
                style={{
                  width: "clamp(110px, 13vw, 220px)",
                  height: "clamp(110px, 13vw, 220px)",
                }}
              >
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent-2)" />
                      <stop offset="100%" stopColor="var(--color-accent)" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke="color-mix(in oklab, white 10%, transparent)"
                    strokeWidth="7"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={`url(#${gradId})`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: C * (1 - c.weight) }}
                    transition={{
                      delay: 0.25 + idx * 0.1,
                      duration: 1.2,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="font-bold tabular-nums gradient-text leading-none"
                    style={{ fontSize: "clamp(1.7rem,2.6vw,3.4rem)" }}
                  >
                    {pct}
                    <span style={{ fontSize: "0.55em", marginLeft: "0.05em" }}>
                      %
                    </span>
                  </span>
                </div>
              </div>

              {/* label + blurb */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="leading-none"
                    style={{ fontSize: "clamp(1.8rem,2.6vw,3rem)" }}
                    aria-hidden
                  >
                    {ICONS[c.key]}
                  </span>
                  <h3
                    className="font-semibold tracking-tight"
                    style={{ fontSize: "clamp(1.25rem,1.8vw,2.2rem)" }}
                  >
                    {c.label}
                  </h3>
                  {isTop && (
                    <span
                      className="pill border border-[color:var(--color-accent-2)]/50 bg-[color:var(--color-accent-2)]/15 text-[color:var(--color-accent-2)] uppercase tracking-[0.18em]"
                      style={{ fontSize: "clamp(0.7rem,0.9vw,1rem)" }}
                    >
                      Top weight
                    </span>
                  )}
                </div>
                <p
                  className="mt-3 text-[color:var(--color-muted)] leading-snug line-clamp-2"
                  style={{ fontSize: "clamp(1rem,1.2vw,1.4rem)" }}
                >
                  {c.blurb}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-8 flex items-center justify-center gap-2.5"
      >
        <span className="dot-live" />
        <span
          className="pill border border-[color:var(--color-accent)]/45 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] uppercase tracking-[0.2em]"
          style={{ fontSize: "clamp(0.9rem,1.3vw,1.4rem)" }}
        >
          Demos &amp; judging — Thursday, June 11
        </span>
      </motion.div>
    </div>
  );
}
