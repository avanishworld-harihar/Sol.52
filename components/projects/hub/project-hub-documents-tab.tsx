"use client";

import { ProjectDocumentUploadSlot } from "@/components/projects/documents/project-document-upload-slot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  PROJECT_DOCUMENT_CATEGORIES,
  PROJECT_DOCUMENT_CATEGORY_LABELS,
  type ProjectDocumentCategory,
} from "@/lib/project-document-types";
import {
  archiveProjectDocument,
  fetchProjectDocuments,
  projectDocumentsKey,
  uploadProjectDocument,
  type ProjectDocument,
  type ProjectListItem,
} from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import { isLegacyDocumentUploadUiEnabled } from "@/lib/documents-hub-legacy-ui-config";
import {
  FileText,
  FolderOpen,
  ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

function formatDocDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentCard({
  doc,
  projectId,
  onArchived,
}: {
  doc: ProjectDocument;
  projectId: string;
  onArchived: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const label =
    PROJECT_DOCUMENT_CATEGORY_LABELS[doc.doc_category as ProjectDocumentCategory] ??
    doc.doc_category.replace(/_/g, " ");
  const isImage = doc.mime_type.startsWith("image/");

  async function handleDelete() {
    if (!window.confirm(`Remove "${doc.filename}"?`)) return;
    setBusy(true);
    try {
      const res = await archiveProjectDocument(projectId, doc.id);
      if (!res.ok) throw new Error(res.error ?? "delete_failed");
      await revalidateProjectHubCaches(projectId);
      toast.success("Document removed");
      onArchived();
    } catch (e) {
      toast.error(
        "Could not remove",
        e instanceof Error ? e.message : "Delete failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#0c1017]">
      {isImage && doc.download_url ? (
        <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.download_url}
            alt={doc.filename}
            className="h-32 w-full object-cover"
          />
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center bg-slate-50 dark:bg-white/5">
          <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-slate-50">
            {doc.filename}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          {formatDocDate(doc.created_at)} · {formatBytes(doc.size_bytes)}
        </p>
        <div className="mt-auto flex gap-2">
          {doc.download_url ? (
            <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" asChild>
              <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="shrink-0 text-rose-600"
            aria-label="Remove document"
            onClick={() => void handleDelete()}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
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
  const [categoryFilter, setCategoryFilter] = useState<ProjectDocumentCategory | "all">(
    "all"
  );

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

  const filtered = useMemo(() => {
    const list = documents ?? [];
    if (categoryFilter === "all") return list;
    return list.filter((d) => d.doc_category === categoryFilter);
  }, [documents, categoryFilter]);

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
          {(documents ?? []).length} file{(documents ?? []).length === 1 ? "" : "s"} on this project
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

      {isLegacyDocumentUploadUiEnabled() ? (
        <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <ImageIcon className="h-4 w-4 text-sky-600" aria-hidden />
              Quick upload
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <ProjectDocumentUploadSlot
              projectId={project.id}
              docCategory="roof_photo"
              onUploaded={() => void refresh()}
            />
            <ProjectDocumentUploadSlot
              projectId={project.id}
              docCategory="meter_photo"
              onUploaded={() => void refresh()}
            />
            <ProjectDocumentUploadSlot
              projectId={project.id}
              docCategory="db_photo"
              onUploaded={() => void refresh()}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Survey photos upload on the Survey tab. Other files appear here from v2 project assets and the customer Documents Hub.
        </p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold",
            categoryFilter === "all"
              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
              : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-400"
          )}
        >
          All
        </button>
        {PROJECT_DOCUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold",
              categoryFilter === cat
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-400"
            )}
          >
            {PROJECT_DOCUMENT_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <FolderOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No documents yet</p>
            <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Upload survey photos, bills, net-metering letters, and installation images here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              projectId={project.id}
              onArchived={() => void refresh()}
            />
          ))}
        </div>
      )}

      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardContent className="p-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Upload other file
            </span>
            <input
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void (async () => {
                  const res = await uploadProjectDocument(project.id, file, {
                    docCategory: "other",
                  });
                  if (res.ok) {
                    toast.success("Uploaded", file.name);
                    await refresh();
                  } else {
                    toast.error("Upload failed", res.error ?? "Unknown error");
                  }
                  e.target.value = "";
                })();
              }}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
