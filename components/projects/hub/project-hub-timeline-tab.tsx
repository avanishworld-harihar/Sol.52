"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  fetchProjectActivity,
  projectActivityKey,
  type ProjectActivityEvent,
  type ProjectListItem,
} from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderPlus,
  Loader2,
  MessageSquare,
  PenTool,
  RefreshCw,
  Ruler,
  User,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const PAGE_SIZE = 20;

type EventVisual = {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: React.ReactNode;
  category: "stage" | "task" | "nm" | "system" | "user";
};

function eventVisual(type: string): EventVisual {
  switch (type) {
    case "stage_changed":
      return {
        label: "Stage change",
        badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
        dotClass: "bg-teal-500",
        icon: <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />,
        category: "stage",
      };
    case "task_completed":
      return {
        label: "Task completed",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        dotClass: "bg-emerald-500",
        icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />,
        category: "task",
      };
    case "nm_substatus_changed":
      return {
        label: "Net metering",
        badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
        dotClass: "bg-purple-500",
        icon: <Zap className="h-3.5 w-3.5" aria-hidden />,
        category: "nm",
      };
    case "survey_submitted":
      return {
        label: "Survey",
        badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
        dotClass: "bg-sky-500",
        icon: <Ruler className="h-3.5 w-3.5" aria-hidden />,
        category: "system",
      };
    case "design_created":
    case "design_revised":
      return {
        label: "Design",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
        dotClass: "bg-blue-500",
        icon: <PenTool className="h-3.5 w-3.5" aria-hidden />,
        category: "system",
      };
    case "comment_added":
      return {
        label: "Comment",
        badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        dotClass: "bg-slate-500",
        icon: <MessageSquare className="h-3.5 w-3.5" aria-hidden />,
        category: "user",
      };
    case "project_created":
      return {
        label: "Project created",
        badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
        dotClass: "bg-teal-500",
        icon: <FolderPlus className="h-3.5 w-3.5" aria-hidden />,
        category: "system",
      };
    default:
      return {
        label: type.replace(/_/g, " "),
        badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        dotClass: "bg-slate-400",
        icon: <ClipboardList className="h-3.5 w-3.5" aria-hidden />,
        category: "system",
      };
  }
}

function formatTimestamp(iso: string): { absolute: string; relative: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { absolute: "—", relative: "—" };
  const absolute = d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  let relative = "Just now";
  if (diffMin >= 1 && diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffMin >= 60 && diffMin < 1440) relative = `${Math.floor(diffMin / 60)}h ago`;
  else if (diffMin >= 1440) relative = `${Math.floor(diffMin / 1440)}d ago`;
  return { absolute, relative };
}

function actorLabel(event: ProjectActivityEvent): string {
  if (event.created_by_id?.trim()) {
    return `User ${event.created_by_id.slice(0, 8)}…`;
  }
  return "System";
}

function eventDetail(event: ProjectActivityEvent): string | null {
  if (event.event_description?.trim()) return event.event_description.trim();
  const meta = event.metadata_json ?? {};
  switch (event.event_type) {
    case "stage_changed":
      return `${String(meta.from_stage ?? "?").replace(/_/g, " ")} → ${String(meta.to_stage ?? "?").replace(/_/g, " ")}`;
    case "task_completed":
      return meta.stage ? `Stage: ${String(meta.stage).replace(/_/g, " ")}` : null;
    case "nm_substatus_changed":
      return `${String(meta.from_substatus ?? "?").replace(/_/g, " ")} → ${String(meta.to_substatus ?? "?").replace(/_/g, " ")}`;
    default:
      return null;
  }
}

function dedupeEvents(events: ProjectActivityEvent[]): ProjectActivityEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}

function TimelineEventRow({
  event,
  isLast,
}: {
  event: ProjectActivityEvent;
  isLast: boolean;
}) {
  const visual = eventVisual(event.event_type);
  const time = formatTimestamp(event.created_at);
  const detail = eventDetail(event);

  return (
    <li className="relative flex gap-3 pb-5">
      {!isLast ? (
        <span
          className="absolute left-[11px] top-7 h-[calc(100%-0.75rem)] w-px bg-slate-200 dark:bg-white/10"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "relative z-[1] mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
          visual.dotClass
        )}
        aria-hidden
      >
        {visual.icon}
      </span>
      <article className="min-w-0 flex-1 rounded-xl border border-slate-200/90 bg-white p-3.5 dark:border-white/10 dark:bg-[#0c1017]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  visual.badgeClass
                )}
              >
                {visual.label}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {visual.category === "user" ? "User activity" : "System log"}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
              {event.event_title}
            </h3>
            {detail ? (
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{detail}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{time.relative}</p>
            <p className="text-[10px] font-medium text-slate-400">{time.absolute}</p>
          </div>
        </div>
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <User className="h-3 w-3 opacity-70" aria-hidden />
          {actorLabel(event)}
        </p>
      </article>
    </li>
  );
}

export function ProjectHubTimelineTab({
  project,
  enabled,
}: {
  project: ProjectListItem;
  enabled: boolean;
}) {
  const feedKey = enabled
    ? projectActivityKey(project.id, { limit: PAGE_SIZE })
    : null;

  const {
    data: firstPage,
    error,
    isLoading,
    isValidating,
    mutate: mutateFeed,
  } = useSWR(feedKey, fetchProjectActivity, {
    revalidateOnFocus: false,
    dedupingInterval: 3_000,
  });

  const [olderEvents, setOlderEvents] = useState<ProjectActivityEvent[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setOlderEvents([]);
    setHasMore((firstPage?.length ?? 0) >= PAGE_SIZE);
  }, [firstPage]);

  const events = useMemo(
    () => dedupeEvents([...(firstPage ?? []), ...olderEvents]),
    [firstPage, olderEvents]
  );

  const refreshTimeline = useCallback(async () => {
    await revalidateProjectHubCaches(project.id);
    setOlderEvents([]);
    await mutateFeed();
  }, [mutateFeed, project.id]);

  const loadMore = useCallback(async () => {
    const last = events[events.length - 1];
    if (!last || loadingMore) return;
    setLoadingMore(true);
    try {
      const batch = await fetchProjectActivity(
        projectActivityKey(project.id, { limit: PAGE_SIZE, before: last.created_at })
      );
      setOlderEvents((prev) =>
        dedupeEvents([...prev, ...batch.filter((b) => b.id !== last.id)])
      );
      setHasMore(batch.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [events, loadingMore, project.id]);

  if (!enabled) return null;

  if (isLoading && !firstPage) {
    return (
      <div id="project-hub-panel-timeline" role="tabpanel" aria-labelledby="project-hub-tab-timeline">
        <TimelineSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card
        id="project-hub-panel-timeline"
        role="tabpanel"
        aria-labelledby="project-hub-tab-timeline"
        className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
            Could not load activity timeline
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refreshTimeline()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      id="project-hub-panel-timeline"
      role="tabpanel"
      aria-labelledby="project-hub-tab-timeline"
      className="space-y-4"
    >
      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                Activity timeline
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {events.length} event{events.length === 1 ? "" : "s"} · newest first
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 self-start sm:self-auto"
            disabled={isValidating}
            onClick={() => void refreshTimeline()}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isValidating && "animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
          <CardContent className="px-4 py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              No activity yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Stage changes, task completions, and net metering updates will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ol className="space-y-0">
          {events.map((event, index) => (
            <TimelineEventRow
              key={event.id}
              event={event}
              isLast={index === events.length - 1 && !hasMore}
            />
          ))}
        </ol>
      )}

      {events.length > 0 && hasMore ? (
        <div className="flex justify-center pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            className="gap-1.5"
            onClick={() => void loadMore()}
          >
            {loadingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            Load older events
          </Button>
        </div>
      ) : null}
    </div>
  );
}
