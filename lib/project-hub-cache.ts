/**
 * SWR cache revalidation after Project Hub mutations (stage advance, status patches).
 */
import { mutate } from "swr";
import {
  PROJECT_DASHBOARD_STATS_KEY,
  projectActivityKey,
  projectDetailKey,
  projectTasksKey,
} from "@/lib/project-api-client";
import { buildProjectListUrl } from "@/lib/project-list-utils";

export async function revalidateProjectHubCaches(projectId: string): Promise<void> {
  await Promise.all([
    mutate(projectDetailKey(projectId)),
    mutate(projectActivityKey(projectId)),
    mutate(projectTasksKey(projectId)),
    mutate(
      (key) =>
        typeof key === "string" &&
        key.startsWith(`/api/projects/${projectId}/tasks`)
    ),
    mutate(buildProjectListUrl({ view: "active" })),
    mutate(buildProjectListUrl({ view: "hidden" })),
    mutate(buildProjectListUrl({ view: "archived" })),
    mutate(PROJECT_DASHBOARD_STATS_KEY),
  ]);
}
