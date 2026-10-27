"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, CheckCircle2, ClipboardList, FileText, MapPin, MessageSquareText, Phone, Save, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerDocumentsHubUpload } from "@/components/customers/customer-documents-hub-upload";
import { useToast } from "@/components/ui/toast-center";
import type { FieldAssignment, FieldLeadSummary, WorkRole } from "@/lib/field-work-types";
import { FIELD_ASSIGNMENT_LABELS, FIELD_STATUS_LABELS } from "@/lib/field-work-types";
import type { LeadNote } from "@/lib/followup-types";
import { cn } from "@/lib/utils";

type DetailData = {
  lead: FieldLeadSummary;
  assignments: FieldAssignment[];
  fieldMembers: Array<{ user_id: string; phone?: string | null; work_role?: WorkRole }>;
  permissions: { canManage: boolean; canOperate: boolean; isOwner: boolean; isAdmin: boolean; workRole: WorkRole | null };
};

type FieldFile = {
  id: string;
  file_name?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  created_at?: string | null;
};

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json() as { ok?: boolean; data?: T; error?: string };
  if (!response.ok || !payload.ok || payload.data === undefined) throw new Error(payload.error ?? "Request failed.");
  return payload.data;
}

function prettyDate(value?: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function FieldWorkDetail({ leadId }: { leadId: string }) {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR<DetailData>(`/api/field-work?leadId=${encodeURIComponent(leadId)}`, fetchData);
  const { data: notes = [], mutate: mutateNotes } = useSWR<LeadNote[]>(data?.permissions.canOperate ? `/api/customers/${leadId}/notes` : null, fetchData);
  const { data: files = [], mutate: mutateFiles } = useSWR<FieldFile[]>(data?.permissions.canOperate ? `/api/customers/${leadId}/files` : null, fetchData);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const activeAssignment = useMemo(() => data?.assignments.find((item) => !["completed", "cancelled"].includes(item.status)) ?? null, [data?.assignments]);

  async function updateAssignment(status: FieldAssignment["status"]) {
    if (!activeAssignment) return;
    setSaving(true);
    try {
      const response = await fetch("/api/field-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assignment", assignmentId: activeAssignment.id, status, fieldNotes: activeAssignment.field_notes ?? null }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not update job.");
      toast.success("Field job updated", FIELD_STATUS_LABELS[status]);
      await mutate();
    } catch (err) {
      toast.error("Update failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSurvey(surveyStatus: "not_started" | "scheduled" | "complete") {
    setSaving(true);
    try {
      const response = await fetch("/api/field-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "survey", leadId, surveyStatus, assignmentId: activeAssignment?.id, fieldNotes: activeAssignment?.field_notes ?? null }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not save survey.");
      toast.success("Survey status saved");
      await mutate();
    } catch (err) {
      toast.error("Save failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body_text: note.trim(), attachments_json: [] }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not save note.");
      setNote("");
      toast.success("Field note saved");
      await mutateNotes();
    } catch (err) {
      toast.error("Note failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <p className="py-16 text-center text-sm font-semibold text-muted-foreground">Loading site work…</p>;
  if (error || !data) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">{error instanceof Error ? error.message : "Could not load field work."}</div>;
  const lead = data.lead;

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-20">
      <Link href="/field-work" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" />Field Work</Link>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Customer site</p>
            <h1 className="mt-1 text-2xl font-black">{lead.consumer_name || lead.name}</h1>
            {lead.consumer_name ? <p className="text-sm font-semibold text-muted-foreground">Contact: {lead.name}</p> : null}
          </div>
          <div className="flex gap-2">
            {lead.phone ? <a href={`tel:${lead.phone}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white"><Phone className="h-4 w-4" />Call</a> : null}
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-teal-600" />{[lead.location, lead.city, lead.state].filter(Boolean).join(", ") || "Address not added"}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><UserRound className="h-4 w-4 text-teal-600" />Sales owner remains separate from this field job</p>
        </div>
      </section>

      {activeAssignment ? (
        <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800 dark:bg-teal-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-black text-teal-950 dark:text-teal-100">{FIELD_ASSIGNMENT_LABELS[activeAssignment.assignment_type]}</p><p className="mt-1 text-xs font-semibold text-teal-800 dark:text-teal-200">{prettyDate(activeAssignment.due_at)} · {activeAssignment.priority} priority</p></div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-teal-800 shadow-sm dark:bg-white/10 dark:text-teal-100">{FIELD_STATUS_LABELS[activeAssignment.status]}</span>
          </div>
          {activeAssignment.instructions ? <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-medium text-slate-700 dark:bg-black/20 dark:text-slate-200">{activeAssignment.instructions}</p> : null}
          {data.permissions.canOperate ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["accepted", "in_progress", "completed"] as const).map((status) => <button key={status} type="button" disabled={saving || activeAssignment.status === status} onClick={() => void updateAssignment(status)} className={cn("rounded-xl px-2 py-2.5 text-xs font-extrabold", activeAssignment.status === status ? "bg-teal-700 text-white" : "border border-teal-200 bg-white text-teal-900 dark:bg-white/5 dark:text-teal-100")}>{FIELD_STATUS_LABELS[status]}</button>)}
            </div>
          ) : null}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-semibold text-muted-foreground">No active assignment. Field/Hybrid staff may still record a survey, documents and site concerns from the organization directory.</div>
      )}

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-teal-600" /><h2 className="font-black">Survey progress</h2></div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["not_started", "scheduled", "complete"] as const).map((status) => <button key={status} type="button" disabled={saving || !data.permissions.canOperate} onClick={() => void updateSurvey(status)} className={cn("rounded-xl border px-2 py-3 text-xs font-extrabold capitalize", lead.survey_status === status ? "border-teal-600 bg-teal-600 text-white" : "border-border bg-background hover:border-teal-400")}>{status.replace(/_/g, " ")}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-teal-600" /><h2 className="font-black">Concern & visit notes</h2></div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Customer concern, roof condition, meter detail, access issue…" className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-teal-500" />
        <button type="button" disabled={saving || !note.trim() || !data.permissions.canOperate} onClick={() => void addNote()} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Save className="h-4 w-4" />Save field note</button>
        {notes.length ? <div className="mt-4 space-y-2">{notes.slice(0, 8).map((item) => <div key={item.id} className="rounded-xl bg-muted/60 p-3"><p className="text-sm font-medium">{item.body_text}</p><p className="mt-1 text-[10px] font-semibold text-muted-foreground">{prettyDate(item.created_at)}</p></div>)}</div> : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-teal-600" /><h2 className="font-black">Collect documents & site photos</h2></div>
        <CustomerDocumentsHubUpload customerId={leadId} onUploaded={() => void mutateFiles()} />
        {files.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {files.map((file) => (
              <a key={file.id} href={file.file_url || "#"} target="_blank" rel="noreferrer" className="rounded-xl border border-border p-3 hover:border-teal-300">
                <p className="truncate text-sm font-extrabold">{file.file_name || "Customer file"}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">{String(file.file_type || "document").replace(/_/g, " ")} · {prettyDate(file.created_at)}</p>
              </a>
            ))}
          </div>
        ) : <p className="mt-3 text-xs font-semibold text-muted-foreground">No customer documents collected yet.</p>}
      </section>

      {lead.survey_status === "complete" ? <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-extrabold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" />Survey complete. Sales owner can continue proposal/project work.</div> : null}
    </div>
  );
}
