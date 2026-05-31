"use client";

import { Button } from "@/components/ui/button";
import type { ProjectListItem } from "@/lib/project-api-client";
import {
  getNextStage,
  isProjectStageId,
  STAGE_LABELS,
  type ProjectStageId,
} from "@/lib/project-stages";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import {
  fetchProjectTasks,
  projectTasksKey,
  type ProjectTask,
} from "@/lib/project-api-client";

const SHEET_Z = "z-[10060]";

function pendingBlockingTasks(tasks: ProjectTask[] | undefined): ProjectTask[] {
  return (tasks ?? []).filter((t) => t.is_blocking && t.status !== "done");
}

export function ProjectHubAdvanceSheet({
  open,
  project,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  project: ProjectListItem;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);

  const currentStage: ProjectStageId = isProjectStageId(project.current_stage)
    ? project.current_stage
    : "survey";
  const nextStage = getNextStage(currentStage);

  const tasksKey =
    open && nextStage ? projectTasksKey(project.id, currentStage) : null;
  const { data: stageTasks, isLoading: tasksLoading } = useSWR(
    tasksKey,
    fetchProjectTasks,
    { revalidateOnFocus: false }
  );

  const blockingTasks = useMemo(() => pendingBlockingTasks(stageTasks), [stageTasks]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!mounted || !open || !nextStage) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 flex items-end justify-center md:items-center md:p-6", SHEET_Z)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/50 touch-manipulation"
        aria-label="Close advance stage dialog"
        onClick={() => !busy && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-advance-sheet-title"
        className="relative z-[1] max-h-[min(85dvh,560px)] w-full max-w-md touch-manipulation overflow-y-auto rounded-t-2xl border border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:border-white/10 dark:bg-[#0f1419] md:max-h-[min(80vh,640px)] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p id="project-advance-sheet-title" className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Advance project stage
          </p>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Current</p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-slate-50">
                {STAGE_LABELS[currentStage]}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-teal-600 dark:text-teal-400">
                Next
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-teal-900 dark:text-teal-100">
                {STAGE_LABELS[nextStage]}
              </p>
            </div>
          </div>

          <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
            Stage status will reset to <span className="font-semibold">In progress</span>. A checklist
            for the new stage is seeded server-side and a{" "}
            <span className="font-semibold">stage_changed</span> activity event is logged.
          </p>

          {tasksLoading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Checking blocking tasks…</p>
          ) : blockingTasks.length > 0 ? (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-100">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Advisory — {blockingTasks.length} blocking task
                {blockingTasks.length === 1 ? "" : "s"} incomplete
              </p>
              <ul className="mt-2 space-y-1">
                {blockingTasks.slice(0, 4).map((task) => (
                  <li key={task.id} className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    · {task.title}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
                You can still advance — this is a warning only.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onConfirm()} disabled={busy} className="gap-1">
              Confirm advance
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
