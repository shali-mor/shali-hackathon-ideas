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
import { CATEGORY_ORDER, CATEGORY_META, categoryDisplay } from "@/lib/insights";
import { StatusBadge, TeamNeededBadge } from "@/components/StatusBadge";
import type { SubmissionCategory } from "@/lib/submissions";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Name/email shown in the "submitted by" line of the live preview. */
  submitter?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    motivation?: string;
    category?: SubmissionCategory;
    categoryOther?: string;
    developers?: string[];
    teamNeeded?: boolean;
    teamContact?: string;
  };
  submitLabel?: string;
  celebrate?: boolean;
};

type Data = {
  title: string;
  description: string;
  motivation: string;
  category: SubmissionCategory | "";
  categoryOther: string;
  developers: string[];
  teamNeeded: boolean;
  teamContact: string;
};

type StepId =
  | "title"
  | "idea"
  | "motivation"
  | "category"
  | "team"
  | "contact"
  | "review";

const STEPS: { id: StepId; label: string; question: string; hint: string }[] = [
  { id: "title",      label: "Title",       question: "What are you calling it?",   hint: "Short and catchy. Max 80 characters." },
  { id: "idea",       label: "Idea",        question: "Describe the idea.",         hint: "What you'd build, how it works, what the demo looks like." },
  { id: "motivation", label: "Motivation",  question: "Why does it matter?",        hint: "Problem solved, who benefits, why this is worth a day." },
  { id: "category",   label: "SDLC stage",  question: "Which SDLC stage does it target?", hint: "This hackathon is about the software lifecycle — pick the stage your idea improves." },
  { id: "team",       label: "Team",        question: "Who's on the team?",         hint: "Up to 3 developers — or mark as 'team needed' so others can join later." },
  { id: "contact",    label: "Contact",     question: "Best way to reach the submitter?", hint: "Slack handle or email." },
  { id: "review",     label: "Review",      question: "Review and submit.",         hint: "Check your answers before sending." },
];

export function SubmissionForm({
  action,
  submitter,
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
    category: defaultValues?.category ?? "",
    categoryOther: defaultValues?.categoryOther ?? "",
    developers: defaultValues?.developers ?? [],
    teamNeeded: defaultValues?.teamNeeded ?? false,
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
      case "category":
        if (!data.category) return "Pick an SDLC stage.";
        if (data.category === "other" && data.categoryOther.trim().length < 2)
          return "Name the stage/area for “Other”.";
        return null;
      case "team":
        if (!data.teamNeeded && data.developers.length === 0)
          return "Add at least one developer, or mark this idea as needing a team.";
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
        <input type="hidden" name="category" value={data.category} />
        <input type="hidden" name="categoryOther" value={data.categoryOther} />
        <input type="hidden" name="developers" value={data.developers.join("\n")} />
        <input type="hidden" name="teamNeeded" value={data.teamNeeded ? "true" : "false"} />
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
                submitter={submitter}
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
  submitter,
}: {
  step: StepId;
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
  onAdvance: () => void;
  submitter?: string;
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
  if (step === "category") {
    return (
      <CategoryPicker
        value={data.category}
        other={data.categoryOther}
        onChange={(category) => setData({ ...data, category })}
        onChangeOther={(categoryOther) => setData({ ...data, categoryOther })}
      />
    );
  }
  if (step === "team") {
    return (
      <div className="space-y-4">
        <ChipInput
          values={data.developers}
          onChange={(developers) => setData({ ...data, developers })}
          onSubmitChip={onAdvance}
          disabled={data.teamNeeded}
        />
        <label className="flex items-start gap-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 px-3 py-3 cursor-pointer hover:border-[color:var(--color-accent-2)]/60 transition">
          <input
            type="checkbox"
            checked={data.teamNeeded}
            onChange={(e) =>
              setData({
                ...data,
                teamNeeded: e.target.checked,
                developers: e.target.checked ? [] : data.developers,
              })
            }
            className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent-2)]"
          />
          <span className="text-sm">
            <span className="font-medium">Looking for a team — devs can join later</span>
            <span className="block text-xs text-[color:var(--color-muted)] mt-0.5">
              Submit just the idea. You&apos;ll be listed as the submitter, and the idea
              will be marked <em>Team needed</em> so others can pick it up.
            </span>
          </span>
        </label>
      </div>
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
  return <Review data={data} submitter={submitter} />;
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
  disabled = false,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  onSubmitChip: () => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

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

  const inputDisabled = disabled || values.length >= 3;

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
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
            disabled
              ? "Team will be assembled later"
              : values.length === 0
              ? "Type a name and press Enter"
              : values.length < 3
              ? "Add another"
              : ""
          }
          disabled={inputDisabled}
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

function CategoryPicker({
  value,
  other,
  onChange,
  onChangeOther,
}: {
  value: SubmissionCategory | "";
  other: string;
  onChange: (v: SubmissionCategory) => void;
  onChangeOther: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CATEGORY_ORDER.map((key) => {
          const meta = CATEGORY_META[key];
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={selected}
              className={`flex items-center gap-2.5 rounded-md border px-3 py-3 text-left text-sm transition ${
                selected
                  ? "border-[color:var(--color-accent-2)] bg-[color:var(--color-accent-2)]/12 text-[color:var(--color-foreground)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 text-[color:var(--color-muted)] hover:border-[color:var(--color-accent-2)]/50 hover:text-[color:var(--color-foreground)]"
              }`}
            >
              <span className="text-lg leading-none">{meta.icon}</span>
              <span className="leading-tight">{meta.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {value === "other" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              autoFocus
              value={other}
              onChange={(e) => onChangeOther(e.target.value)}
              maxLength={60}
              placeholder="Name the stage or area — e.g. “Code review”, “Security”, “Docs”"
              className="input"
            />
            <p className="mt-1.5 text-xs text-[color:var(--color-muted)]">
              For ideas that don&apos;t fit one of the SDLC stages above.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Review({ data, submitter }: { data: Data; submitter?: string }) {
  const devsLine = data.teamNeeded
    ? data.developers.length > 0
      ? `${data.developers.join(", ")} — open to more (team needed)`
      : "Team needed — open to anyone joining"
    : data.developers.join(", ");
  const spotsOpen = Math.max(0, 3 - data.developers.length);
  const cat = data.category
    ? categoryDisplay(data.category, data.categoryOther)
    : null;

  return (
    <div className="space-y-5">
      {/* Live preview: how the idea will appear on the board */}
      <div>
        <p className="text-xs text-[color:var(--color-muted)] mb-2">
          How it&apos;ll appear on the board
        </p>
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold leading-tight">
              {data.title || (
                <span className="text-[color:var(--color-muted)] italic">Untitled</span>
              )}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {data.teamNeeded && <TeamNeededBadge />}
              <StatusBadge status="pending" />
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {cat && (
              <span className="pill border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/70 text-[color:var(--color-muted)]">
                {cat.icon} {cat.label}
              </span>
            )}
            <span className="text-xs text-[color:var(--color-muted)]">
              Submitted by {submitter || "you"}
            </span>
          </div>

          <p className="mt-3 text-sm text-[color:var(--color-muted)] line-clamp-3">
            {data.description || "—"}
          </p>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {data.developers.slice(0, 4).map((d) => (
              <span
                key={d}
                className="pill border border-[color:var(--color-border)] text-[color:var(--color-muted)] bg-[color:var(--color-surface-2)]/70"
              >
                {d}
              </span>
            ))}
            {data.teamNeeded && (
              <span className="text-xs text-[color:var(--color-accent-2)] italic">
                {data.developers.length === 0
                  ? "No team yet — add yourself"
                  : `${spotsOpen} spot${spotsOpen === 1 ? "" : "s"} open`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full details so every field is verifiable before submitting */}
      <div>
        <p className="text-xs text-[color:var(--color-muted)] mb-2">Full details</p>
        <dl className="divide-y divide-[color:var(--color-border)] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70">
          <Row
            k="SDLC stage"
            v={cat ? `${cat.icon} ${cat.label}` : ""}
          />
          <Row k="Idea" v={data.description} multi />
          <Row k="Motivation" v={data.motivation} multi />
          <Row k="Developers" v={devsLine} />
          <Row k="Contact" v={data.teamContact} />
        </dl>
      </div>
    </div>
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
