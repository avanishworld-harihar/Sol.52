"use client";

import { ProjectDocumentUploadSlot } from "@/components/projects/documents/project-document-upload-slot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchProjectDocuments,
  projectDocumentsKey,
  type ProjectDocument,
} from "@/lib/project-api-client";
import { Camera } from "lucide-react";
import { useMemo } from "react";
import useSWR from "swr";

function latestByCategory(
  documents: ProjectDocument[],
  category: string
): ProjectDocument | null {
  const matches = documents.filter((d) => d.doc_category === category);
  if (matches.length === 0) return null;
  return matches.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

export function ProjectSurveyPhotosSection({
  projectId,
  enabled,
}: {
  projectId: string;
  enabled: boolean;
}) {
  const key = enabled ? projectDocumentsKey(projectId) : null;
  const { data, isLoading, mutate } = useSWR(key, fetchProjectDocuments, {
    revalidateOnFocus: false,
    dedupingInterval: 5_000,
  });

  const byCategory = useMemo(() => {
    const docs = data ?? [];
    return {
      roof_photo: latestByCategory(docs, "roof_photo"),
      meter_photo: latestByCategory(docs, "meter_photo"),
      db_photo: latestByCategory(docs, "db_photo"),
    };
  }, [data]);

  if (!enabled) return null;

  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
          <Camera className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
          Survey photos
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {isLoading && !data ? (
          <>
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </>
        ) : (
          (["roof_photo", "meter_photo", "db_photo"] as const).map((cat) => (
            <ProjectDocumentUploadSlot
              key={cat}
              projectId={projectId}
              docCategory={cat}
              compact
              existing={byCategory[cat]}
              onUploaded={() => void mutate()}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
