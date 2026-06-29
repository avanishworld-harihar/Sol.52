import { formatCrmDate, formatCrmDateTime, formatCrmTime } from "@/lib/crm-datetime";

export type CallbackDisplayState = "none" | "overdue" | "today" | "upcoming";

export type CallbackDisplay = {
  state: CallbackDisplayState;
  daysRemaining: number | null;
  label: string;
  shortLabel: string;
  isOverdue: boolean;
};

const DAY_MS = 86_400_000;

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
      label: `Today · ${formatCrmTime(dueAtIso)}`,
      shortLabel: `Today ${formatCrmTime(dueAtIso)}`,
      isOverdue: false,
    };
  }

  return {
    state: "upcoming",
    daysRemaining: diffDays,
    label: `In ${diffDays} day${diffDays === 1 ? "" : "s"} · ${formatCrmDate(dueAtIso)}`,
    shortLabel: `In ${diffDays}d`,
    isOverdue: false,
  };
}
