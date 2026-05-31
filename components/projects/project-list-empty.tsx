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
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
          <FolderKanban className="h-6 w-6" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{title}</p>
          {description ? (
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
