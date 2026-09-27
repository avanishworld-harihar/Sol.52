"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { BellPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-center";
import { crmDatetimeLocalToIso } from "@/lib/crm-datetime";
import { createGeneralReminder } from "@/lib/followup-client";
import type { FollowupReminder } from "@/lib/followup-types";
import { useSWRConfig } from "swr";

export function CreateReminderDialog({ compact = false }: { compact?: boolean }) {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<FollowupReminder["priority"]>("medium");

  async function save() {
    if (!title.trim() || !dueLocal) {
      toast.error("Title and date are required");
      return;
    }
    setSaving(true);
    try {
      await createGeneralReminder({
        title: title.trim(),
        due_at: crmDatetimeLocalToIso(dueLocal),
        priority,
        followup_type: "general",
        subject_label: subject.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success("Reminder added", "It will appear in your dashboard agenda.");
      setOpen(false);
      setTitle(""); setSubject(""); setDueLocal(""); setNotes(""); setPriority("medium");
      void mutate("/api/followups/widgets");
      void mutate("/api/followups/widgets?view=all");
    } catch (error) {
      toast.error("Could not add reminder", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button type="button" variant={compact ? "ghost" : "outline"} size="sm" className="min-h-10 gap-1.5 rounded-xl" onClick={() => setOpen(true)}>
        <BellPlus className="h-4 w-4" aria-hidden /> New reminder
      </Button>
      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[10100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="general-reminder-title">
          <button className="absolute inset-0" aria-label="Close reminder form" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-white/60 bg-white p-5 shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700">Quick add</p><h2 id="general-reminder-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">New reminder</h2><p className="mt-1 text-xs text-slate-500">For office work, documents, payments, or anything not tied to a customer.</p></div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Title<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Submit subsidy documents" className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5" /></label>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Related to (optional)<input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Office, vendor, project…" className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5" /></label>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Date &amp; time<input type="datetime-local" value={dueLocal} onChange={(e) => setDueLocal(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5" /></label>
              <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Priority<select value={priority} onChange={(e) => setPriority(e.target.value as FollowupReminder["priority"])} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-800"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details" className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" /></label>
              </div>
            </div>
            <div className="mt-5 flex gap-2"><Button className="h-12 flex-1 bg-teal-600 font-bold hover:bg-teal-700" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Add reminder"}</Button><Button variant="outline" className="h-12" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button></div>
          </div>
        </div>, document.body
      ) : null}
    </>
  );
}
