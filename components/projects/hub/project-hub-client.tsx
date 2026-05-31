"use client";

import { ProjectHubHeader } from "@/components/projects/hub/project-hub-header";
import { ProjectHubOverviewTab } from "@/components/projects/hub/project-hub-overview-tab";
import { ProjectHubSkeleton } from "@/components/projects/hub/project-hub-skeleton";
import {
  ProjectHubTabBar,
  resolveProjectHubTab,
  type ProjectHubTabId,
} from "@/components/projects/hub/project-hub-tab-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePage, WorkspaceStaggerItem } from "@/components/workspace";
import {
  fetchProjectDetail,
  projectDetailKey,
} from "@/lib/project-api-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

export function ProjectHubClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailKey = projectDetailKey(projectId);

  const tabFromUrl = searchParams.get("tab");
  const resolvedTab = useMemo(() => resolveProjectHubTab(tabFromUrl), [tabFromUrl]);
  const [activeTab, setActiveTab] = useState<ProjectHubTabId>(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = useCallback(
    (tab: ProjectHubTabId) => {
      setActiveTab(tab);
      const qs = tab === "overview" ? "" : `?tab=${tab}`;
      router.replace(`/projects/${encodeURIComponent(projectId)}${qs}`, { scroll: false });
    },
    [projectId, router]
  );

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
        <ProjectHubTabBar active={activeTab} onChange={handleTabChange} />
      </WorkspaceStaggerItem>

      <WorkspaceStaggerItem>
        {activeTab === "overview" ? <ProjectHubOverviewTab project={project} /> : null}
      </WorkspaceStaggerItem>
    </WorkspacePage>
  );
}
