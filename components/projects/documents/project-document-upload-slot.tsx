"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  PROJECT_DOCUMENT_CATEGORY_LABELS,
  type ProjectDocumentCategory,
} from "@/lib/project-document-types";
import {
  uploadProjectDocument,
  type ProjectDocument,
} from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import { FileUp, ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  projectId: string;
  docCategory: ProjectDocumentCategory;
  label?: string;
  hint?: string;
  existing?: ProjectDocument | null;
  compact?: boolean;
  onUploaded?: () => void;
};

export function ProjectDocumentUploadSlot({
  projectId,
  docCategory,
  label,
  hint,
  existing,
  compact,
  onUploaded,
}: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const title = label ?? PROJECT_DOCUMENT_CATEGORY_LABELS[docCategory];

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const res = await uploadProjectDocument(projectId, file, { docCategory });
      if (!res.ok) throw new Error(res.error ?? "upload_failed");
      await revalidateProjectHubCaches(projectId);
      toast.success("Uploaded", title);
      onUploaded?.();
    } catch (e) {
      toast.error(
        "Upload failed",
        e instanceof Error ? e.message : "Could not upload file"
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewUrl = existing?.download_url;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-3 dark:border-white/10 dark:bg-[#0c1017]",
        compact && "p-2.5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</p>
          {hint ? (
            <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
        {existing ? (
          <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            Saved
          </span>
        ) : null}
      </div>

      {previewUrl && existing?.mime_type?.startsWith("image/") ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={existing.filename}
            className="h-28 w-full object-cover"
          />
        </a>
      ) : previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300"
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          View file
        </a>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx"
        capture={docCategory.endsWith("_photo") ? "environment" : undefined}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        className={cn("mt-2 w-full gap-1.5", compact && "mt-1.5 h-8 text-xs")}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <FileUp className="h-3.5 w-3.5" aria-hidden />
        )}
        {existing ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}

export function ProjectDocumentUploadSlotSkeleton() {
  return <Skeleton className="h-36 rounded-xl" />;
}
