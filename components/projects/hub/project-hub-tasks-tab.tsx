"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  fetchProjectTasks,
  patchProjectTask,
  projectTasksKey,
  type ProjectListItem,
  type ProjectTask,
} from "@/lib/project-api-client";
import {
  isProjectStageId,
  STAGE_SHORT_LABELS,
  type ProjectStageId,
} from "@/lib/project-stages";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  RefreshCw,
  RotateCcw,
  User,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

type TaskStatus = ProjectTask["status"];

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
  na: "N/A",
};

const TASK_STATUS_CLASS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  skipped: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
  na: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
};

function formatTaskDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isCompletedTask(task: ProjectTask): boolean {
  return task.status === "done";
}

function stageLabel(stage: string): string {
  return isProjectStageId(stage) ? STAGE_SHORT_LABELS[stage as ProjectStageId] : stage;
}

function assigneeLabel(task: ProjectTask): string {
  if (!task.assigned_to_id) return "Unassigned";
  return `ID ${task.assigned_to_id.slice(0, 8)}…`;
}

function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        TASK_STATUS_CLASS[status] ?? TASK_STATUS_CLASS.pending
      )}
    >
      {TASK_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function TaskRow({
  task,
  busy,
  onComplete,
  onReopen,
}: {
  task: ProjectTask;
  busy: boolean;
  onComplete: (task: ProjectTask) => void;
  onReopen: (task: ProjectTask) => void;
}) {
  const done = isCompletedTask(task);

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 dark:border-white/10 dark:bg-[#0c1017]",
        "sm:flex-row sm:items-start sm:justify-between",
        done && "opacity-90"
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="mt-0.5 shrink-0" aria-hidden>
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "text-sm font-extrabold text-slate-900 dark:text-slate-50",
                done && "line-through decoration-slate-400"
              )}
            >
              {task.title}
            </h3>
            <TaskStatusBadge status={task.status} />
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {stageLabel(task.stage)}
            </span>
            {task.is_blocking && !done ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                Blocking
              </span>
            ) : null}
          </div>
          {task.description?.trim() ? (
            <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              {task.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              Due {formatTaskDate(task.due_date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              {assigneeLabel(task)}
            </span>
            {done && task.completed_at ? (
              <span>Completed {formatTaskDate(task.completed_at)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
        {done ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="gap-1.5"
            onClick={() => onReopen(task)}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            )}
            Reopen
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            className="gap-1.5"
            onClick={() => onComplete(task)}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            )}
            Mark complete
          </Button>
        )}
      </div>
    </article>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}

export function ProjectHubTasksTab({
  project,
  enabled,
}: {
  project: ProjectListItem;
  enabled: boolean;
}) {
  const toast = useToast();
  const tasksKey = enabled ? projectTasksKey(project.id) : null;
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<"current" | "all">("current");

  const {
    data: tasks,
    error,
    isLoading,
    mutate: mutateTasks,
    isValidating,
  } = useSWR(tasksKey, fetchProjectTasks, {
    revalidateOnFocus: false,
    dedupingInterval: 3_000,
  });

  const currentStage = isProjectStageId(project.current_stage)
    ? project.current_stage
    : null;

  const filteredTasks = useMemo(() => {
    const rows = tasks ?? [];
    if (stageFilter === "all" || !currentStage) return rows;
    return rows.filter((t) => t.stage === currentStage);
  }, [tasks, stageFilter, currentStage]);

  const { pending, completed, counts } = useMemo(() => {
    const pendingRows = filteredTasks.filter((t) => !isCompletedTask(t));
    const completedRows = filteredTasks.filter((t) => isCompletedTask(t));
    return {
      pending: pendingRows,
      completed: completedRows,
      counts: {
        total: filteredTasks.length,
        pending: pendingRows.length,
        completed: completedRows.length,
      },
    };
  }, [filteredTasks]);

  const refreshAll = useCallback(async () => {
    await revalidateProjectHubCaches(project.id);
    await mutateTasks();
  }, [mutateTasks, project.id]);

  const handleComplete = useCallback(
    async (task: ProjectTask) => {
      setBusyTaskId(task.id);
      try {
        const res = await patchProjectTask(project.id, task.id, { status: "done" });
        if (!res.ok) throw new Error(res.error ?? "patch_failed");
        await refreshAll();
        toast.success("Task completed", task.title);
      } catch (e) {
        toast.error(
          "Could not complete task",
          e instanceof Error ? e.message : "Unknown error"
        );
      } finally {
        setBusyTaskId(null);
      }
    },
    [project.id, refreshAll, toast]
  );

  const handleReopen = useCallback(
    async (task: ProjectTask) => {
      setBusyTaskId(task.id);
      try {
        const res = await patchProjectTask(project.id, task.id, { status: "pending" });
        if (!res.ok) throw new Error(res.error ?? "patch_failed");
        await refreshAll();
        toast.success("Task reopened", task.title);
      } catch (e) {
        toast.error(
          "Could not reopen task",
          e instanceof Error ? e.message : "Unknown error"
        );
      } finally {
        setBusyTaskId(null);
      }
    },
    [project.id, refreshAll, toast]
  );

  if (!enabled) return null;

  if (isLoading && !tasks) {
    return (
      <div id="project-hub-panel-tasks" role="tabpanel" aria-labelledby="project-hub-tab-tasks">
        <TasksSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card
        id="project-hub-panel-tasks"
        role="tabpanel"
        aria-labelledby="project-hub-tab-tasks"
        className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
            Could not load tasks
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refreshAll()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      id="project-hub-panel-tasks"
      role="tabpanel"
      aria-labelledby="project-hub-tab-tasks"
      className="space-y-4"
    >
      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p>
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {counts.total}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pending</p>
              <p className="text-xl font-extrabold tabular-nums text-amber-700 dark:text-amber-300">
                {counts.pending}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Completed
              </p>
              <p className="text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
                {counts.completed}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                  stageFilter === "current"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
                onClick={() => setStageFilter("current")}
              >
                Current stage
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                  stageFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
                onClick={() => setStageFilter("all")}
              >
                All stages
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isValidating}
              onClick={() => void refreshAll()}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isValidating && "animate-spin")}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
            Pending tasks
            <span className="text-xs font-semibold text-slate-400">({counts.pending})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {pending.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
              No pending tasks
              {stageFilter === "current" && currentStage
                ? ` for ${stageLabel(currentStage)} stage`
                : ""}
              .
            </p>
          ) : (
            pending.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={busyTaskId === task.id}
                onComplete={handleComplete}
                onReopen={handleReopen}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Completed tasks
            <span className="text-xs font-semibold text-slate-400">({counts.completed})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {completed.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
              No completed tasks yet.
            </p>
          ) : (
            completed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={busyTaskId === task.id}
                onComplete={handleComplete}
                onReopen={handleReopen}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
