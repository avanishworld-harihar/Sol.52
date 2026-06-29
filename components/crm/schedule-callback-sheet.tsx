"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlarmClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { createReminder } from "@/lib/followup-client";
import type { FollowupReminder } from "@/lib/followup-types";
import {
  CALLBACK_PRESETS,
  defaultCallbackTitle,
  resolveCallbackDueAt,
  type CallbackPresetId,
} from "@/lib/crm-callback-schedule";
import { crmNowDatetimeLocal, formatCrmDateTime } from "@/lib/crm-datetime";
import { cn } from "@/lib/utils";
import { useSWRConfig } from "swr";

type Props = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  customerName: string;
  onScheduled?: () => void;
};

export function ScheduleCallbackSheet({
  open,
  onClose,
  leadId,
  customerName,
  onScheduled,
}: Props) {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [mounted, setMounted] = useState(false);
  const [preset, setPreset] = useState<CallbackPresetId>("in_3_months");
  const [customDate, setCustomDate] = useState("");
  const [customDatetime, setCustomDatetime] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<FollowupReminder["priority"]>("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setPreset("in_3_months");
    setCustomDate("");
    setCustomDatetime(crmNowDatetimeLocal());
    setNote("");
    setTitle("");
    setPriority("medium");
  }, [open, leadId]);

  const duePreview = useMemo(() => {
    try {
      const iso = resolveCallbackDueAt(preset, {
        customDateOnly: customDate,
        customLocal: customDatetime,
      });
      return formatCrmDateTime(iso);
    } catch {
      return "—";
    }
  }, [preset, customDate, customDatetime]);

  const resolvedTitle = title.trim() || defaultCallbackTitle(preset, note);

  const invalidateCaches = useCallback(async () => {
    await Promise.all([
      mutate(`/api/customers/${encodeURIComponent(leadId)}/reminders`),
      mutate("/api/customers"),
      mutate("/api/followups/widgets"),
    ]);
  }, [leadId, mutate]);

  async function handleSave() {
    setSaving(true);
    try {
      const due_at = resolveCallbackDueAt(preset, {
        customDateOnly: customDate,
        customLocal: customDatetime,
      });
      await createReminder(leadId, {
        title: resolvedTitle,
        due_at,
        priority,
        followup_type: "call",
        status: "pending",
        notes: note.trim() || null,
      });
      await invalidateCaches();
      onScheduled?.();
      toast.success(`Callback scheduled for ${formatCrmDateTime(due_at)}`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not schedule callback");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10070] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-callback-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(92vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <AlarmClock className="h-4 w-4 text-teal-600" aria-hidden />
            <div>
              <h2 id="schedule-callback-title" className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Schedule callback
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">When to call back</p>
            <div className="grid grid-cols-2 gap-2">
              {CALLBACK_PRESETS.map((p) => {
                const active = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      active
                        ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500/30 dark:bg-teal-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03]"
                    )}
                  >
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{p.label}</span>
                    {p.hint ? (
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{p.hint}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {preset === "custom_date" ? (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Callback date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5"
              />
            </div>
          ) : null}

          {preset === "custom_datetime" ? (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Date &amp; time (IST)
              </label>
              <input
                type="datetime-local"
                value={customDatetime}
                onChange={(e) => setCustomDatetime(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5"
              />
            </div>
          ) : null}

          <FloatingLabelInput
            label="Reason / note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Call after monsoon, budget next quarter"
            className="h-10 rounded-xl text-sm"
          />

          <FloatingLabelInput
            label="Reminder title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultCallbackTitle(preset, note)}
            className="h-10 rounded-xl text-sm"
          />

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as FollowupReminder["priority"])}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="rounded-xl border border-teal-200/80 bg-teal-50/60 px-3 py-2.5 dark:border-teal-500/30 dark:bg-teal-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
              Scheduled for
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-50">{duePreview}</p>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">{resolvedTitle}</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              className="h-11 flex-1 bg-teal-600 hover:bg-teal-700"
              disabled={saving || (preset === "custom_date" && !customDate.trim())}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Schedule callback"}
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
