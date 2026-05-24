"use client";

import { useState } from "react";
import { adminDeleteSubmission } from "./actions";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-danger)]"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={adminDeleteSubmission} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-[color:var(--color-muted)]">
        Delete &quot;{title}&quot;?
      </span>
      <button
        type="submit"
        className="text-xs text-[color:var(--color-danger)] font-medium hover:underline"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        Cancel
      </button>
    </form>
  );
}
