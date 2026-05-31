"use client";

import { ProjectHubAdvanceSheet } from "@/components/projects/hub/project-hub-advance-sheet";
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
import { useToast } from "@/components/ui/toast-center";
import { WorkspacePage, WorkspaceStaggerItem } from "@/components/workspace";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  advanceProjectStage,
  fetchProjectDetail,
  patchProject,
  projectDetailKey,
} from "@/lib/project-api-client";
import {
  getNextStage,
  isProjectStageId,
  STAGE_LABELS,
  type NmSubstatus,
  type ProjectStageStatus,
} from "@/lib/project-stages";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

export function ProjectHubClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const detailKey = projectDetailKey(projectId);

  const tabFromUrl = searchParams.get("tab");
  const resolvedTab = useMemo(() => resolveProjectHubTab(tabFromUrl), [tabFromUrl]);
  const [activeTab, setActiveTab] = useState<ProjectHubTabId>(resolvedTab);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

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

  const refreshHub = useCallback(async () => {
    await revalidateProjectHubCaches(projectId);
    await mutate();
  }, [mutate, projectId]);

  const handleStageStatusChange = useCallback(
    async (stageStatus: ProjectStageStatus) => {
      if (!project || stageStatus === project.stage_status) return;
      setStatusBusy(true);
      try {
        const res = await patchProject(projectId, { stage_status: stageStatus });
        if (!res.ok) throw new Error(res.error ?? "patch_failed");
        await refreshHub();
        toast.success("Stage status updated", stageStatus.replace(/_/g, " "));
      } catch (e) {
        toast.error(
          "Could not update stage status",
          e instanceof Error ? e.message : "Unknown error"
        );
      } finally {
        setStatusBusy(false);
      }
    },
    [project, projectId, refreshHub, toast]
  );

  const handleNmSubstatusChange = useCallback(
    async (nmSubstatus: NmSubstatus) => {
      if (!project || nmSubstatus === project.nm_substatus) return;
      setStatusBusy(true);
      try {
        const res = await patchProject(projectId, { nm_substatus: nmSubstatus });
        if (!res.ok) throw new Error(res.error ?? "patch_failed");
        await refreshHub();
        toast.success("Net metering status updated");
      } catch (e) {
        toast.error(
          "Could not update net metering status",
          e instanceof Error ? e.message : "Unknown error"
        );
      } finally {
        setStatusBusy(false);
      }
    },
    [project, projectId, refreshHub, toast]
  );

  const handleAdvanceConfirm = useCallback(async () => {
    if (!project) return;
    const currentStage = isProjectStageId(project.current_stage) ? project.current_stage : null;
    const nextStage = currentStage ? getNextStage(currentStage) : null;
    if (!nextStage) return;

    setStatusBusy(true);
    try {
      const res = await advanceProjectStage(projectId);
      if (!res.ok) throw new Error(res.error ?? "advance_failed");
      await refreshHub();
      setAdvanceOpen(false);
      toast.success(
        "Stage advanced",
        `${STAGE_LABELS[currentStage!]} → ${STAGE_LABELS[nextStage]}`
      );
    } catch (e) {
      toast.error("Could not advance stage", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setStatusBusy(false);
    }
  }, [project, projectId, refreshHub, toast]);

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
        <ProjectHubHeader
          project={project}
          statusBusy={statusBusy}
          onAdvanceClick={() => setAdvanceOpen(true)}
          onStageStatusChange={handleStageStatusChange}
          onNmSubstatusChange={handleNmSubstatusChange}
        />
      </WorkspaceStaggerItem>

      <WorkspaceStaggerItem>
        <ProjectHubTabBar active={activeTab} onChange={handleTabChange} />
      </WorkspaceStaggerItem>

      <WorkspaceStaggerItem>
        {activeTab === "overview" ? <ProjectHubOverviewTab project={project} /> : null}
      </WorkspaceStaggerItem>

      <ProjectHubAdvanceSheet
        open={advanceOpen}
        project={project}
        busy={statusBusy}
        onClose={() => !statusBusy && setAdvanceOpen(false)}
        onConfirm={handleAdvanceConfirm}
      />
    </WorkspacePage>
  );
}
