import { formatCrmDate, formatCrmDateTime, formatCrmTime } from "@/lib/crm-datetime";

export type CallbackDisplayState = "none" | "overdue" | "due_soon" | "today" | "upcoming";

export type CallbackDisplay = {
  state: CallbackDisplayState;
  daysRemaining: number | null;
  label: string;
  shortLabel: string;
  isOverdue: boolean;
};

const DAY_MS = 86_400_000;
/** Callbacks within this many days use amber "due soon" styling */
const DUE_SOON_DAYS = 3;

function startOfIstDay(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "01";
  const key = `${get("year")}-${get("month")}-${get("day")}`;
  return new Date(`${key}T00:00:00+05:30`).getTime();
}

export function describeCallback(dueAtIso: string | null | undefined, now = Date.now()): CallbackDisplay {
  if (!dueAtIso) {
    return {
      state: "none",
      daysRemaining: null,
      label: "No callback scheduled",
      shortLabel: "—",
      isOverdue: false,
    };
  }

  const due = new Date(dueAtIso);
  if (Number.isNaN(due.getTime())) {
    return {
      state: "none",
      daysRemaining: null,
      label: "—",
      shortLabel: "—",
      isOverdue: false,
    };
  }

  const dueDay = startOfIstDay(due);
  const today = startOfIstDay(new Date(now));
  const diffDays = Math.round((dueDay - today) / DAY_MS);

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      state: "overdue",
      daysRemaining: diffDays,
      label: `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue · ${formatCrmDateTime(dueAtIso)}`,
      shortLabel: `${overdueDays}d overdue`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return {
      state: "today",
      daysRemaining: 0,
      label: `Due today · ${formatCrmTime(dueAtIso)}`,
      shortLabel: `Today ${formatCrmTime(dueAtIso)}`,
      isOverdue: false,
    };
  }

  if (diffDays <= DUE_SOON_DAYS) {
    return {
      state: "due_soon",
      daysRemaining: diffDays,
      label: `Due in ${diffDays} day${diffDays === 1 ? "" : "s"} · ${formatCrmDate(dueAtIso)}`,
      shortLabel: `In ${diffDays}d`,
      isOverdue: false,
    };
  }

  return {
    state: "upcoming",
    daysRemaining: diffDays,
    label: `Next callback in ${diffDays} days · ${formatCrmDate(dueAtIso)}`,
    shortLabel: `In ${diffDays}d`,
    isOverdue: false,
  };
}

/** Tailwind classes for callback urgency surfaces */
export function callbackUrgencyClasses(state: CallbackDisplayState): {
  shell: string;
  text: string;
  icon: string;
} {
  switch (state) {
    case "overdue":
      return {
        shell: "border-red-300/90 bg-red-50/90 dark:border-red-500/45 dark:bg-red-950/35",
        text: "text-red-800 dark:text-red-200",
        icon: "text-red-600 dark:text-red-400",
      };
    case "today":
    case "due_soon":
      return {
        shell: "border-amber-300/90 bg-amber-50/90 dark:border-amber-500/45 dark:bg-amber-950/35",
        text: "text-amber-950 dark:text-amber-100",
        icon: "text-amber-700 dark:text-amber-300",
      };
    case "upcoming":
      return {
        shell: "border-sky-300/90 bg-sky-50/90 dark:border-sky-500/40 dark:bg-sky-950/30",
        text: "text-sky-900 dark:text-sky-100",
        icon: "text-sky-700 dark:text-sky-300",
      };
    default:
      return {
        shell: "border-slate-200/90 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.04]",
        text: "text-slate-600 dark:text-slate-400",
        icon: "text-slate-500",
      };
  }
}
