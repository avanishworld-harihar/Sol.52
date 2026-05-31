/** CRM timestamps: stored UTC in DB, displayed as Asia/Kolkata (IST). */
export const CRM_TIMEZONE = "Asia/Kolkata";

const TZ = { timeZone: CRM_TIMEZONE } as const;

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function istDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", TZ);
}

function normalizeHour(hour: string): string {
  if (hour === "24") return "00";
  return hour.padStart(2, "0");
}

/** Date only — e.g. "29 May 2026" */
export function formatCrmDate(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    ...TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Time only — e.g. "5:30 PM" */
export function formatCrmTime(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", {
    ...TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Date + time in IST — e.g. "29 May 2026, 5:30 PM" */
export function formatCrmDateTime(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return "—";
  return d.toLocaleString("en-IN", {
    ...TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Timeline day group — Today / Yesterday / date in IST */
export function formatCrmDayLabel(iso: string): string {
  const d = parseIso(iso);
  if (!d) return "Unknown";
  const key = istDateKey(d);
  const todayKey = istDateKey(new Date());
  if (key === todayKey) return "Today";
  const yesterdayKey = istDateKey(new Date(Date.now() - 86_400_000));
  if (key === yesterdayKey) return "Yesterday";
  return formatCrmDate(iso);
}

/** CRM list cards — short date in IST */
export function formatCrmShortDate(iso: string | null | undefined, locale?: string): string {
  const d = parseIso(iso);
  if (!d) return "—";
  const loc = locale === "hi" ? "hi-IN" : locale === "ta" ? "ta-IN" : "en-IN";
  return d.toLocaleDateString(loc, {
    ...TZ,
    day: "numeric",
    month: "short",
  });
}

/** Current IST value for `<input type="datetime-local" />` */
export function crmNowDatetimeLocal(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    ...TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${normalizeHour(get("hour"))}:${get("minute")}`;
}

/** Parse datetime-local input as IST → UTC ISO for API storage */
export function crmDatetimeLocalToIso(local: string): string {
  const trimmed = local.trim();
  if (!trimmed) return new Date().toISOString();
  const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  return new Date(`${normalized}+05:30`).toISOString();
}
