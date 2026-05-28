"use client";

import Link from "next/link";
import useSWR from "swr";

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

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card title="Today follow-ups">
        {today.length === 0 ? <p className="text-xs text-slate-500">No follow-ups due today.</p> : null}
        {today.slice(0, 5).map((r) => (
          <Link key={r.id} href={`/customers?lead=${encodeURIComponent(r.lead_id)}`} className="block py-1 text-xs hover:underline">
            {r.title} · {new Date(r.due_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </Link>
        ))}
      </Card>
      <Card title="Overdue follow-ups">
        {overdue.length === 0 ? <p className="text-xs text-slate-500">No overdue follow-ups.</p> : null}
        {overdue.slice(0, 5).map((r) => (
          <Link key={r.id} href={`/customers?lead=${encodeURIComponent(r.lead_id)}`} className="block py-1 text-xs text-rose-700 hover:underline dark:text-rose-300">
            {r.title} · {new Date(r.due_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </Link>
        ))}
      </Card>
      <Card title="Upcoming visits">
        {upcoming.length === 0 ? <p className="text-xs text-slate-500">No visits in next 7 days.</p> : null}
        {upcoming.slice(0, 5).map((v) => (
          <Link key={v.id} href={`/customers?lead=${encodeURIComponent(v.lead_id)}`} className="block py-1 text-xs hover:underline">
            {new Date(v.scheduled_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            {v.location ? ` · ${v.location}` : ""}
          </Link>
        ))}
      </Card>
    </div>
  );
}
