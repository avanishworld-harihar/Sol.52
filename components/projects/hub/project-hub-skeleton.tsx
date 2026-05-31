"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProjectHubSkeleton() {
  return (
    <div className="workspace-page workspace-page--projects animate-pulse space-y-4 p-4 sm:space-y-5 sm:p-0">
      <Skeleton className="h-44 rounded-2xl sm:h-52" />
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
