"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { AlarmClock, ArrowRight, CalendarDays, Clock3, MapPin, MessageSquareText } from "lucide-react";
import { formatCrmTime } from "@/lib/crm-datetime";
import { cn } from "@/lib/utils";
import { CreateReminderDialog } from "@/components/agenda/create-reminder-dialog";
import { patchReminder } from "@/lib/followup-client";
import { AgendaCalendarDialog } from "@/components/agenda/agenda-calendar-dialog";

export type WidgetReminder = {
  id: string; lead_id: string | null; title: string; due_at: string; priority: string;
  followup_type: string; status: string; notes?: string | null;
  subject_type?: "customer" | "project" | "general"; subject_label?: string | null;
};
export type WidgetVisit = {
  id: string; lead_id: string; scheduled_at: string; visit_status: string;
  summary?: string | null; location?: string | null; subject_label?: string | null;
};
export type WidgetPayload = {
  today: WidgetReminder[]; overdue: WidgetReminder[]; upcoming: WidgetReminder[];
  upcomingVisits: WidgetVisit[]; counts?: { overdue: number; today: number; upcoming: number };
};

async function fetchWidgets(url: string): Promise<WidgetPayload> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: WidgetPayload; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "widget_load_failed");
  return json.data ?? { today: [], overdue: [], upcoming: [], upcomingVisits: [] };
}

function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function makeDays(count = 7) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    return {
      key: dayKey(date), date,
      day: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
      number: date.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
      month: date.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }),
    };
  });
}

/** iPad-inspired unified agenda for callbacks and site visits. */
export function DashboardFollowupWidgets({ expanded = false }: { expanded?: boolean }) {
  const { mutate: mutateGlobal } = useSWRConfig();
  // A date picker can jump beyond the seven-day strip, so retain the full
  // one-year agenda in both dashboard and expanded views.
  const widgetsKey = "/api/followups/widgets?view=all";
  const { data, isLoading, mutate: refreshWidgets } = useSWR<WidgetPayload>(widgetsKey, fetchWidgets, {
    dedupingInterval: 30_000, revalidateOnFocus: true,
  });
  const days = useMemo(() => makeDays(expanded ? 14 : 7), [expanded]);
  const [selectedDay, setSelectedDay] = useState(days[0]?.key ?? dayKey(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const reminders = useMemo(
    () => [...(data?.today ?? []), ...(data?.upcoming ?? [])].sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at)),
    [data]
  );
  const selectedReminders = reminders.filter((item) => dayKey(item.due_at) === selectedDay);
  const selectedVisits = (data?.upcomingVisits ?? []).filter((item) => dayKey(item.scheduled_at) === selectedDay);
  const overdue = [...(data?.overdue ?? [])].sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at));
  const selectedOverdue = overdue.filter((item) => dayKey(item.due_at) === selectedDay);
  const selectedMeta = useMemo(() => {
    const inStrip = days.find((day) => day.key === selectedDay);
    if (inStrip) return inStrip;
    const date = new Date(`${selectedDay}T12:00:00+05:30`);
    return {
      key: selectedDay,
      date,
      day: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
      number: date.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
      month: date.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }),
    };
  }, [days, selectedDay]);
  const isToday = selectedDay === days[0]?.key;
  const totalPending = reminders.length + overdue.length;

  async function completeReminder(reminderId: string) {
    await patchReminder(reminderId, { status: "completed" });
    await refreshWidgets();
    void mutateGlobal("crm-command-center");
    void mutateGlobal("/api/customers");
  }

  function openCalendar(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setCalendarOpen(true);
  }

  return (
    <section aria-labelledby="agenda-heading" className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_20px_55px_-32px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#0c1017]">
      <div className="grid min-h-[24rem] grid-cols-1 md:grid-cols-[minmax(16rem,0.85fr)_minmax(20rem,1.25fr)]">
        <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 p-4 sm:p-5 md:border-b-0 md:border-r dark:border-white/10 dark:from-white/[0.05] dark:via-white/[0.02] dark:to-teal-950/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Today &amp; schedule</p>
              <h2 id="agenda-heading" className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl dark:text-white">Your agenda</h2>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Callbacks and visits, in one place.</p>
            </div>
            <button type="button" onClick={openCalendar} className="group flex min-h-11 items-center gap-2 rounded-2xl border border-teal-200 bg-white px-2.5 text-teal-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md dark:border-teal-500/25 dark:bg-white/5 dark:text-teal-300" aria-label={`Open calendar. ${totalPending} pending reminders`}>
              <CalendarDays className="h-4 w-4" aria-hidden />
              <span className="hidden text-xs font-extrabold sm:inline">Calendar</span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-teal-600 px-1.5 text-[10px] font-black tabular-nums text-white">{totalPending}</span>
            </button>
          </div>

          <div className="-mx-1 mt-5 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible xl:grid-cols-7">
            {days.map((item, index) => {
              const active = item.key === selectedDay;
              const count = reminders.filter((r) => dayKey(r.due_at) === item.key).length + overdue.filter((r) => dayKey(r.due_at) === item.key).length + (data?.upcomingVisits ?? []).filter((v) => dayKey(v.scheduled_at) === item.key).length;
              return (
                <button key={item.key} type="button" onClick={() => setSelectedDay(item.key)} aria-pressed={active}
                  className={cn("relative min-w-[4.25rem] snap-start rounded-2xl border px-2 py-2.5 text-center transition active:scale-[0.98] md:min-w-0", active ? "border-slate-900 bg-slate-900 text-white shadow-lg dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200/90 bg-white/80 text-slate-600 hover:border-teal-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300")}
                >
                  <span className="block text-[9px] font-extrabold uppercase tracking-wide">{index === 0 ? "Today" : item.day}</span>
                  <span className="mt-0.5 block text-lg font-black leading-none tabular-nums">{item.number}</span>
                  {count > 0 ? <span className={cn("mx-auto mt-1.5 block h-1.5 w-1.5 rounded-full", active ? "bg-teal-300 dark:bg-teal-600" : "bg-teal-500")} /> : <span className="mt-1.5 block h-1.5" />}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={openCalendar} className="mt-4 w-full rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 text-left transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-white/10 dark:bg-black/10 dark:hover:border-teal-500/30 dark:hover:bg-teal-950/20">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-teal-600 dark:text-teal-300" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{isToday ? "Today" : selectedMeta?.day}, {selectedMeta?.number} {selectedMeta?.month}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{selectedReminders.length + selectedOverdue.length} reminders · {selectedVisits.length} visits</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700 dark:text-teal-300">Open calendar <ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Reminders</p>
              <h3 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">{isToday ? "Focus for today" : `${selectedMeta?.day}'s plan`}</h3>
            </div>
            <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start">
              <CreateReminderDialog compact initialDate={selectedDay} triggerLabel="Plan this day" />
              {!expanded ? <Link href="/agenda" className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/30">Full agenda <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link> : null}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {isLoading ? Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[4.25rem] animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />) : (
              <>
                {isToday && overdue.slice(0, 3).map((item) => <AgendaReminder key={item.id} reminder={item} overdue onComplete={completeReminder} />)}
                {!isToday && selectedOverdue.map((item) => <AgendaReminder key={item.id} reminder={item} overdue onComplete={completeReminder} />)}
                {selectedReminders.map((item) => <AgendaReminder key={item.id} reminder={item} onComplete={completeReminder} />)}
                {selectedVisits.map((item) => <AgendaVisit key={item.id} visit={item} />)}
                {(isToday ? overdue.length : selectedOverdue.length) + selectedReminders.length + selectedVisits.length === 0 ? (
                  <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center dark:border-white/10 dark:bg-white/[0.025]">
                    <CalendarDays className="h-7 w-7 text-teal-500" aria-hidden />
                    <p className="mt-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">Your schedule is clear</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">Schedule a callback from any customer card and it will appear here.</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      <AgendaCalendarDialog
        open={calendarOpen}
        selectedDay={selectedDay}
        reminders={reminders}
        overdue={overdue}
        visits={data?.upcomingVisits ?? []}
        onClose={() => setCalendarOpen(false)}
        onSelectDay={setSelectedDay}
      />
    </section>
  );
}

function AgendaReminder({ reminder, overdue = false, onComplete }: { reminder: WidgetReminder; overdue?: boolean; onComplete: (id: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const className = cn("group flex min-h-[4.25rem] items-center gap-3 rounded-2xl border px-3 py-2.5 transition", overdue ? "border-rose-200 bg-rose-50/80 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/20" : "border-slate-200/80 bg-white hover:border-teal-300 hover:bg-teal-50/50 dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-teal-950/20");
  const content = <>
      <button type="button" disabled={busy} onClick={() => { setBusy(true); void onComplete(reminder.id).finally(() => setBusy(false)); }} className={cn("h-5 w-5 shrink-0 rounded-full border-2 bg-white transition hover:scale-110 disabled:animate-pulse dark:bg-transparent", overdue ? "border-rose-400" : "border-slate-300 hover:border-teal-500 dark:border-slate-600")} aria-label={`Mark ${reminder.title} complete`} />
      <span className="min-w-0 flex-1">
        {reminder.lead_id ? <Link href={`/customers/${encodeURIComponent(reminder.lead_id)}`} className="block truncate text-sm font-extrabold text-slate-900 hover:text-teal-700 dark:text-slate-50 dark:hover:text-teal-300">{reminder.subject_label || "Customer"}</Link> : <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-slate-50">{reminder.title}</span>}
        {reminder.lead_id ? <span className="mt-0.5 block truncate text-xs font-semibold text-slate-700 dark:text-slate-300"><MessageSquareText className="mr-1 inline h-3 w-3" aria-hidden />{reminder.title}</span> : null}
        <span className={cn("mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold", overdue ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400")}><Clock3 className="h-3 w-3 shrink-0" aria-hidden />{overdue ? "Overdue · " : ""}{formatCrmTime(reminder.due_at)}{!reminder.lead_id && reminder.subject_label ? ` · ${reminder.subject_label}` : ""}{reminder.notes ? ` · Note: ${reminder.notes}` : ""}</span>
      </span>
      <AlarmClock className={cn("h-4 w-4 shrink-0", overdue ? "text-rose-500" : "text-teal-500")} aria-hidden />
    </>;
  return <div className={className}>{content}</div>;
}

function AgendaVisit({ visit }: { visit: WidgetVisit }) {
  return (
    <Link href={`/customers/${encodeURIComponent(visit.lead_id)}`} className="group flex min-h-[4.25rem] items-center gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 px-3 py-2.5 transition hover:bg-indigo-100/70 dark:border-indigo-500/30 dark:bg-indigo-950/20">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><MapPin className="h-4 w-4" aria-hidden /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-900 dark:text-slate-50">{visit.subject_label || "Customer"}</span><span className="mt-0.5 block truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{visit.summary || "Site visit"}</span><span className="mt-0.5 block truncate text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">{formatCrmTime(visit.scheduled_at)}{visit.location ? ` · ${visit.location}` : ""}</span></span>
    </Link>
  );
}
