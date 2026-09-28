"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlarmClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  X,
} from "lucide-react";
import { formatCrmTime } from "@/lib/crm-datetime";
import { cn } from "@/lib/utils";
import type { WidgetReminder, WidgetVisit } from "@/components/dashboard-followup-widgets";

type CalendarEvent = {
  id: string;
  dateKey: string;
  at: string;
  title: string;
  subtitle: string;
  kind: "reminder" | "overdue" | "visit";
};

type AgendaCalendarDialogProps = {
  open: boolean;
  selectedDay: string;
  reminders: WidgetReminder[];
  overdue: WidgetReminder[];
  visits: WidgetVisit[];
  onClose: () => void;
  onSelectDay: (dateKey: string) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKeyFromParts(year: number, month: number, date: number) {
  return `${year}-${pad(month + 1)}-${pad(date)}`;
}

function dateFromKey(value: string) {
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date, 12);
}

function eventDateKey(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function makeMonthCells(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1, 12).getDay();
  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(year, month, index - firstWeekday + 1, 12);
    return {
      key: dateKeyFromParts(value.getFullYear(), value.getMonth(), value.getDate()),
      date: value,
      inMonth: value.getMonth() === month,
    };
  });
}

function makeMiniMonth(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1, 12).getDay();
  const days = new Date(year, month + 1, 0, 12).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= days ? day : null;
  });
}

export function AgendaCalendarDialog({
  open,
  selectedDay,
  reminders,
  overdue,
  visits,
  onClose,
  onSelectDay,
}: AgendaCalendarDialogProps) {
  const [view, setView] = useState<"month" | "year">("month");
  const [cursor, setCursor] = useState(() => dateFromKey(selectedDay));
  const [activeDay, setActiveDay] = useState(selectedDay);
  const todayKey = eventDateKey(new Date().toISOString());

  useEffect(() => {
    if (!open) return;
    const selected = dateFromKey(selectedDay);
    setActiveDay(selectedDay);
    setCursor(selected);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, selectedDay, onClose]);

  const events = useMemo<CalendarEvent[]>(() => [
    ...overdue.map((item) => ({
      id: `overdue-${item.id}`,
      dateKey: eventDateKey(item.due_at),
      at: item.due_at,
      title: item.subject_label || item.title,
      subtitle: item.lead_id ? item.title : item.subject_label || "Reminder",
      kind: "overdue" as const,
    })),
    ...reminders.map((item) => ({
      id: `reminder-${item.id}`,
      dateKey: eventDateKey(item.due_at),
      at: item.due_at,
      title: item.subject_label || item.title,
      subtitle: item.lead_id ? item.title : item.subject_label || "Reminder",
      kind: "reminder" as const,
    })),
    ...visits.map((item) => ({
      id: `visit-${item.id}`,
      dateKey: eventDateKey(item.scheduled_at),
      at: item.scheduled_at,
      title: item.subject_label || "Customer",
      subtitle: item.summary || "Site visit",
      kind: "visit" as const,
    })),
  ], [overdue, reminders, visits]);

  const eventsByDay = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    events.forEach((event) => groups.set(event.dateKey, [...(groups.get(event.dateKey) ?? []), event]));
    groups.forEach((items) => items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at)));
    return groups;
  }, [events]);

  const monthCells = useMemo(() => makeMonthCells(cursor), [cursor]);
  const activeEvents = eventsByDay.get(activeDay) ?? [];
  const activeDate = dateFromKey(activeDay);

  if (!open || typeof document === "undefined") return null;

  function moveMonth(amount: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
  }

  function moveYear(amount: number) {
    setCursor((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1, 12));
  }

  function goToday() {
    const today = dateFromKey(todayKey);
    setCursor(today);
    setActiveDay(todayKey);
    setView("month");
  }

  function chooseDay(key: string) {
    const next = dateFromKey(key);
    setActiveDay(key);
    if (next.getMonth() !== cursor.getMonth() || next.getFullYear() !== cursor.getFullYear()) setCursor(next);
  }

  return createPortal(
    <div className="fixed inset-0 z-[10200] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="agenda-calendar-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close calendar" />
      <div className="relative z-10 flex h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-white/70 bg-[#f8fafc] shadow-2xl sm:h-[min(860px,92vh)] sm:rounded-[2rem] dark:border-white/10 dark:bg-[#0c1017]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1017]/90 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Schedule overview</p>
            <h2 id="agenda-calendar-title" className="truncate text-lg font-black text-slate-950 dark:text-white sm:text-2xl">Calendar</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/10" aria-label="Calendar view">
              {(["month", "year"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setView(item)} className={cn("min-h-9 rounded-lg px-3 text-xs font-extrabold capitalize transition", view === item ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-300")}>{item}</button>
              ))}
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close calendar"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-[#0c1017]">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => view === "month" ? moveMonth(-1) : moveYear(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" aria-label={`Previous ${view}`}><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={() => view === "month" ? moveMonth(1) : moveYear(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" aria-label={`Next ${view}`}><ChevronRight className="h-5 w-5" /></button>
              </div>
              <h3 className="text-base font-black text-slate-950 dark:text-white sm:text-xl">{view === "month" ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}` : cursor.getFullYear()}</h3>
              <button type="button" onClick={goToday} className="min-h-10 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-extrabold text-teal-700 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-300">Today</button>
            </div>

            {view === "month" ? (
              <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 sm:px-5 sm:pb-5">
                <div className="grid shrink-0 grid-cols-7 border-b border-slate-200 dark:border-white/10">
                  {WEEKDAYS.map((day) => <div key={day} className="py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-400 sm:text-xs">{day.slice(0, 1)}<span className="hidden sm:inline">{day.slice(1)}</span></div>)}
                </div>
                <div className="grid min-h-[18rem] flex-1 grid-cols-7 grid-rows-6 overflow-hidden rounded-b-2xl border-x border-b border-slate-200 dark:border-white/10 sm:min-h-[31rem]">
                  {monthCells.map((cell) => {
                    const dayEvents = eventsByDay.get(cell.key) ?? [];
                    const active = activeDay === cell.key;
                    const today = todayKey === cell.key;
                    return (
                      <button key={cell.key} type="button" onClick={() => chooseDay(cell.key)} aria-pressed={active}
                        className={cn("group min-h-0 overflow-hidden border-r border-t border-slate-100 p-1 text-left transition first:border-t-0 [border-right-width:1px] hover:bg-teal-50/60 dark:border-white/[0.07] dark:hover:bg-teal-950/20 sm:p-2", active && "bg-teal-50 ring-2 ring-inset ring-teal-500 dark:bg-teal-950/25", !cell.inMonth && "bg-slate-50/80 text-slate-300 dark:bg-white/[0.015]")}
                      >
                        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm", today && "bg-rose-500 text-white", !today && active && "bg-teal-600 text-white", !today && !active && cell.inMonth && "text-slate-700 dark:text-slate-200", !cell.inMonth && "text-slate-300 dark:text-slate-600")}>{cell.date.getDate()}</span>
                        <div className="mt-0.5 hidden space-y-1 sm:block">
                          {dayEvents.slice(0, 2).map((event) => <EventPill key={event.id} event={event} />)}
                          {dayEvents.length > 2 ? <span className="block px-1 text-[9px] font-bold text-slate-400">+{dayEvents.length - 2} more</span> : null}
                        </div>
                        {dayEvents.length ? <div className="mt-1 flex items-center justify-center gap-0.5 sm:hidden">{dayEvents.slice(0, 3).map((event) => <span key={event.id} className={cn("h-1.5 w-1.5 rounded-full", event.kind === "visit" ? "bg-indigo-500" : event.kind === "overdue" ? "bg-rose-500" : "bg-teal-500")} />)}</div> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto px-3 pb-4 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:grid-cols-4">
                {MONTHS.map((monthName, month) => {
                  const cells = makeMiniMonth(cursor.getFullYear(), month);
                  return (
                    <button key={monthName} type="button" onClick={() => { setCursor(new Date(cursor.getFullYear(), month, 1, 12)); setView("month"); }} className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.025]">
                      <span className={cn("text-sm font-black", month === dateFromKey(todayKey).getMonth() && cursor.getFullYear() === dateFromKey(todayKey).getFullYear() ? "text-rose-500" : "text-slate-900 dark:text-white")}>{monthName.slice(0, 3)}</span>
                      <span className="mt-2 grid grid-cols-7 gap-y-1 text-center">
                        {WEEKDAYS.map((day) => <span key={day} className="text-[8px] font-bold text-slate-400">{day[0]}</span>)}
                        {cells.map((day, index) => {
                          const key = day ? dateKeyFromParts(cursor.getFullYear(), month, day) : "";
                          const count = key ? (eventsByDay.get(key)?.length ?? 0) : 0;
                          return <span key={index} className={cn("relative mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-slate-600 dark:text-slate-300", key === todayKey && "bg-rose-500 text-white", key === activeDay && key !== todayKey && "bg-teal-600 text-white")}>{day}{count > 0 ? <span className={cn("absolute -bottom-0.5 h-1 w-1 rounded-full", key === todayKey || key === activeDay ? "bg-white" : "bg-teal-500")} /> : null}</span>;
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="max-h-[13rem] shrink-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.025] sm:p-4 lg:max-h-none lg:border-l lg:border-t-0 lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">Selected day</p>
                <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{activeDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{activeEvents.length ? `${activeEvents.length} scheduled item${activeEvents.length > 1 ? "s" : ""}` : "No reminders or visits"}</p>
              </div>
              <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-teal-700 shadow-sm dark:bg-white/10 dark:text-teal-300">{activeEvents.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {activeEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                  <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", event.kind === "visit" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15" : event.kind === "overdue" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15" : "bg-teal-100 text-teal-600 dark:bg-teal-500/15")}>{event.kind === "visit" ? <MapPin className="h-3.5 w-3.5" /> : <AlarmClock className="h-3.5 w-3.5" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">{event.title}</span><span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">{event.subtitle}</span><span className={cn("mt-1 flex items-center gap-1 text-[10px] font-bold", event.kind === "overdue" ? "text-rose-600" : "text-slate-500")}><Clock3 className="h-3 w-3" />{event.kind === "overdue" ? "Overdue · " : ""}{formatCrmTime(event.at)}</span></span>
                </div>
              ))}
              {!activeEvents.length ? <div className="hidden rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center dark:border-white/10 lg:block"><CalendarDays className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-xs font-bold text-slate-500">This day is clear</p></div> : null}
            </div>
            <button type="button" onClick={() => { onSelectDay(activeDay); onClose(); }} className="sticky bottom-0 mt-4 min-h-11 w-full rounded-xl bg-slate-950 px-4 text-xs font-extrabold text-white shadow-lg transition hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-200">Show this day in agenda</button>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EventPill({ event }: { event: CalendarEvent }) {
  return (
    <span className={cn("block truncate rounded-md px-1.5 py-1 text-[9px] font-bold leading-none", event.kind === "visit" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : event.kind === "overdue" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300")}>
      {formatCrmTime(event.at)} · {event.title}
    </span>
  );
}
