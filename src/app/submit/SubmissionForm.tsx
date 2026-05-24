"use client";

import {
  useState,
  useRef,
  useEffect,
  useActionState,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { ActionState } from "./actions";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    title?: string;
    description?: string;
    motivation?: string;
    developers?: string[];
    teamContact?: string;
  };
  submitLabel?: string;
  celebrate?: boolean;
};

type Data = {
  title: string;
  description: string;
  motivation: string;
  developers: string[];
  teamContact: string;
};

type StepId = "title" | "idea" | "motivation" | "team" | "contact" | "review";

const STEPS: { id: StepId; label: string; question: string; hint: string }[] = [
  { id: "title",      label: "Title",       question: "What are you calling it?",   hint: "Short and catchy. Max 80 characters." },
  { id: "idea",       label: "Idea",        question: "Describe the idea.",         hint: "What you'd build, how it works, what the demo looks like." },
  { id: "motivation", label: "Motivation",  question: "Why does it matter?",        hint: "Problem solved, who benefits, why this is worth a day." },
  { id: "team",       label: "Team",        question: "Who's on the team?",         hint: "1–3 developers. Press Enter to add each." },
  { id: "contact",    label: "Contact",     question: "Best way to reach the team lead?", hint: "Slack handle or email." },
  { id: "review",     label: "Review",      question: "Review and submit.",         hint: "Check your answers before sending." },
];

export function SubmissionForm({
  action,
  defaultValues,
  submitLabel = "Submit",
  celebrate = false,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    motivation: defaultValues?.motivation ?? "",
    developers: defaultValues?.developers ?? [],
    teamContact: defaultValues?.teamContact ?? "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [celebrating, setCelebrating] = useState(false);

  const total = STEPS.length;
  const progress = ((step + 1) / total) * 100;
  const isLast = step === total - 1;
  const current = STEPS[step];

  function validateStep(s: number): string | null {
    switch (STEPS[s].id) {
      case "title":
        if (!data.title.trim()) return "Give it a name.";
        if (data.title.length > 80) return "Max 80 characters.";
        return null;
      case "idea":
        if (data.description.trim().length < 20) return "At least 20 characters please.";
        if (data.description.length > 2000) return "Max 2000 characters.";
        return null;
      case "motivation":
        if (data.motivation.trim().length < 10) return "A sentence or two on why.";
        if (data.motivation.length > 1000) return "Max 1000 characters.";
        return null;
      case "team":
        if (data.developers.length === 0) return "Add at least one developer.";
        if (data.developers.length > 3) return "Up to 3 developers.";
        return null;
      case "contact":
        if (data.teamContact.trim().length < 3) return "Add a Slack handle or email.";
        return null;
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setStep((s) => Math.min(s + 1, total - 1));
  }
  function back() {
    setValidationError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  useEffect(() => {
    if (state?.ok && celebrate) {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.55 },
        colors: ["#818cf8", "#a78bfa", "#f0abfc", "#ffffff"],
        startVelocity: 32,
        gravity: 1.2,
        ticks: 160,
      });
      setCelebrating(true);
      const id = setTimeout(() => {
        if (state.ok && state.id) router.push(`/ideas/${state.id}`);
      }, 1600);
      return () => clearTimeout(id);
    }
  }, [state, celebrate, router]);

  return (
    <div className="relative">
      {/* progress: single thin bar with label above */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)] mb-2">
          <span className="tabular-nums">Step {step + 1} of {total}</span>
          <span>{current.label}</span>
        </div>
        <div className="h-[2px] bg-[color:var(--color-surface-2)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[color:var(--color-accent-2)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
      </div>

      <form action={formAction} className="contents">
        <input type="hidden" name="title" value={data.title} />
        <input type="hidden" name="description" value={data.description} />
        <input type="hidden" name="motivation" value={data.motivation} />
        <input type="hidden" name="developers" value={data.developers.join("\n")} />
        <input type="hidden" name="teamContact" value={data.teamContact} />

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="min-h-[260px]"
          >
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {current.question}
            </h2>
            <p className="mt-1.5 text-sm text-[color:var(--color-muted)]">{current.hint}</p>

            <div className="mt-6">
              <StepInput
                step={current.id}
                data={data}
                setData={setData}
                onAdvance={next}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]"
          >
            {validationError}
          </motion.div>
        )}
        {state && !state.ok && (
          <div className="mt-4 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
            {state.error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="btn btn-ghost disabled:opacity-30"
          >
            Back
          </button>
          {!isLast ? (
            <button type="button" onClick={next} className="btn btn-primary">
              Continue
            </button>
          ) : (
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? "Submitting…" : submitLabel}
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-background)]/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-full bg-[color:var(--color-accent-2)] text-[color:var(--color-background)] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Submitted</h2>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">Taking you there…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepInput({
  step,
  data,
  setData,
  onAdvance,
}: {
  step: StepId;
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
  onAdvance: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      inputRef.current?.focus();
      textRef.current?.focus();
    }, 140);
    return () => clearTimeout(id);
  }, [step]);

  function onKey(e: React.KeyboardEvent) {
    if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey || step === "title" || step === "contact")
    ) {
      e.preventDefault();
      onAdvance();
    }
  }

  if (step === "title") {
    return (
      <FieldShell
        right={<CharCount value={data.title} max={80} />}
        hint="Press Enter to continue."
      >
        <input
          ref={inputRef}
          type="text"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          onKeyDown={onKey}
          maxLength={80}
          placeholder="e.g. AutoTriage"
          className="input"
        />
      </FieldShell>
    );
  }
  if (step === "idea") {
    return (
      <FieldShell
        right={<CharCount value={data.description} max={2000} />}
        hint={<>Press <Kbd>⌘</Kbd> + <Kbd>Enter</Kbd> to continue.</>}
      >
        <AutoTextarea
          ref={textRef}
          value={data.description}
          onChange={(v) => setData({ ...data, description: v })}
          onKeyDown={onKey}
          max={2000}
          minRows={5}
          placeholder="Describe what you'd build, how it works, and what the demo looks like."
        />
      </FieldShell>
    );
  }
  if (step === "motivation") {
    return (
      <FieldShell
        right={<CharCount value={data.motivation} max={1000} />}
        hint={<>Press <Kbd>⌘</Kbd> + <Kbd>Enter</Kbd> to continue.</>}
      >
        <AutoTextarea
          ref={textRef}
          value={data.motivation}
          onChange={(v) => setData({ ...data, motivation: v })}
          onKeyDown={onKey}
          max={1000}
          minRows={4}
          placeholder="What problem does it solve? Who benefits?"
        />
      </FieldShell>
    );
  }
  if (step === "team") {
    return (
      <ChipInput
        values={data.developers}
        onChange={(developers) => setData({ ...data, developers })}
        onSubmitChip={onAdvance}
      />
    );
  }
  if (step === "contact") {
    return (
      <FieldShell
        right={<CharCount value={data.teamContact} max={120} />}
        hint="Press Enter to continue."
      >
        <input
          ref={inputRef}
          type="text"
          value={data.teamContact}
          onChange={(e) => setData({ ...data, teamContact: e.target.value })}
          onKeyDown={onKey}
          maxLength={120}
          placeholder="@shali on Slack"
          className="input"
        />
      </FieldShell>
    );
  }
  return <Review data={data} />;
}

function FieldShell({
  children,
  right,
  hint,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[color:var(--color-muted)]">
        <span>{hint}</span>
        {right}
      </div>
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  max,
  minRows = 4,
  placeholder,
  ref,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  max: number;
  minRows?: number;
  placeholder: string;
  ref: RefObject<HTMLTextAreaElement | null>;
}) {
  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.max(t.scrollHeight, minRows * 26)}px`;
  }, [value, ref, minRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      maxLength={max}
      rows={minRows}
      placeholder={placeholder}
      className="input resize-none leading-relaxed"
      style={{ overflow: "hidden" }}
    />
  );
}

function ChipInput({
  values,
  onChange,
  onSubmitChip,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  onSubmitChip: () => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  function add(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (values.includes(cleaned)) {
      setInput("");
      return;
    }
    if (values.length >= 3) return;
    onChange([...values, cleaned]);
    setInput("");
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) add(input);
      else if (values.length > 0) onSubmitChip();
    } else if (e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && input === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 px-2 py-1.5 flex flex-wrap gap-1.5 min-h-[44px] focus-within:border-[color:var(--color-accent-2)]/60 transition">
        <AnimatePresence initial={false}>
          {values.map((v) => (
            <motion.span
              key={v}
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)]"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-[color:var(--color-muted)] hover:text-[color:var(--color-danger)]"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => input.trim() && add(input)}
          placeholder={
            values.length === 0
              ? "Type a name and press Enter"
              : values.length < 3
              ? "Add another"
              : ""
          }
          disabled={values.length >= 3}
          className="flex-1 min-w-[140px] bg-transparent px-1.5 py-0.5 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--color-muted)]">
        <span>Use comma or Enter to add. Backspace to remove.</span>
        <span className="tabular-nums">{values.length} / 3</span>
      </div>
    </div>
  );
}

function Review({ data }: { data: Data }) {
  return (
    <dl className="divide-y divide-[color:var(--color-border)] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70">
      <Row k="Title" v={data.title} />
      <Row k="Idea" v={data.description} multi />
      <Row k="Motivation" v={data.motivation} multi />
      <Row k="Developers" v={data.developers.join(", ")} />
      <Row k="Contact" v={data.teamContact} />
    </dl>
  );
}

function Row({ k, v, multi }: { k: string; v: string; multi?: boolean }) {
  return (
    <div className="px-4 py-3 grid grid-cols-[120px_1fr] gap-4 items-baseline">
      <dt className="text-xs text-[color:var(--color-muted)]">{k}</dt>
      <dd className={`text-sm ${multi ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
        {v || <span className="text-[color:var(--color-muted)] italic">(empty)</span>}
      </dd>
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const ratio = len / max;
  const color =
    ratio > 0.95
      ? "text-[color:var(--color-danger)]"
      : ratio > 0.85
      ? "text-[color:var(--color-warn)]"
      : "text-[color:var(--color-muted)]";
  return <span className={`tabular-nums ${color}`}>{len} / {max}</span>;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-[color:var(--color-border)] px-1.5 py-0.5 text-[11px]">
      {children}
    </kbd>
  );
}
