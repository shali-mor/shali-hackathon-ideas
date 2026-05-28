"use client";

import { useActionState } from "react";
import { joinTeam } from "@/app/submit/actions";
import type { ActionState } from "@/app/submit/actions";

export function JoinTeamButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    joinTeam,
    null,
  );

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending || disabled}
        className="btn btn-primary"
      >
        {pending ? "Joining…" : "＋ Add me to the team"}
      </button>
      {state && !state.ok && (
        <p className="mt-2 text-sm text-[color:var(--color-danger)]">{state.error}</p>
      )}
    </form>
  );
}
