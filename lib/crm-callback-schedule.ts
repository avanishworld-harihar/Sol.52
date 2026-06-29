/**
 * Smart Callback scheduling — preset dates for long-cycle solar leads.
 * All times default to 10:00 IST unless a custom datetime is chosen.
 */

import { crmDatetimeLocalToIso } from "@/lib/crm-datetime";

export type CallbackPresetId =
  | "tomorrow"
  | "next_week"
  | "in_3_months"
  | "in_5_months"
  | "after_monsoon"
  | "after_diwali"
  | "custom_date"
  | "custom_datetime";

export type CallbackPreset = {
  id: CallbackPresetId;
  label: string;
  hint?: string;
};

export const CALLBACK_PRESETS: CallbackPreset[] = [
  { id: "tomorrow", label: "Tomorrow", hint: "10:00 AM" },
  { id: "next_week", label: "Next week", hint: "7 days · 10 AM" },
  { id: "in_3_months", label: "In 3 months", hint: "Long-cycle callback" },
  { id: "in_5_months", label: "In 5 months", hint: "Long-cycle callback" },
  { id: "after_monsoon", label: "After monsoon", hint: "Late Sep · install season" },
  { id: "after_diwali", label: "After Diwali", hint: "Mid Nov · post-festival" },
  { id: "custom_date", label: "Pick date", hint: "Date only · 10 AM" },
  { id: "custom_datetime", label: "Date & time", hint: "Full control" },
];

/** One-tap presets shown prominently in schedule sheet */
export const QUICK_CALLBACK_PRESETS: CallbackPresetId[] = [
  "tomorrow",
  "next_week",
  "in_3_months",
  "custom_date",
];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istParts(d: Date): { y: number; m: number; day: number } {
  const s = new Date(d.getTime() + IST_OFFSET_MS);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth() + 1, day: s.getUTCDate() };
}

/** Build UTC Date from IST calendar date + hour/minute. */
function istDateTime(y: number, m: number, day: number, hour = 10, minute = 0): Date {
  const local = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return new Date(`${local}+05:30`);
}

function addMonths(base: Date, months: number): Date {
  const { y, m, day } = istParts(base);
  let nm = m - 1 + months;
  const ny = y + Math.floor(nm / 12);
  nm = ((nm % 12) + 12) % 12;
  const maxDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return istDateTime(ny, nm + 1, Math.min(day, maxDay), 10, 0);
}

/** Post-monsoon window — 30 Sep 10:00 IST (next occurrence). */
function nextAfterMonsoon(from: Date): Date {
  const { y } = istParts(from);
  const thisYear = istDateTime(y, 9, 30, 10, 0);
  if (thisYear.getTime() > from.getTime()) return thisYear;
  return istDateTime(y + 1, 9, 30, 10, 0);
}

/** Post-Diwali — 15 Nov 10:00 IST (next occurrence). */
function nextAfterDiwali(from: Date): Date {
  const { y } = istParts(from);
  const thisYear = istDateTime(y, 11, 15, 10, 0);
  if (thisYear.getTime() > from.getTime()) return thisYear;
  return istDateTime(y + 1, 11, 15, 10, 0);
}

export function resolveCallbackDueAt(
  preset: CallbackPresetId,
  opts?: { customLocal?: string; customDateOnly?: string }
): string {
  const now = new Date();

  switch (preset) {
    case "tomorrow": {
      const t = new Date(now.getTime() + 86_400_000);
      const { y, m, day } = istParts(t);
      return istDateTime(y, m, day, 10, 0).toISOString();
    }
    case "next_week": {
      const t = new Date(now.getTime() + 7 * 86_400_000);
      const { y, m, day } = istParts(t);
      return istDateTime(y, m, day, 10, 0).toISOString();
    }
    case "in_3_months":
      return addMonths(now, 3).toISOString();
    case "in_5_months":
      return addMonths(now, 5).toISOString();
    case "after_monsoon":
      return nextAfterMonsoon(now).toISOString();
    case "after_diwali":
      return nextAfterDiwali(now).toISOString();
    case "custom_date": {
      const raw = opts?.customDateOnly?.trim();
      if (!raw) return addMonths(now, 1).toISOString();
      return crmDatetimeLocalToIso(`${raw}T10:00`);
    }
    case "custom_datetime": {
      const raw = opts?.customLocal?.trim();
      if (!raw) return addMonths(now, 1).toISOString();
      return crmDatetimeLocalToIso(raw);
    }
    default:
      return addMonths(now, 1).toISOString();
  }
}

export function defaultCallbackTitle(preset: CallbackPresetId, note?: string): string {
  const presetLabel = CALLBACK_PRESETS.find((p) => p.id === preset)?.label ?? "Callback";
  const trimmed = note?.trim();
  if (trimmed) return `Callback — ${trimmed}`;
  return `Callback — ${presetLabel}`;
}
