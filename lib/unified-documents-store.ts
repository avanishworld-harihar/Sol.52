/**
 * Customer Documents Hub — read-only unified index (Phase 1).
 * Merges new asset tables (when populated) + legacy customer_files + project_documents.
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createProjectDocumentSignedUrl } from "@/lib/project-document-upload";
import {
  getLabelForCategoryDb,
  legacyCustomerFileTypeToCategory,
  legacyProjectDocCategoryToDb,
  legacyProjectDocDisplayOwner,
  type DocumentCategoryDb,
} from "@/lib/document-category-registry";
import { resolveDefaultOrgId } from "@/lib/project-store";
import type {
  UnifiedDocumentRow,
  UnifiedDocumentsQuery,
  UnifiedDocumentsResult,
} from "@/lib/unified-documents-types";

function db() {
  return createSupabaseAdmin();
}

function encodeCursor(uploadedAt: string, id: string): string {
  return Buffer.from(`${uploadedAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { uploadedAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const [uploadedAt, id] = raw.split("|");
    if (!uploadedAt || !id) return null;
    return { uploadedAt, id };
  } catch {
    return null;
  }
}

function matchesFilters(
  row: UnifiedDocumentRow,
  q: UnifiedDocumentsQuery
): boolean {
  if (q.owner && row.owner !== q.owner) return false;
  if (q.types?.length && !q.types.includes(row.category)) return false;
  if (q.projectId === "none" && row.project_id != null) return false;
  if (q.projectId && q.projectId !== "none" && row.project_id !== q.projectId) return false;
  if (q.from) {
    const t = new Date(row.uploaded_at).getTime();
    if (t < new Date(q.from).getTime()) return false;
  }
  if (q.to) {
    const t = new Date(row.uploaded_at).getTime();
    if (t > new Date(q.to).getTime()) return false;
  }
  if (q.q?.trim()) {
    const needle = q.q.trim().toLowerCase();
    if (!row.filename.toLowerCase().includes(needle)) return false;
  }
  return true;
}

async function signedProjectPath(path: string): Promise<string | null> {
  const r = await createProjectDocumentSignedUrl(path);
  return r.ok ? r.url : null;
}

async function loadProjectLabels(
  customerId: string
): Promise<Map<string, string>> {
  const client = db();
  const map = new Map<string, string>();
  if (!client) return map;
  const { data } = await client
    .from("projects")
    .select("id, official_name, customer_name, lead_id")
    .eq("lead_id", customerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  for (const p of data ?? []) {
    const id = String(p.id);
    const label =
      String(p.official_name ?? "").trim() ||
      String(p.customer_name ?? "").trim() ||
      "Project";
    map.set(id, label);
  }
  return map;
}

async function fetchNewCustomerAssets(
  customerId: string,
  orgId: string | null
): Promise<UnifiedDocumentRow[]> {
  const client = db();
  if (!client) return [];
  let query = client
    .from("customer_assets")
    .select("*")
    .eq("customer_id", customerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (orgId) query = query.eq("organization_id", orgId);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message)) return [];
    console.warn("[unified-documents] customer_assets:", error.message);
    return [];
  }

  const rows: UnifiedDocumentRow[] = [];
  for (const r of data ?? []) {
    const category = String(r.category) as DocumentCategoryDb;
    const path = String(r.storage_path ?? "");
    let downloadUrl: string | null = null;
    if (path.startsWith("http")) {
      downloadUrl = path;
    } else if (path) {
      const admin = db();
      if (admin) {
        const bucket = String(r.storage_bucket ?? "customer-files");
        const { data: signed } = await admin.storage
          .from(bucket)
          .createSignedUrl(path, 3600);
        downloadUrl = signed?.signedUrl ?? null;
      }
    }
    rows.push({
      id: String(r.id),
      owner: "customer",
      category,
      category_label: getLabelForCategoryDb(category),
      filename: String(r.filename),
      mime_type: r.mime_type != null ? String(r.mime_type) : null,
      size_bytes: Number(r.size_bytes) || 0,
      customer_id: customerId,
      project_id: null,
      project_label: null,
      proposal_id: null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "customer_assets",
      legacy: false,
    });
  }
  return rows;
}

async function fetchNewProjectAssets(
  customerId: string,
  orgId: string | null,
  projectLabels: Map<string, string>
): Promise<UnifiedDocumentRow[]> {
  const client = db();
  if (!client) return [];
  let query = client
    .from("project_assets")
    .select("*")
    .eq("customer_id", customerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (orgId) query = query.eq("organization_id", orgId);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message)) return [];
    console.warn("[unified-documents] project_assets:", error.message);
    return [];
  }

  const rows: UnifiedDocumentRow[] = [];
  for (const r of data ?? []) {
    const category = String(r.category) as DocumentCategoryDb;
    const path = String(r.storage_path ?? "");
    const downloadUrl = path ? await signedProjectPath(path) : null;
    const projectId = String(r.project_id);
    rows.push({
      id: String(r.id),
      owner: "project",
      category,
      category_label: getLabelForCategoryDb(category),
      filename: String(r.filename),
      mime_type: r.mime_type != null ? String(r.mime_type) : null,
      size_bytes: Number(r.size_bytes) || 0,
      customer_id: customerId,
      project_id: projectId,
      project_label: projectLabels.get(projectId) ?? null,
      proposal_id: null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "project_assets",
      legacy: false,
    });
  }
  return rows;
}

async function fetchLegacyCustomerFiles(customerId: string): Promise<UnifiedDocumentRow[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from("customer_files")
    .select("*")
    .eq("lead_id", customerId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    if (error.code === "42P01") return [];
    return [];
  }

  return (data ?? []).map((r) => {
    const category = legacyCustomerFileTypeToCategory(String(r.file_type));
    return {
      id: `legacy-cf-${r.id}`,
      owner: "customer" as const,
      category,
      category_label: getLabelForCategoryDb(category),
      filename: String(r.file_name),
      mime_type: r.mime_type != null ? String(r.mime_type) : null,
      size_bytes: Math.round(Number(r.file_size_kb) || 0) * 1024,
      customer_id: customerId,
      project_id: null,
      project_label: null,
      proposal_id: null,
      uploaded_at: String(r.created_at),
      download_url: String(r.file_url),
      link_role: null,
      source: "customer_files" as const,
      legacy: true,
    };
  });
}

async function fetchLegacyProjectDocuments(
  customerId: string,
  projectLabels: Map<string, string>
): Promise<UnifiedDocumentRow[]> {
  const client = db();
  if (!client) return [];
  const { data: projects } = await client
    .from("projects")
    .select("id")
    .eq("lead_id", customerId)
    .limit(50);
  const projectIds = (projects ?? []).map((p) => String(p.id));
  if (projectIds.length === 0) return [];

  const { data, error } = await client
    .from("project_documents")
    .select("*")
    .in("project_id", projectIds)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    if (error.code === "42P01") return [];
    return [];
  }

  const rows: UnifiedDocumentRow[] = [];
  for (const r of data ?? []) {
    const rawCat = String(r.doc_category ?? "other");
    const mapped = legacyProjectDocCategoryToDb(rawCat) ?? "sld";
    const owner = legacyProjectDocDisplayOwner(rawCat);
    const path = String(r.storage_path ?? "");
    const downloadUrl = path ? await signedProjectPath(path) : null;
    const projectId = String(r.project_id);
    rows.push({
      id: `legacy-pd-${r.id}`,
      owner,
      category: mapped,
      category_label: getLabelForCategoryDb(mapped),
      filename: String(r.filename),
      mime_type: r.mime_type != null ? String(r.mime_type) : null,
      size_bytes: Number(r.size_bytes) || 0,
      customer_id: customerId,
      project_id: projectId,
      project_label: projectLabels.get(projectId) ?? null,
      proposal_id: null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "project_documents",
      legacy: true,
    });
  }
  return rows;
}

/** Dedupe: prefer non-legacy when same filename+project+category within 2s */
function dedupeRows(rows: UnifiedDocumentRow[]): UnifiedDocumentRow[] {
  const seen = new Set<string>();
  const out: UnifiedDocumentRow[] = [];
  const sorted = [...rows].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
  for (const row of sorted) {
    if (!row.legacy) {
      const key = `${row.source}:${row.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
      continue;
    }
    const key = `legacy:${row.project_id ?? "c"}:${row.category}:${row.filename}:${row.uploaded_at.slice(0, 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export async function listUnifiedCustomerDocuments(
  customerId: string,
  query: UnifiedDocumentsQuery = {}
): Promise<UnifiedDocumentsResult> {
  const orgId = await resolveDefaultOrgId();
  const projectLabels = await loadProjectLabels(customerId);

  const [a, b, c, d] = await Promise.all([
    fetchNewCustomerAssets(customerId, orgId),
    fetchNewProjectAssets(customerId, orgId, projectLabels),
    fetchLegacyCustomerFiles(customerId),
    fetchLegacyProjectDocuments(customerId, projectLabels),
  ]);

  let merged = dedupeRows([...a, ...b, ...c, ...d]);
  merged = merged.filter((row) => matchesFilters(row, query));
  merged.sort(
    (x, y) => new Date(y.uploaded_at).getTime() - new Date(x.uploaded_at).getTime()
  );

  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  if (cursor) {
    const ct = new Date(cursor.uploadedAt).getTime();
    merged = merged.filter((row) => {
      const t = new Date(row.uploaded_at).getTime();
      return t < ct || (t === ct && row.id < cursor.id);
    });
  }

  const limit = Math.min(100, Math.max(1, query.limit ?? 40));
  const page = merged.slice(0, limit);
  const next =
    merged.length > limit && page.length > 0
      ? encodeCursor(page[page.length - 1]!.uploaded_at, page[page.length - 1]!.id)
      : null;

  const facets = {
    projects: [...projectLabels.entries()].map(([id, label]) => ({ id, label })),
  };

  return {
    items: page,
    next_cursor: next,
    total_in_page: page.length,
    facets,
  };
}
