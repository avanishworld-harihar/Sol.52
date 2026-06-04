"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { FolderOpen, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HubCategoryChips } from "@/components/documents/hub-category-chips";
import { HubCategoryUpload } from "@/components/documents/hub-category-upload";
import { HubDocumentCard } from "@/components/documents/hub-document-card";
import { useToast } from "@/components/ui/toast-center";
import {
  fetchCustomerDocuments,
  uploadCustomerHubDocument,
} from "@/lib/customer-documents-client";
import {
  CUSTOMER_HUB_CATEGORIES,
  countByCustomerHubCategory,
  customerHubUploadAccept,
  unifiedRowMatchesCustomerHubCategory,
  type CustomerHubCategoryId,
  type CustomerHubUploadCategory,
} from "@/lib/documents-hub-ui-categories";
import type { UnifiedDocumentRow } from "@/lib/unified-documents-types";

export function CustomerDocumentsHub({ customerId }: { customerId: string }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CustomerHubCategoryId>("all");
  const [cursors, setCursors] = useState<string[]>([]);
  const [extraItems, setExtraItems] = useState<UnifiedDocumentRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const swrKey = [
    "customer-documents",
    customerId,
    searchDebounced,
    categoryFilter,
    cursors[0] ?? "",
  ].join("|");

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    () =>
      fetchCustomerDocuments(customerId, {
        q: searchDebounced || undefined,
        cursor: cursors[cursors.length - 1],
      }),
    { keepPreviousData: true }
  );

  const { data: countData, mutate: mutateCounts } = useSWR(
    `customer-documents-counts-${customerId}`,
    () => fetchCustomerDocuments(customerId, { limit: 500 }),
    { revalidateOnFocus: false, dedupingInterval: 10_000 }
  );

  const pageItems = data?.items ?? [];
  const allItems = useMemo(
    () => (cursors.length <= 1 ? pageItems : [...extraItems, ...pageItems]),
    [cursors.length, extraItems, pageItems]
  );

  const filtered = useMemo(() => {
    const source =
      categoryFilter === "all" && !searchDebounced
        ? allItems
        : (countData?.items ?? allItems);
    return source.filter((row) => unifiedRowMatchesCustomerHubCategory(row, categoryFilter));
  }, [allItems, countData?.items, categoryFilter, searchDebounced]);

  const counts = useMemo(
    () => countByCustomerHubCategory(countData?.items ?? []),
    [countData?.items]
  );

  const chips = useMemo(
    () =>
      CUSTOMER_HUB_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        count: counts[c.id] ?? 0,
      })),
    [counts]
  );

  const activeCategory = CUSTOMER_HUB_CATEGORIES.find((c) => c.id === categoryFilter);
  const canUpload = categoryFilter !== "all" && activeCategory?.uploadable;

  const refreshAll = useCallback(async () => {
    setCursors([]);
    setExtraItems([]);
    await Promise.all([mutate(), mutateCounts()]);
  }, [mutate, mutateCounts]);

  const handleSearchSubmit = useCallback(() => {
    setSearchDebounced(search.trim());
    setCursors([]);
    setExtraItems([]);
  }, [search]);

  const loadMore = useCallback(() => {
    if (!data?.next_cursor) return;
    setExtraItems((prev) => [...prev, ...pageItems]);
    setCursors((prev) => [...prev, data.next_cursor!]);
  }, [data?.next_cursor, pageItems]);

  async function handleUpload(file: File) {
    if (categoryFilter === "all") return;
    setUploading(true);
    try {
      const res = await uploadCustomerHubDocument(
        customerId,
        file,
        categoryFilter as CustomerHubUploadCategory
      );
      if (!res.ok) throw new Error(res.error ?? "upload_failed");
      toast.success("Uploaded", file.name);
      await refreshAll();
    } catch (e) {
      toast.error("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {counts.all} file{counts.all === 1 ? "" : "s"} for this customer
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isValidating}
          onClick={() => void refreshAll()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </Button>
      </div>

      <HubCategoryChips
        chips={chips}
        activeId={categoryFilter}
        onSelect={(id) => {
          setCategoryFilter(id as CustomerHubCategoryId);
          setCursors([]);
          setExtraItems([]);
        }}
      />

      {canUpload && activeCategory ? (
        <HubCategoryUpload
          categoryLabel={activeCategory.label}
          accept={customerHubUploadAccept(categoryFilter as CustomerHubUploadCategory)}
          uploading={uploading}
          onFile={handleUpload}
        />
      ) : categoryFilter === "all" ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a category above to upload. Project and proposal files appear under their categories automatically.
        </p>
      ) : null}

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

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          {error instanceof Error ? error.message : "Could not load documents"}
        </p>
      ) : null}

      {isLoading && filtered.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading documents…
        </div>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-white/15">
          <FolderOpen className="h-10 w-10 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No documents in this category</p>
          {canUpload ? (
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Use the upload area above to add a {activeCategory?.label.toLowerCase()}.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <HubDocumentCard
              key={`${row.source}-${row.id}`}
              id={row.id}
              filename={row.filename}
              mimeType={row.mime_type}
              downloadUrl={row.download_url}
              uploadedAt={row.uploaded_at}
              sizeBytes={row.size_bytes}
              owner={row.owner}
            />
          ))}
        </div>
      )}

      {data?.next_cursor && categoryFilter === "all" && !searchDebounced ? (
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
    </div>
  );
}
