"use client";

import Link from "next/link";
import useSWR from "swr";
import { formatCrmDate, formatCrmDateTime, formatCrmTime } from "@/lib/crm-datetime";

type WidgetReminder = {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  priority: string;
  followup_type: string;
  status: string;
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
  upcomingVisits: WidgetVisit[];
};

async function fetchWidgets(): Promise<WidgetPayload> {
  const res = await fetch("/api/followups/widgets", { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: WidgetPayload; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "widget_load_failed");
  return json.data ?? { today: [], overdue: [], upcomingVisits: [] };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</p>
      {children}
    </div>
  );
}

export function DashboardFollowupWidgets() {
  const { data } = useSWR<WidgetPayload>("/api/followups/widgets", fetchWidgets, {
    dedupingInterval: 30_000,
    revalidateOnFocus: true,
  });
  const today = data?.today ?? [];
  const overdue = data?.overdue ?? [];
  const upcoming = data?.upcomingVisits ?? [];

  const orderedOverdue = [...overdue].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  const orderedToday = [...today].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card title="Today follow-ups">
        {orderedToday.length === 0 ? <p className="text-xs text-slate-500">No follow-ups due today.</p> : null}
        {orderedToday.slice(0, 5).map((r) => (
          <Link
            key={r.id}
            href={`/customers?lead=${encodeURIComponent(r.lead_id)}`}
            className="mb-1 block rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            {r.title} · {formatCrmTime(r.due_at)}
          </Link>
        ))}
      </Card>
      <Card title="Overdue follow-ups">
        {orderedOverdue.length === 0 ? <p className="text-xs text-slate-500">No overdue follow-ups.</p> : null}
        {orderedOverdue.slice(0, 5).map((r) => (
          <Link
            key={r.id}
            href={`/customers?lead=${encodeURIComponent(r.lead_id)}`}
            className="mb-1 block rounded-lg border border-rose-300/80 bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            {r.title} · {formatCrmDate(r.due_at)}
          </Link>
        ))}
      </Card>
      <Card title="Upcoming visits">
        {upcoming.length === 0 ? <p className="text-xs text-slate-500">No visits in next 7 days.</p> : null}
        {upcoming.slice(0, 5).map((v) => (
          <Link
            key={v.id}
            href={`/customers?lead=${encodeURIComponent(v.lead_id)}`}
            className="mb-1 block rounded-lg border border-sky-200/80 bg-sky-50 px-2.5 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/40"
          >
            {formatCrmDateTime(v.scheduled_at)}
            {v.location ? ` · ${v.location}` : ""}
          </Link>
        ))}
      </Card>
    </div>
  );
}
