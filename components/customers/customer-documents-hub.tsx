"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Building2,
  Download,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchCustomerDocuments } from "@/lib/customer-documents-client";
import {
  FILTER_OWNER_OPTIONS,
  FILTER_TYPE_OPTIONS,
  type DocumentOwner,
} from "@/lib/document-category-registry";
import type { UnifiedDocumentRow } from "@/lib/unified-documents-types";
import { formatCrmDateTime } from "@/lib/crm-datetime";
import { isLegacyDocumentUploadUiEnabled } from "@/lib/documents-hub-legacy-ui-config";
import { CustomerDocumentsHubUpload } from "@/components/customers/customer-documents-hub-upload";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ownerBadgeClass(owner: DocumentOwner) {
  if (owner === "customer") return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
  if (owner === "project") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200";
  return "bg-violet-100 text-violet-800";
}

function DocumentRow({ row }: { row: UnifiedDocumentRow }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-[#141a22]">
          <FileText className="h-5 w-5 text-teal-600" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{row.filename}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-200/80 dark:bg-white/10 dark:text-slate-300">
              {row.category_label}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                ownerBadgeClass(row.owner)
              )}
            >
              {row.owner}
            </span>
            {row.legacy ? (
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Legacy</span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {formatCrmDateTime(row.uploaded_at)}
            {row.size_bytes > 0 ? ` · ${formatSize(row.size_bytes)}` : ""}
          </p>
          {row.project_label ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              <Building2 className="h-3 w-3" aria-hidden />
              {row.project_label}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
        {row.download_url ? (
          <a
            href={row.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 text-xs font-bold text-teal-800 shadow-sm hover:bg-teal-50 dark:border-teal-500/40 dark:bg-teal-950/30 dark:text-teal-100"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Open
          </a>
        ) : null}
        {row.project_id ? (
          <Link
            href={`/projects/${encodeURIComponent(row.project_id)}?tab=docs`}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-[#141a22] dark:text-slate-200"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            Project
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function CustomerDocumentsHub({ customerId }: { customerId: string }) {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"" | DocumentOwner>("");
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [datePreset, setDatePreset] = useState<"" | "7d" | "30d" | "90d">("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [extraItems, setExtraItems] = useState<UnifiedDocumentRow[]>([]);

  const dateRange = useMemo(() => {
    if (!datePreset) return { from: undefined as string | undefined, to: undefined };
    const to = new Date();
    const from = new Date();
    const days = datePreset === "7d" ? 7 : datePreset === "30d" ? 30 : 90;
    from.setDate(from.getDate() - days);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [datePreset]);

  const swrKey = useMemo(() => {
    return [
      "customer-documents",
      customerId,
      searchDebounced,
      ownerFilter,
      typeFilter,
      projectFilter,
      datePreset,
      cursors[0] ?? "",
    ].join("|");
  }, [customerId, searchDebounced, ownerFilter, typeFilter, projectFilter, datePreset, cursors]);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    () =>
      fetchCustomerDocuments(customerId, {
        q: searchDebounced || undefined,
        owner: ownerFilter || undefined,
        types: typeFilter || undefined,
        project_id: projectFilter || undefined,
        from: dateRange.from,
        to: dateRange.to,
        cursor: cursors[cursors.length - 1],
      }),
    { keepPreviousData: true }
  );

  const handleSearchSubmit = useCallback(() => {
    setSearchDebounced(search.trim());
    setCursors([]);
    setExtraItems([]);
  }, [search]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setSearchDebounced("");
    setOwnerFilter("");
    setTypeFilter("");
    setProjectFilter("");
    setDatePreset("");
    setCursors([]);
    setExtraItems([]);
    void mutate();
  }, [mutate]);

  const pageItems = data?.items ?? [];
  const allItems = useMemo(
    () => (cursors.length <= 1 ? pageItems : [...extraItems, ...pageItems]),
    [cursors.length, extraItems, pageItems]
  );

  const loadMore = useCallback(() => {
    if (!data?.next_cursor) return;
    setExtraItems((prev) => [...prev, ...pageItems]);
    setCursors((prev) => [...prev, data.next_cursor!]);
  }, [data?.next_cursor, pageItems]);

  const projects = data?.facets.projects ?? [];

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
        Customer, project, and proposal files from v2 asset tables. Legacy tables are not shown when Phase 5A read is off.
      </p>

      {!isLegacyDocumentUploadUiEnabled() ? (
        <CustomerDocumentsHubUpload customerId={customerId} onUploaded={() => void mutate()} />
      ) : null}

      <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 dark:border-white/10 dark:bg-[#0c1017]">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              placeholder="Search by filename…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium dark:border-white/10 dark:bg-white/5"
              aria-label="Search documents by filename"
            />
          </div>
          <Button type="button" size="sm" className="h-10 shrink-0" onClick={handleSearchSubmit}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <Filter className="h-3 w-3" aria-hidden />
            Filters
          </span>
          <select
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value as "" | DocumentOwner);
              setCursors([]);
              setExtraItems([]);
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-white/10 dark:bg-[#141a22]"
            aria-label="Filter by owner"
          >
            {FILTER_OWNER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value === "all" ? "" : o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCursors([]);
              setExtraItems([]);
            }}
            className="h-8 max-w-[11rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-white/10 dark:bg-[#141a22]"
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {FILTER_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setCursors([]);
              setExtraItems([]);
            }}
            className="h-8 max-w-[10rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-white/10 dark:bg-[#141a22]"
            aria-label="Filter by project"
          >
            <option value="">All projects</option>
            <option value="none">Customer only</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as "" | "7d" | "30d" | "90d");
              setCursors([]);
              setExtraItems([]);
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-white/10 dark:bg-[#141a22]"
            aria-label="Filter by upload date"
          >
            <option value="">Any date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="h-8 rounded-lg px-2 text-xs font-bold text-teal-700 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          {error instanceof Error ? error.message : "Could not load documents"}
        </p>
      ) : null}

      {isLoading && allItems.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading documents…
        </div>
      ) : null}

      {!isLoading && allItems.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-white/15">
          <FolderOpen className="h-10 w-10 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No documents found</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Try clearing filters or upload files using the sections below.
          </p>
        </div>
      ) : (
        <ul className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto overscroll-contain pr-1">
          {allItems.map((row) => (
            <DocumentRow key={`${row.source}-${row.id}`} row={row} />
          ))}
        </ul>
      )}

      {data?.next_cursor ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isValidating}
          onClick={loadMore}
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </>
          ) : (
            "Load more"
          )}
        </Button>
      ) : null}

      <p className="text-center text-[10px] font-semibold text-slate-400">
        Showing {allItems.length} file{allItems.length === 1 ? "" : "s"}
        {isValidating ? " · updating…" : ""}
      </p>
    </div>
  );
}
