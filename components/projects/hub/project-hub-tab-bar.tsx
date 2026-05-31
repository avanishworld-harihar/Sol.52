"use client";

import { cn } from "@/lib/utils";
import {
  ClipboardList,
  FileText,
  LayoutGrid,
  MessageSquare,
  PenTool,
  Ruler,
} from "lucide-react";
import type { ReactNode } from "react";

export const PROJECT_HUB_TAB_IDS = [
  "overview",
  "survey",
  "design",
  "tasks",
  "timeline",
  "comments",
] as const;

export type ProjectHubTabId = (typeof PROJECT_HUB_TAB_IDS)[number];

const ENABLED_TABS = new Set<ProjectHubTabId>([
  "overview",
  "survey",
  "design",
  "tasks",
  "timeline",
  "comments",
]);

const TAB_CONFIG: {
  id: ProjectHubTabId;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: "survey", label: "Survey", icon: <Ruler className="h-3.5 w-3.5" /> },
  { id: "design", label: "Design", icon: <PenTool className="h-3.5 w-3.5" /> },
  { id: "tasks", label: "Tasks", icon: <ClipboardList className="h-3.5 w-3.5" /> },
  { id: "timeline", label: "Timeline", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "comments", label: "Comments", icon: <MessageSquare className="h-3.5 w-3.5" /> },
];

export function isProjectHubTabId(value: string | null | undefined): value is ProjectHubTabId {
  return Boolean(value && PROJECT_HUB_TAB_IDS.includes(value as ProjectHubTabId));
}

export function resolveProjectHubTab(value: string | null | undefined): ProjectHubTabId {
  if (value && ENABLED_TABS.has(value as ProjectHubTabId)) {
    return value as ProjectHubTabId;
  }
  return "overview";
}

export function ProjectHubTabBar({
  active,
  onChange,
  className,
}: {
  active: ProjectHubTabId;
  onChange: (tab: ProjectHubTabId) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-[3.75rem] z-30 -mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0",
        className
      )}
      role="tablist"
      aria-label="Project hub tabs"
    >
      <div className="flex min-w-max gap-0.5 rounded-xl border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0c1017]/90">
        {TAB_CONFIG.map((tab) => {
          const isActive = tab.id === active;
          const isEnabled = ENABLED_TABS.has(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`project-hub-panel-${tab.id}`}
              id={`project-hub-tab-${tab.id}`}
              disabled={!isEnabled}
              title={isEnabled ? undefined : `${tab.label} — coming in a later step`}
              onClick={() => isEnabled && onChange(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150",
                !isEnabled &&
                  "cursor-not-allowed text-slate-300 dark:text-slate-700",
                isEnabled &&
                  isActive &&
                  "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
                isEnabled &&
                  !isActive &&
                  "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-100"
              )}
            >
              <span aria-hidden>{tab.icon}</span>
              {tab.label}
              {!isEnabled ? (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:bg-white/5 dark:text-slate-600">
                  Soon
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
