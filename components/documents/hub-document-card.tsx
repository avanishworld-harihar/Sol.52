"use client";

import { Button } from "@/components/ui/button";
import { DocumentMoveCategoryMenu } from "@/components/documents/document-move-category-menu";
import { DocumentThumbnail } from "@/components/documents/document-thumbnail";
import { HUB_OWNER_LABELS } from "@/lib/documents-hub-ui-categories";
import type { DocumentOwner } from "@/lib/document-category-registry";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

function ownerBadgeClass(owner: DocumentOwner) {
  if (owner === "customer") return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
  if (owner === "project") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200";
  return "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200";
}

export type HubDocumentCardProps = {
  id: string;
  filename: string;
  mimeType: string | null;
  downloadUrl: string | null;
  uploadedAt: string;
  sizeBytes: number;
  owner?: DocumentOwner | null;
  showOwner?: boolean;
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  footer?: React.ReactNode;
};

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

export function HubDocumentCard({
  id,
  filename,
  mimeType,
  downloadUrl,
  uploadedAt,
  sizeBytes,
  owner,
  showOwner = true,
  onDelete,
  deleteLabel = "Remove document",
  footer,
}: HubDocumentCardProps) {
  const [busy, setBusy] = useState(false);
  const ownerLabel = owner ? HUB_OWNER_LABELS[owner] ?? owner : null;

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm(`Remove "${filename}"?`)) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DocumentMoveCategoryMenu documentId={id} filename={filename} className="h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#0c1017]">
        <DocumentThumbnail
          filename={filename}
          mimeType={mimeType}
          downloadUrl={downloadUrl}
        />
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div>
            <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-slate-50">
              {filename}
            </p>
            {showOwner && ownerLabel ? (
              <span
                className={cn(
                  "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                  ownerBadgeClass(owner!)
                )}
              >
                {ownerLabel}
              </span>
            ) : null}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatDocDate(uploadedAt)} · {formatBytes(sizeBytes)}
          </p>
          <div className="mt-auto flex gap-2">
            {downloadUrl ? (
              <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                className="shrink-0 text-rose-600"
                aria-label={deleteLabel}
                onClick={() => void handleDelete()}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            ) : null}
          </div>
          {footer}
        </div>
      </article>
    </DocumentMoveCategoryMenu>
  );
}
