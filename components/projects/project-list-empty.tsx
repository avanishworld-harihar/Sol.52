"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

export function ProjectListEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="page-lite-item border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]">
      <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center max-sm:gap-1.5 max-sm:py-3 sm:gap-3 sm:p-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 sm:h-12 sm:w-12 sm:rounded-2xl">
          <FolderKanban className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 sm:text-sm">{title}</p>
          {description ? (
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-xs">
              {description}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
