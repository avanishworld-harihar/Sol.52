"use client";

import Link from "next/link";
import useSWR from "swr";
import { AlarmClock, CalendarClock } from "lucide-react";
import { describeCallback } from "@/lib/crm-callback-display";
import { formatCrmDate, formatCrmDateTime, formatCrmTime } from "@/lib/crm-datetime";

type WidgetReminder = {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  priority: string;
  followup_type: string;
  status: string;
  notes?: string | null;
};

type WidgetVisit = {
  id: string;
  lead_id: string;
  scheduled_at: string;
  visit_status: string;
  summary?: string | null;
  location?: string | null;
};

type WidgetPayload = {
  today: WidgetReminder[];
  overdue: WidgetReminder[];
  upcoming: WidgetReminder[];
  upcomingVisits: WidgetVisit[];
  counts?: { overdue: number; today: number; upcoming: number };
};

async function fetchWidgets(): Promise<WidgetPayload> {
  const res = await fetch("/api/followups/widgets", { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: WidgetPayload; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "widget_load_failed");
  return (
    json.data ?? {
      today: [],
      overdue: [],
      upcoming: [],
      upcomingVisits: [],
      counts: { overdue: 0, today: 0, upcoming: 0 },
    }
  );
}

function CallbackRow({
  reminder,
  tone,
}: {
  reminder: WidgetReminder;
  tone: "overdue" | "today" | "upcoming";
}) {
  const info = describeCallback(reminder.due_at);
  const className =
    tone === "overdue"
      ? "border-rose-300/80 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200"
      : tone === "today"
        ? "border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100"
        : "border-sky-200/80 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-950/25 dark:text-sky-100";

  return (
    <Link
      href={`/customers?lead=${encodeURIComponent(reminder.lead_id)}`}
      className={`mb-1.5 block rounded-lg border px-2.5 py-2 transition ${className}`}
    >
      <p className="truncate text-xs font-bold">{reminder.title}</p>
      <p className="mt-0.5 text-[10px] font-semibold opacity-90">
        {tone === "today" ? formatCrmTime(reminder.due_at) : info.shortLabel}
        {reminder.notes ? ` · ${reminder.notes}` : ""}
      </p>
    </Link>
  );
}

function Panel({
  title,
  count,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  count: number;
  icon: typeof AlarmClock;
  tone: "rose" | "amber" | "sky" | "teal";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "amber"
        ? "text-amber-800 dark:text-amber-200"
        : tone === "sky"
          ? "text-sky-800 dark:text-sky-200"
          : "text-teal-800 dark:text-teal-200";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </p>
        {count > 0 ? (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Smart Callback command center — overdue, today, and upcoming future callbacks. */
export function DashboardFollowupWidgets() {
  const { data } = useSWR<WidgetPayload>("/api/followups/widgets", fetchWidgets, {
    dedupingInterval: 30_000,
    revalidateOnFocus: true,
  });

  const today = data?.today ?? [];
  const overdue = data?.overdue ?? [];
  const upcoming = data?.upcoming ?? [];
  const visits = data?.upcomingVisits ?? [];

  const orderedOverdue = [...overdue].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  const orderedToday = [...today].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  const orderedUpcoming = [...upcoming].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  return (
    <section className="space-y-2" aria-label="Smart callbacks">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Smart callbacks</h2>
        <Link href="/customers" className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-300">
          All customers →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Overdue" count={overdue.length} icon={AlarmClock} tone="rose">
          {orderedOverdue.length === 0 ? (
            <p className="text-xs text-slate-500">No overdue callbacks.</p>
          ) : (
            orderedOverdue.slice(0, 5).map((r) => <CallbackRow key={r.id} reminder={r} tone="overdue" />)
          )}
        </Panel>
        <Panel title="Today" count={today.length} icon={AlarmClock} tone="amber">
          {orderedToday.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing due today.</p>
          ) : (
            orderedToday.slice(0, 5).map((r) => <CallbackRow key={r.id} reminder={r} tone="today" />)
          )}
        </Panel>
        <Panel title="Upcoming" count={upcoming.length} icon={CalendarClock} tone="sky">
          {orderedUpcoming.length === 0 ? (
            <p className="text-xs text-slate-500">No callbacks in next 90 days.</p>
          ) : (
            orderedUpcoming.slice(0, 5).map((r) => <CallbackRow key={r.id} reminder={r} tone="upcoming" />)
          )}
        </Panel>
        <Panel title="Site visits (7d)" count={visits.length} icon={CalendarClock} tone="teal">
          {visits.length === 0 ? (
            <p className="text-xs text-slate-500">No visits scheduled.</p>
          ) : (
            visits.slice(0, 5).map((v) => (
              <Link
                key={v.id}
                href={`/customers?lead=${encodeURIComponent(v.lead_id)}`}
                className="mb-1.5 block rounded-lg border border-teal-200/80 bg-teal-50 px-2.5 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-950/25 dark:text-teal-100"
              >
                {formatCrmDateTime(v.scheduled_at)}
                {v.location ? ` · ${v.location}` : ""}
              </Link>
            ))
          )}
        </Panel>
      </div>
    </section>
  );
}
