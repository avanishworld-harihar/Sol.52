import type { CommandActionItem, CommandFilterId, CommandUrgency } from "@/lib/crm-command-center-types";

export type UrgencyVisual = {
  label: string;
  badge: string;
  row: string;
  accent: string;
  pulse?: boolean;
};

export const URGENCY_VISUAL: Record<CommandUrgency, UrgencyVisual> = {
  critical: {
    label: "Critical",
    badge:
      "border-red-500/80 bg-red-500 text-white shadow-sm shadow-red-500/25 dark:border-red-400/70 dark:bg-red-600",
    row: "border-l-[3px] border-l-red-500 bg-red-50/40 dark:bg-red-950/20",
    accent: "from-red-500/20 to-red-400/5",
    pulse: true,
  },
  overdue: {
    label: "Overdue",
    badge:
      "border-orange-500/70 bg-orange-100 text-orange-950 dark:border-orange-400/50 dark:bg-orange-950/50 dark:text-orange-100",
    row: "border-l-[3px] border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/15",
    accent: "from-orange-500/18 to-orange-400/5",
  },
  today: {
    label: "Today",
    badge:
      "border-amber-500/70 bg-amber-100 text-amber-950 dark:border-amber-400/50 dark:bg-amber-950/45 dark:text-amber-100",
    row: "border-l-[3px] border-l-amber-500 bg-amber-50/25 dark:bg-amber-950/12",
    accent: "from-amber-500/16 to-amber-400/5",
  },
  hot: {
    label: "Hot Lead",
    badge:
      "border-violet-500/70 bg-violet-100 text-violet-950 dark:border-violet-400/50 dark:bg-violet-950/45 dark:text-violet-100",
    row: "border-l-[3px] border-l-violet-500 bg-violet-50/25 dark:bg-violet-950/12",
    accent: "from-violet-500/16 to-violet-400/5",
  },
  upcoming: {
    label: "Upcoming",
    badge:
      "border-slate-400/60 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-900/50 dark:text-slate-300",
    row: "border-l-[3px] border-l-slate-300 bg-white/60 dark:border-l-slate-600 dark:bg-white/[0.03]",
    accent: "from-sky-500/12 to-cyan-400/5",
  },
};

const CALLBACK_PRESET_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /3\s*months?/i, label: "3 months" },
  { pattern: /5\s*months?/i, label: "5 months" },
  { pattern: /after\s*monsoon/i, label: "after monsoon" },
  { pattern: /after\s*diwali/i, label: "after Diwali" },
  { pattern: /next\s*week/i, label: "next week" },
  { pattern: /tomorrow/i, label: "tomorrow" },
];

function daysBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.floor((toMs - fromMs) / 86_400_000));
}

function formatDaysAgo(days: number): string {
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${Math.round(days / 365)}y ago`;
}

export function inferCallbackIntelligence(
  title: string,
  notes: string | null | undefined,
  createdAt: string | null | undefined,
  nowMs: number
): string | null {
  const haystack = `${title} ${notes ?? ""}`;
  const preset = CALLBACK_PRESET_PATTERNS.find((p) => p.pattern.test(haystack));
  if (!preset) return null;
  const createdMs = createdAt ? Date.parse(createdAt) : NaN;
  if (!Number.isFinite(createdMs)) {
    return `Customer requested callback — ${preset.label}`;
  }
  const days = daysBetween(createdMs, nowMs);
  if (days < 3) return `Scheduled for ${preset.label}`;
  return `Callback scheduled today (customer requested ${preset.label}, ${formatDaysAgo(days)})`;
}

export function deriveActionTitle(
  kind: CommandActionItem["kind"],
  followupType: string,
  title: string
): string {
  const t = title.trim();
  if (kind === "visit_today" || kind === "visit_upcoming") return "Site visit";
  if (kind === "hot_proposal") return "Follow up — proposal viewed";
  if (kind === "hot_bill") return "Follow up — bill uploaded";
  if (kind === "payment_pending") return "Advance payment pending";
  if (followupType === "payment") return "Payment follow-up";
  if (followupType === "visit") return "Visit callback";
  if (followupType === "proposal") return "Proposal follow-up";
  if (t.toLowerCase().startsWith("callback")) return "Scheduled callback";
  if (kind === "reminder_overdue" || kind === "reminder_today") return "Call for decision";
  if (t.length > 0 && t.length <= 48) return t;
  return "Follow-up";
}

export function matchesFilter(action: CommandActionItem, filter: CommandFilterId): boolean {
  if (filter === "all") return true;
  if (filter === "critical") return action.urgency === "critical" || action.urgency === "overdue";
  if (filter === "today") return action.urgency === "today";
  if (filter === "hot") return action.urgency === "hot";
  if (filter === "upcoming") return action.urgency === "upcoming";
  return true;
}

export function countForFilter(actions: CommandActionItem[], filter: CommandFilterId): number {
  return actions.filter((a) => matchesFilter(a, filter)).length;
}
