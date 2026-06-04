/**
 * Customer Documents Hub — read-only unified index (Phase 1).
 * Merges customer_assets + project_assets + proposal_assets (+ legacy when enabled).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isDocumentsHubLegacyReadEnabled } from "@/lib/documents-hub-read-config";
import { createProposalAssetSignedUrl } from "@/lib/proposal-asset-upload";
import { createProjectDocumentSignedUrl } from "@/lib/project-document-upload";
import { listProposalAssetsByCustomer } from "@/lib/proposal-asset-store";
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
  UnifiedProjectDocumentsQuery,
  UnifiedProjectDocumentsSummary,
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
      proposal_revision: null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "customer_assets",
      legacy: false,
      notes: r.notes != null ? String(r.notes) : null,
    });
  }
  return rows;
}

async function fetchProposalAssets(
  customerId: string,
  orgId: string | null
): Promise<UnifiedDocumentRow[]> {
  const assets = await listProposalAssetsByCustomer(customerId, orgId);
  const rows: UnifiedDocumentRow[] = [];

  for (const r of assets) {
    const category = String(r.category) as DocumentCategoryDb;
    const path = String(r.storage_path ?? "");
    let downloadUrl: string | null = null;
    if (path) {
      const signed = await createProposalAssetSignedUrl(path);
      downloadUrl = signed.ok ? signed.url : null;
    }
    rows.push({
      id: String(r.id),
      owner: "proposal",
      category,
      category_label: getLabelForCategoryDb(category),
      filename: String(r.filename),
      mime_type: r.mime_type != null ? String(r.mime_type) : null,
      size_bytes: Number(r.size_bytes) || 0,
      customer_id: customerId,
      project_id: null,
      project_label: null,
      proposal_id: String(r.proposal_id),
      proposal_revision: Number(r.revision_number) || null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "proposal_assets",
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
      proposal_revision: null,
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
      proposal_revision: null,
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
      proposal_revision: null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "project_documents",
      legacy: true,
    });
  }
  return rows;
}

async function fetchLegacyProjectDocumentsForProject(
  projectId: string,
  projectLabel: string,
  customerId: string
): Promise<UnifiedDocumentRow[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
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
      project_label: projectLabel,
      proposal_id: null,
      proposal_revision: null,
      uploaded_at: String(r.created_at),
      download_url: downloadUrl,
      link_role: null,
      source: "project_documents",
      legacy: true,
    });
  }
  return rows;
}
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

  const legacyRead = isDocumentsHubLegacyReadEnabled();
  const [a, b, pa, c, d] = await Promise.all([
    fetchNewCustomerAssets(customerId, orgId),
    fetchNewProjectAssets(customerId, orgId, projectLabels),
    fetchProposalAssets(customerId, orgId),
    legacyRead ? fetchLegacyCustomerFiles(customerId) : Promise.resolve([]),
    legacyRead ? fetchLegacyProjectDocuments(customerId, projectLabels) : Promise.resolve([]),
  ]);

  let merged = legacyRead ? dedupeRows([...a, ...b, ...pa, ...c, ...d]) : [...a, ...b, ...pa];
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

function matchesProjectQuery(
  row: UnifiedDocumentRow,
  q: UnifiedProjectDocumentsQuery,
  projectId: string
): boolean {
  if (q.owner && row.owner !== q.owner) return false;
  if (q.category && row.category !== q.category) return false;
  if (q.q?.trim()) {
    const needle = q.q.trim().toLowerCase();
    if (!row.filename.toLowerCase().includes(needle)) return false;
  }
  if (row.owner === "project" && row.project_id && row.project_id !== projectId) {
    return false;
  }
  return true;
}

function summarizeProjectDocuments(items: UnifiedDocumentRow[]): UnifiedProjectDocumentsSummary {
  const by_category: Record<string, number> = {};
  const by_owner: Record<string, number> = {};
  for (const row of items) {
    by_category[row.category] = (by_category[row.category] ?? 0) + 1;
    by_owner[row.owner] = (by_owner[row.owner] ?? 0) + 1;
  }
  return { total: items.length, by_category, by_owner };
}

/**
 * Unified project hub read: project_assets for this project + all customer_assets
 * for linked lead + proposal_assets for linked customer.
 */
export async function listUnifiedProjectDocuments(
  projectId: string,
  query: UnifiedProjectDocumentsQuery = {}
): Promise<{ items: UnifiedDocumentRow[]; summary: UnifiedProjectDocumentsSummary }> {
  const client = db();
  if (!client) {
    return { items: [], summary: { total: 0, by_category: {}, by_owner: {} } };
  }

  const { data: project } = await client
    .from("projects")
    .select("id, lead_id, official_name, customer_name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return { items: [], summary: { total: 0, by_category: {}, by_owner: {} } };
  }

  const leadId = project.lead_id != null ? String(project.lead_id) : null;
  const orgId = await resolveDefaultOrgId();
  const projectLabel =
    String(project.official_name ?? "").trim() ||
    String(project.customer_name ?? "").trim() ||
    "Project";

  const legacyRead = isDocumentsHubLegacyReadEnabled();
  const rows: UnifiedDocumentRow[] = [];

  if (leadId) {
    const projectLabels = new Map([[projectId, projectLabel]]);
    const [customerRows, projectRows, proposalRows, legacyPd, legacyCf] = await Promise.all([
      fetchNewCustomerAssets(leadId, orgId),
      fetchNewProjectAssets(leadId, orgId, projectLabels),
      fetchProposalAssets(leadId, orgId),
      legacyRead ? fetchLegacyProjectDocuments(leadId, projectLabels) : Promise.resolve([]),
      legacyRead ? fetchLegacyCustomerFiles(leadId) : Promise.resolve([]),
    ]);

    rows.push(...customerRows, ...proposalRows, ...legacyCf);
    rows.push(
      ...projectRows.filter((r) => r.project_id === projectId),
      ...legacyPd.filter((r) => r.project_id === projectId)
    );
  } else {
    const orgIdOnly = orgId;
    let queryPa = client
      .from("project_assets")
      .select("*")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (orgIdOnly) queryPa = queryPa.eq("organization_id", orgIdOnly);
    const { data: pas } = await queryPa;
    for (const r of pas ?? []) {
      const category = String(r.category) as DocumentCategoryDb;
      const path = String(r.storage_path ?? "");
      const downloadUrl = path ? await signedProjectPath(path) : null;
      rows.push({
        id: String(r.id),
        owner: "project",
        category,
        category_label: getLabelForCategoryDb(category),
        filename: String(r.filename),
        mime_type: r.mime_type != null ? String(r.mime_type) : null,
        size_bytes: Number(r.size_bytes) || 0,
        customer_id: String(r.customer_id ?? ""),
        project_id: projectId,
        project_label: projectLabel,
        proposal_id: null,
        proposal_revision: null,
        uploaded_at: String(r.created_at),
        download_url: downloadUrl,
        link_role: null,
        source: "project_assets",
        legacy: false,
      });
    }
    if (legacyRead) {
      rows.push(
        ...(await fetchLegacyProjectDocumentsForProject(projectId, projectLabel, ""))
      );
    }
  }

  const deduped = legacyRead ? dedupeRows(rows) : dedupeRowsBySourceId(rows);
  const filtered = deduped
    .filter((row) => matchesProjectQuery(row, query, projectId))
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

  return { items: filtered, summary: summarizeProjectDocuments(filtered) };
}

/** Prefer newest row per source:id (no legacy dedupe key collapse). */
function dedupeRowsBySourceId(rows: UnifiedDocumentRow[]): UnifiedDocumentRow[] {
  const seen = new Set<string>();
  const out: UnifiedDocumentRow[] = [];
  const sorted = [...rows].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
  for (const row of sorted) {
    const key = `${row.source}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export async function getUnifiedProjectDocumentsSummary(
  projectId: string
): Promise<UnifiedProjectDocumentsSummary> {
  const { summary } = await listUnifiedProjectDocuments(projectId);
  return summary;
}
