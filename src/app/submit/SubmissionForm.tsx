"use client";

import { useActionState } from "react";
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
};

export function SubmissionForm({ action, defaultValues, submitLabel = "Submit" }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
          {state.error}
        </div>
      )}

      <Field label="Project title" hint="Short, catchy. Max 80 chars.">
        <input
          name="title"
          required
          maxLength={80}
          defaultValue={defaultValues?.title}
          className="input"
        />
      </Field>

      <Field label="Idea / description" hint="What is it? Max 2000 chars.">
        <textarea
          name="description"
          required
          rows={6}
          maxLength={2000}
          defaultValue={defaultValues?.description}
          className="input"
        />
      </Field>

      <Field
        label="Problem it solves / motivation"
        hint="Why is this worth a day? Max 1000 chars."
      >
        <textarea
          name="motivation"
          required
          rows={4}
          maxLength={1000}
          defaultValue={defaultValues?.motivation}
          className="input"
        />
      </Field>

      <Field
        label="Developer names"
        hint="One per line, or comma-separated. 1–6 people."
      >
        <textarea
          name="developers"
          required
          rows={3}
          defaultValue={defaultValues?.developers?.join("\n")}
          className="input"
        />
      </Field>

      <Field label="Team lead contact" hint="Slack handle or email">
        <input
          name="teamContact"
          required
          maxLength={120}
          defaultValue={defaultValues?.teamContact}
          className="input"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && (
        <span className="block text-xs text-neutral-500 mt-0.5">{hint}</span>
      )}
      <div className="mt-1">{children}</div>
    </label>
  );
}
