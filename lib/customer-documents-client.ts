import type { UnifiedDocumentsResult } from "@/lib/unified-documents-types";
import type { DocumentOwner } from "@/lib/document-category-registry";

export type CustomerDocumentsQuery = {
  q?: string;
  types?: string;
  project_id?: string;
  owner?: DocumentOwner | "";
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
};

export async function uploadCustomerHubDocument(
  customerId: string,
  file: File,
  hubCategory: string
): Promise<{ ok: boolean; error?: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("hub_category", hubCategory);
  const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}/files/upload`, {
    method: "POST",
    body: form,
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !json.ok) {
    return { ok: false, error: json.error ?? "upload_failed" };
  }
  return { ok: true };
}

export async function fetchCustomerDocuments(
  customerId: string,
  query: CustomerDocumentsQuery = {}
): Promise<UnifiedDocumentsResult> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.types) params.set("types", query.types);
  if (query.project_id) params.set("project_id", query.project_id);
  if (query.owner) params.set("owner", query.owner);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.cursor) params.set("cursor", query.cursor);
  params.set("limit", String(query.limit ?? 40));

  const res = await fetch(
    `/api/customers/${encodeURIComponent(customerId)}/documents?${params.toString()}`,
    { cache: "no-store" }
  );
  const json = (await res.json()) as {
    ok?: boolean;
    data?: UnifiedDocumentsResult;
    error?: string;
  };
  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json.error ?? "documents_fetch_failed");
  }
  return json.data;
}
