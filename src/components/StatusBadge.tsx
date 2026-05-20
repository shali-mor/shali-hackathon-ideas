import clsx from "clsx";

type Status = "pending" | "accepted" | "rejected";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "pending" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        status === "accepted" &&
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        status === "rejected" &&
          "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
      )}
    >
      {status}
    </span>
  );
}
