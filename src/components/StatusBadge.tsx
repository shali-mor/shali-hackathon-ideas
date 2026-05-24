import clsx from "clsx";

type Status = "pending" | "accepted" | "rejected";

const STYLES: Record<Status, string> = {
  pending:
    "bg-[color:var(--color-warn)]/15 text-[color:var(--color-warn)] border-[color:var(--color-warn)]/30",
  accepted:
    "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30",
  rejected:
    "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)] border-[color:var(--color-danger)]/30",
};

const LABEL: Record<Status, string> = {
  pending: "● pending",
  accepted: "✓ accepted",
  rejected: "✕ rejected",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx("pill border", STYLES[status])}>{LABEL[status]}</span>
  );
}
