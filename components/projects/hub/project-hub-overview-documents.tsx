"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchProjectDocumentsSummary,
  projectDocumentsSummaryKey,
  type ProjectListItem,
} from "@/lib/project-api-client";
import type { ProjectDocumentCategory } from "@/lib/project-document-types";
import { cn } from "@/lib/utils";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

function summaryLine(byCategory: Record<string, number>): string {
  const parts: string[] = [];
  const surveyCats: ProjectDocumentCategory[] = ["roof_photo", "meter_photo", "db_photo"];
  const surveyCount = surveyCats.reduce((s, c) => s + (byCategory[c] ?? 0), 0);
  if (surveyCount > 0) {
    parts.push(`${surveyCount} survey photo${surveyCount === 1 ? "" : "s"}`);
  }
  const billCount = byCategory.electricity_bill ?? 0;
  if (billCount > 0) {
    parts.push(`${billCount} bill${billCount === 1 ? "" : "s"}`);
  }
  const otherTotal = Object.entries(byCategory).reduce((s, [k, n]) => {
    if (surveyCats.includes(k as ProjectDocumentCategory) || k === "electricity_bill") {
      return s;
    }
    return s + n;
  }, 0);
  if (otherTotal > 0) {
    parts.push(`${otherTotal} other`);
  }
  return parts.length > 0 ? parts.join(" · ") : "No files yet";
}

export function ProjectHubOverviewDocuments({
  project,
}: {
  project: ProjectListItem;
}) {
  const key = projectDocumentsSummaryKey(project.id);
  const { data, isLoading } = useSWR(key, fetchProjectDocumentsSummary, {
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const href = `/projects/${encodeURIComponent(project.id)}?tab=documents`;

  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
          <FolderOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
        {isLoading && !data ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="font-extrabold tabular-nums text-slate-900 dark:text-slate-50">
              {data?.total ?? 0}
            </span>{" "}
            file{(data?.total ?? 0) === 1 ? "" : "s"}
            {data?.by_category ? (
              <span className="text-slate-500 dark:text-slate-400">
                {" "}
                — {summaryLine(data.by_category)}
              </span>
            ) : null}
          </p>
        )}
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          )}
        >
          View documents
          <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
