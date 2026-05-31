"use client";

import { ProjectHubHeader } from "@/components/projects/hub/project-hub-header";
import { ProjectHubSkeleton } from "@/components/projects/hub/project-hub-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchProjectDetail,
  projectDetailKey,
} from "@/lib/project-api-client";
import { WorkspacePage, WorkspaceStaggerItem } from "@/components/workspace";
import Link from "next/link";
import useSWR from "swr";

export function ProjectHubClient({ projectId }: { projectId: string }) {
  const detailKey = projectDetailKey(projectId);

  const { data: project, error, isLoading, mutate } = useSWR(
    detailKey,
    fetchProjectDetail,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  if (isLoading && !project) {
    return <ProjectHubSkeleton />;
  }

  if (error || !project) {
    return (
      <WorkspacePage tone="projects">
        <WorkspaceStaggerItem>
          <Card className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
                Project not found
              </p>
              <p className="text-xs font-medium text-red-700 dark:text-red-300">
                {error instanceof Error
                  ? error.message
                  : "This project may have been removed or is not yet available."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void mutate()}>
                  Retry
                </Button>
                <Button type="button" size="sm" asChild>
                  <Link href="/projects">Back to projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </WorkspaceStaggerItem>
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage tone="projects">
      <WorkspaceStaggerItem>
        <ProjectHubHeader project={project} />
      </WorkspaceStaggerItem>

      <WorkspaceStaggerItem>
        <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Hub tabs and overview content
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Step 2+ — Overview, Survey, Design, Tasks, Timeline, Comments
            </p>
          </CardContent>
        </Card>
      </WorkspaceStaggerItem>
    </WorkspacePage>
  );
}
