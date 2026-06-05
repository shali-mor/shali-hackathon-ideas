"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — no-op.
    }
  }

  return (
    <button type="button" onClick={copy} className="btn btn-ghost text-sm">
      {copied ? "Copied ✓" : `📋 ${label}`}
    </button>
  );
}
