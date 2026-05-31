import { Suspense } from "react";

import { ProjectHubClient } from "@/components/projects/hub/project-hub-client";
import { ProjectHubSkeleton } from "@/components/projects/hub/project-hub-skeleton";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectHubPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<ProjectHubSkeleton />}>
      <ProjectHubClient projectId={id} />
    </Suspense>
  );
}
