"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlarmClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { createReminder } from "@/lib/followup-client";
import type { FollowupReminder } from "@/lib/followup-types";
import {
  CALLBACK_PRESETS,
  QUICK_CALLBACK_PRESETS,
  defaultCallbackTitle,
  resolveCallbackDueAt,
  type CallbackPresetId,
} from "@/lib/crm-callback-schedule";
import { formatCrmDateTime } from "@/lib/crm-datetime";
import { cn } from "@/lib/utils";
import { useSWRConfig } from "swr";

type Props = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  customerName: string;
  onScheduled?: () => void;
};

const MORE_PRESETS = CALLBACK_PRESETS.filter((p) => !QUICK_CALLBACK_PRESETS.includes(p.id));

function lockBodyScroll(lock: boolean) {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (lock) {
    const scrollY = window.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    body.dataset.ccScrollLock = String(scrollY);
  } else {
    const scrollY = Number(body.dataset.ccScrollLock ?? "0");
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.overflow = "";
    delete body.dataset.ccScrollLock;
    window.scrollTo(0, scrollY);
  }
}

export function ScheduleCallbackSheet({
  open,
  onClose,
  leadId,
  customerName,
  onScheduled,
}: Props) {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [preset, setPreset] = useState<CallbackPresetId>("in_3_months");
  const [showMore, setShowMore] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("10:00");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<FollowupReminder["priority"]>("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      lockBodyScroll(false);
      return;
    }
    lockBodyScroll(true);
    setPreset("in_3_months");
    setShowMore(false);
    setCustomDate("");
    setCustomTime("10:00");
    setNote("");
    setTitle("");
    setPriority("medium");
    return () => lockBodyScroll(false);
  }, [open, leadId]);

  const resolvedTitle = title.trim() || defaultCallbackTitle(preset, note);

  function resolveDueIso(): string {
    if (preset === "custom_date" && customDate.trim()) {
      return resolveCallbackDueAt("custom_datetime", {
        customLocal: `${customDate.trim()}T${customTime || "10:00"}`,
      });
    }
    return resolveCallbackDueAt(preset, {
      customDateOnly: customDate,
      customLocal:
        preset === "custom_datetime" && customDate && customTime ? `${customDate}T${customTime}` : undefined,
    });
  }

  const duePreview = useMemo(() => {
    try {
      return formatCrmDateTime(resolveDueIso());
    } catch {
      return "—";
    }
  }, [preset, customDate, customTime]);

  const invalidateCaches = useCallback(async () => {
    await Promise.all([
      mutate(`/api/customers/${encodeURIComponent(leadId)}/reminders`),
      mutate("/api/customers"),
      mutate("/api/followups/widgets"),
      mutate("crm-command-center"),
    ]);
  }, [leadId, mutate]);

  function validateBeforeSave(): string | null {
    if (preset === "custom_date" && !customDate.trim()) {
      return "Pick a callback date";
    }
    if (preset === "custom_datetime") {
      if (!customDate.trim()) return "Pick a callback date";
      if (!customTime.trim()) return "Pick a callback time";
    }
    return null;
  }

  async function handleSave() {
    const validationError = validateBeforeSave();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const due_at = resolveDueIso();

      if (!due_at || Number.isNaN(Date.parse(due_at))) {
        throw new Error("Invalid callback date — please pick again");
      }

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

  function handleBackdropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!open || !mounted) return null;

  const isCustom = preset === "custom_date" || preset === "custom_datetime";

  return createPortal(
    <div
      className="fixed inset-0 z-[10070] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-callback-title"
      onPointerDown={handleBackdropPointerDown}
    >
      <div
        ref={sheetRef}
        className="flex max-h-[min(92dvh,680px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-white/10 dark:bg-slate-900"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <AlarmClock className="h-5 w-5 text-teal-600" aria-hidden />
            <div>
              <h2 id="schedule-callback-title" className="text-base font-bold text-slate-900 dark:text-slate-50">
                Schedule callback
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick presets</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CALLBACK_PRESETS.map((id) => {
                  const p = CALLBACK_PRESETS.find((x) => x.id === id)!;
                  const active = preset === id;
                  const label = id === "custom_date" ? "Custom" : p.label;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPreset(id);
                        if (id !== "custom_date") setShowMore(false);
                      }}
                      className={cn(
                        "min-h-12 touch-manipulation rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98]",
                        active
                          ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/25 dark:bg-teal-950/30"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03]"
                      )}
                    >
                      <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
                      {p.hint && id !== "custom_date" ? (
                        <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{p.hint}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {showMore ? (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">More options</p>
                <div className="grid grid-cols-2 gap-2">
                  {MORE_PRESETS.map((p) => {
                    const active = preset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPreset(p.id)}
                        className={cn(
                          "min-h-11 touch-manipulation rounded-xl border px-3 py-2 text-left text-xs font-bold transition",
                          active
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
                            : "border-slate-200 bg-white dark:border-white/10"
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="text-xs font-bold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
              >
                More presets (5 months, monsoon, Diwali…)
              </button>
            )}

            {isCustom ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Callback date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="h-12 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-white/15 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Time (IST)
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="h-12 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-white/15 dark:bg-white/5"
                  />
                </div>
              </div>
            ) : null}

            {preset === "custom_datetime" && !isCustom ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Callback date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="h-12 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-white/15 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Time (IST)
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="h-12 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-white/15 dark:bg-white/5"
                  />
                </div>
              </div>
            ) : null}

            <FloatingLabelInput
              label="Reason / note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Call after monsoon"
              className="h-12 rounded-xl text-base"
            />

            <FloatingLabelInput
              label="Reminder title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultCallbackTitle(preset, note)}
              className="h-12 rounded-xl text-base"
            />

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FollowupReminder["priority"])}
                className="h-12 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold dark:border-white/15 dark:bg-white/5"
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
          </div>
        </div>

        {/* Footer — always visible (iPad Safari fix) */}
        <div
          className="flex shrink-0 gap-2 border-t border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-slate-900"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <Button
            type="button"
            className="h-12 min-h-12 flex-1 touch-manipulation bg-teal-600 text-base font-bold hover:bg-teal-700"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Schedule callback"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 min-h-12 min-w-[5rem] touch-manipulation text-base"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
