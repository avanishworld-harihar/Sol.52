"use client";

import useSWR from "swr";
import { CalendarClock, MapPinned, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-center";
import type { FieldAssignment, FieldAssignmentType, FieldLeadSummary, WorkRole } from "@/lib/field-work-types";
import { FIELD_ASSIGNMENT_LABELS, FIELD_STATUS_LABELS } from "@/lib/field-work-types";

type DetailData = {
  lead: FieldLeadSummary;
  assignments: FieldAssignment[];
  fieldMembers: Array<{ user_id: string; phone?: string | null; work_role?: WorkRole }>;
  permissions: { canManage: boolean; canOperate: boolean };
};

async function fetcher(url: string): Promise<DetailData> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json() as { ok?: boolean; data?: DetailData; error?: string };
  if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error ?? "Could not load field assignments.");
  return payload.data;
}

export function LeadFieldAssignmentCard({ leadId }: { leadId: string }) {
  const toast = useToast();
  const { data, error, mutate } = useSWR<DetailData>(`/api/field-work?leadId=${encodeURIComponent(leadId)}`, fetcher);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState("");
  const [assignmentType, setAssignmentType] = useState<FieldAssignmentType>("site_survey");
  const [dueAt, setDueAt] = useState("");
  const [instructions, setInstructions] = useState("");

  async function assign() {
    if (!assignedUserId) return;
    setBusy(true);
    try {
      const response = await fetch("/api/field-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, assignedUserId, assignmentType, dueAt: dueAt ? new Date(dueAt).toISOString() : null, instructions: instructions.trim() || null }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not assign field work.");
      toast.success("Field work assigned", "The sales lead owner has not changed.");
      setOpen(false);
      setAssignedUserId("");
      setDueAt("");
      setInstructions("");
      await mutate();
    } catch (err) {
      toast.error("Assignment failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">{error instanceof Error ? error.message : "Field Work unavailable."}</div>;
  if (!data) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;

  const active = data.assignments.filter((item) => !["completed", "cancelled"].includes(item.status));
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0c1017]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-teal-600" /><div><h2 className="text-sm font-black">Field Work</h2><p className="text-[11px] font-semibold text-muted-foreground">Separate from sales ownership</p></div></div>
        {data.permissions.canManage ? <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-extrabold text-white"><UserRoundPlus className="h-3.5 w-3.5" />Assign</button> : null}
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-800 dark:bg-teal-950/20 sm:grid-cols-2">
          <label className="text-xs font-bold">Field member<select value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"><option value="">Choose member</option>{data.fieldMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.phone || member.user_id.slice(0, 8)} · {member.work_role === "hybrid" ? "Hybrid" : "Field"}</option>)}</select></label>
          <label className="text-xs font-bold">Work type<select value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as FieldAssignmentType)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">{Object.entries(FIELD_ASSIGNMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-bold">Due date & time<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm" /></label>
          <label className="text-xs font-bold sm:col-span-2">Instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm" placeholder="Survey scope, documents needed, customer concern…" /></label>
          <button type="button" disabled={busy || !assignedUserId} onClick={() => void assign()} className="rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900 sm:col-span-2">{busy ? "Assigning…" : "Assign field work"}</button>
          {data.fieldMembers.length === 0 ? <p className="text-xs font-semibold text-amber-700 sm:col-span-2">Set at least one team member&apos;s work function to Field or Hybrid in Account & Team.</p> : null}
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {active.length === 0 ? <p className="rounded-xl bg-muted/60 p-3 text-xs font-semibold text-muted-foreground">No active field job.</p> : active.map((item) => {
          const member = data.fieldMembers.find((candidate) => candidate.user_id === item.assigned_user_id);
          return <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"><div><p className="text-sm font-extrabold">{FIELD_ASSIGNMENT_LABELS[item.assignment_type]}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{member?.phone || "Team Inbox"}{item.instructions ? ` · ${item.instructions}` : ""}</p></div><div className="text-right"><span className="rounded-full bg-teal-100 px-2 py-1 text-[10px] font-black text-teal-800">{FIELD_STATUS_LABELS[item.status]}</span>{item.due_at ? <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold text-muted-foreground"><CalendarClock className="h-3 w-3" />{new Date(item.due_at).toLocaleDateString("en-IN")}</p> : null}</div></div>;
        })}
      </div>
    </section>
  );
}
