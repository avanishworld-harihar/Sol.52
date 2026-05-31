"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProjectOpsDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("page-lite-item space-y-4", className)}>
      <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 min-w-[9.5rem] rounded-xl sm:min-w-0" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-52 rounded-xl lg:col-span-5" />
        <Skeleton className="h-52 rounded-xl lg:col-span-7" />
        <Skeleton className="h-48 rounded-xl lg:col-span-6" />
        <Skeleton className="h-48 rounded-xl lg:col-span-6" />
      </div>
    </div>
  );
}
