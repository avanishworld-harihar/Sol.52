"use client";

import Link from "next/link";
import useSWR from "swr";
import { ClipboardCheck, MapPin, Phone, Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { FieldAssignment, FieldLeadSummary, WorkRole } from "@/lib/field-work-types";
import { FIELD_ASSIGNMENT_LABELS, FIELD_STATUS_LABELS } from "@/lib/field-work-types";
import { cn } from "@/lib/utils";

type DashboardData = {
  leads: FieldLeadSummary[];
  assignments: FieldAssignment[];
  currentUserId: string | null;
  permissions: { canSeeDirectory: boolean; canOperate: boolean; isAdmin: boolean; workRole: WorkRole | null };
};

async function fetcher(url: string): Promise<DashboardData> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json() as { ok?: boolean; data?: DashboardData; error?: string };
  if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error ?? "Could not load field work.");
  return payload.data;
}

function dueLabel(value?: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function FieldWorkDashboard() {
  const { data, error, isLoading } = useSWR<DashboardData>("/api/field-work", fetcher);
  const [tab, setTab] = useState<"mine" | "directory">("mine");
  const [query, setQuery] = useState("");

  const leadsById = useMemo(() => new Map((data?.leads ?? []).map((lead) => [lead.id, lead])), [data?.leads]);
  const myAssignments = useMemo(() => (data?.assignments ?? []).filter((item) =>
    item.assigned_user_id === data?.currentUserId && item.status !== "cancelled"
  ), [data?.assignments, data?.currentUserId]);
  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data?.leads ?? [];
    return (data?.leads ?? []).filter((lead) => [lead.name, lead.consumer_name, lead.phone, lead.city, lead.location]
      .some((value) => String(value ?? "").toLowerCase().includes(normalized)));
  }, [data?.leads, query]);

  if (isLoading) return <p className="py-16 text-center text-sm font-semibold text-muted-foreground">Loading field work…</p>;
  if (error || !data) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">{error instanceof Error ? error.message : "Could not load field work."}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-20">
      <section className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#082f49,#0f766e)] p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Field operations</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Visits, surveys and documents</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-200">Sales ownership stays separate. This workspace only contains on-site work and updates.</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-2xl font-black">{myAssignments.filter((item) => !["completed", "cancelled"].includes(item.status)).length}</p>
            <p className="text-xs font-bold text-teal-100">Open jobs assigned to me</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2">
        <button type="button" onClick={() => setTab("mine")} className={cn("rounded-xl px-3 py-3 text-sm font-extrabold", tab === "mine" ? "bg-teal-600 text-white" : "hover:bg-muted")}>My Field Visits</button>
        <button type="button" onClick={() => setTab("directory")} className={cn("rounded-xl px-3 py-3 text-sm font-extrabold", tab === "directory" ? "bg-teal-600 text-white" : "hover:bg-muted")}>Organization Leads</button>
      </div>

      {tab === "mine" ? (
        <section className="space-y-3">
          {myAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <ClipboardCheck className="mx-auto h-8 w-8 text-teal-600" />
              <p className="mt-3 font-extrabold">No field visit assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">New survey or document jobs will appear here.</p>
            </div>
          ) : myAssignments.map((assignment) => {
            const lead = leadsById.get(assignment.lead_id);
            if (!lead) return null;
            const overdue = Boolean(assignment.due_at && new Date(assignment.due_at).getTime() < Date.now() && assignment.status !== "completed");
            return (
              <Link key={assignment.id} href={`/field-work/${lead.id}`} className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black">{lead.consumer_name || lead.name}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{FIELD_ASSIGNMENT_LABELS[assignment.assignment_type]} · {FIELD_STATUS_LABELS[assignment.status]}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase", overdue ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-800")}>{overdue ? "Overdue" : assignment.priority}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[lead.location, lead.city].filter(Boolean).join(", ") || "Location pending"}</span>
                  <span>{dueLabel(assignment.due_at)}</span>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, phone or location" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-teal-500" />
          </div>
          {!data.permissions.canSeeDirectory ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Organization directory is available to Field, Hybrid and Admin members.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredLeads.map((lead) => {
                const active = (data.assignments ?? []).find((item) => item.lead_id === lead.id && !["completed", "cancelled"].includes(item.status));
                return (
                  <Link key={lead.id} href={`/field-work/${lead.id}`} className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-teal-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate font-black">{lead.consumer_name || lead.name}</p><p className="truncate text-xs font-semibold text-muted-foreground">{lead.name}</p></div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold uppercase text-slate-600">{lead.survey_status?.replace(/_/g, " ") || "not started"}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{[lead.location, lead.city, lead.state].filter(Boolean).join(", ") || "Location pending"}</p>
                      {lead.phone ? <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lead.phone}</p> : null}
                      {active ? <p className="flex items-center gap-1.5 font-bold text-teal-700"><UsersRound className="h-3.5 w-3.5" />{FIELD_ASSIGNMENT_LABELS[active.assignment_type]} assigned</p> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
