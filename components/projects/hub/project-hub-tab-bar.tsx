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

const TAB_CONFIG: {
  id: ProjectHubTabId;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
  { id: "survey", label: "Survey", icon: <Ruler className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
  { id: "design", label: "Design", icon: <PenTool className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
  { id: "tasks", label: "Tasks", icon: <ClipboardList className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
  { id: "timeline", label: "Timeline", icon: <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
  { id: "comments", label: "Comments", icon: <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
];

export function isProjectHubTabId(value: string | null | undefined): value is ProjectHubTabId {
  return Boolean(value && PROJECT_HUB_TAB_IDS.includes(value as ProjectHubTabId));
}

export function resolveProjectHubTab(value: string | null | undefined): ProjectHubTabId {
  if (isProjectHubTabId(value)) return value;
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
        "sticky top-[3.75rem] z-30 -mx-4 min-w-0 px-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0",
        className
      )}
      role="tablist"
      aria-label="Project hub tabs"
    >
      <div className="grid w-full min-w-0 grid-cols-3 gap-px rounded-lg border border-slate-200/80 bg-white/90 p-0.5 shadow-sm backdrop-blur-md max-sm:rounded-lg sm:grid-cols-6 sm:gap-0.5 sm:rounded-xl sm:p-1 dark:border-white/10 dark:bg-[#0c1017]/90">
        {TAB_CONFIG.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`project-hub-panel-${tab.id}`}
              id={`project-hub-tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex min-w-0 items-center justify-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 dark:focus-visible:ring-slate-500 max-sm:min-h-[2rem] sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[12px]",
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-100"
              )}
            >
              <span aria-hidden className="shrink-0">
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
