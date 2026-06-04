"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { FolderOpen, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import { HubCategoryChips } from "@/components/documents/hub-category-chips";
import { HubCategoryUpload } from "@/components/documents/hub-category-upload";
import { HubDocumentCard } from "@/components/documents/hub-document-card";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import type { ProjectDocumentCategory } from "@/lib/project-document-types";
import {
  HUB_DOCUMENT_CATEGORY_CHIPS,
  countByHubCategoryFromProjectDocs,
  hubUploadAccept,
} from "@/lib/documents-hub-ui-categories";
import {
  archiveProjectDocument,
  fetchProjectDocuments,
  projectDocumentsKey,
  uploadProjectDocument,
  type ProjectDocument,
  type ProjectListItem,
} from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import type { DocumentOwner } from "@/lib/document-category-registry";

function inferOwner(doc: ProjectDocument): DocumentOwner {
  if (doc.owner === "customer" || doc.owner === "project" || doc.owner === "proposal") {
    return doc.owner;
  }
  if (doc.source === "customer_assets") return "customer";
  if (doc.source === "proposal_assets") return "proposal";
  return "project";
}

export function ProjectHubDocumentsTab({
  project,
  enabled,
}: {
  project: ProjectListItem;
  enabled: boolean;
}) {
  const toast = useToast();
  const docsKey = enabled ? projectDocumentsKey(project.id) : null;
  const [categoryFilter, setCategoryFilter] = useState<ProjectDocumentCategory | "all">("all");
  const [uploading, setUploading] = useState(false);

  const {
    data: documents,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(docsKey, fetchProjectDocuments, {
    revalidateOnFocus: false,
    dedupingInterval: 3_000,
  });

  const refresh = useCallback(async () => {
    await revalidateProjectHubCaches(project.id);
    await mutate();
  }, [mutate, project.id]);

  const counts = useMemo(
    () => countByHubCategoryFromProjectDocs(documents ?? []),
    [documents]
  );

  const chips = useMemo(
    () =>
      HUB_DOCUMENT_CATEGORY_CHIPS.map((c) => ({
        id: c.id,
        label: c.label,
        count: counts[c.id] ?? 0,
      })),
    [counts]
  );

  const filtered = useMemo(() => {
    const list = documents ?? [];
    if (categoryFilter === "all") return list;
    return list.filter((d) => d.doc_category === categoryFilter);
  }, [documents, categoryFilter]);

  const activeChip = HUB_DOCUMENT_CATEGORY_CHIPS.find((c) => c.id === categoryFilter);
  const canUpload = categoryFilter !== "all" && activeChip?.uploadable;
  const categoryLabel = activeChip?.label ?? "";

  async function handleUpload(file: File) {
    if (categoryFilter === "all") return;
    setUploading(true);
    try {
      const res = await uploadProjectDocument(project.id, file, {
        docCategory: categoryFilter,
      });
      if (!res.ok) throw new Error(res.error ?? "upload_failed");
      toast.success("Uploaded", file.name);
      await refresh();
    } catch (e) {
      toast.error("Upload failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }

  if (!enabled) return null;

  if (isLoading && documents === undefined) {
    return (
      <div id="project-hub-panel-documents" role="tabpanel" className="space-y-4">
        <Skeleton className="h-10 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card
        id="project-hub-panel-documents"
        role="tabpanel"
        className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
            Could not load documents
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      id="project-hub-panel-documents"
      role="tabpanel"
      aria-labelledby="project-hub-tab-documents"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {counts.all ?? 0} file{(counts.all ?? 0) === 1 ? "" : "s"} linked to this project
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isValidating}
          onClick={() => void refresh()}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isValidating && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </div>

      <HubCategoryChips
        chips={chips}
        activeId={categoryFilter}
        onSelect={(id) => setCategoryFilter(id as ProjectDocumentCategory | "all")}
      />

      {canUpload && activeChip ? (
        <HubCategoryUpload
          categoryLabel={categoryLabel}
          accept={hubUploadAccept(categoryFilter as ProjectDocumentCategory)}
          uploading={uploading}
          onFile={handleUpload}
        />
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a category above to upload. Files are stored under that category automatically.
        </p>
      )}

      {filtered.length === 0 ? (
        <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <FolderOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No documents yet</p>
            {canUpload ? (
              <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Upload {categoryLabel.toLowerCase()} files using the area above.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const owner = inferOwner(doc);
            return (
              <HubDocumentCard
                key={doc.id}
                id={doc.id}
                filename={doc.filename}
                mimeType={doc.mime_type}
                downloadUrl={doc.download_url ?? null}
                uploadedAt={doc.created_at}
                sizeBytes={doc.size_bytes}
                owner={owner}
                onDelete={
                  owner !== "proposal"
                    ? async () => {
                        const res = await archiveProjectDocument(project.id, doc.id);
                        if (!res.ok) throw new Error(res.error ?? "delete_failed");
                        await refresh();
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
