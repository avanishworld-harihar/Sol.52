/**
 * Sol.52 — Phase 3A-5.1 Project Documents store (SERVER-ONLY).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import {
  createProjectDocumentSignedUrl,
} from "@/lib/project-document-upload";
import type { ProjectDocumentCategory } from "@/lib/project-document-types";
import type { ProjectRow } from "@/lib/project-store";
import { isDocumentsHubLegacyReadEnabled } from "@/lib/documents-hub-read-config";
import { isDocumentsHubV2WriteEnabled } from "@/lib/documents-hub-write-config";
import {
  listProjectAssets,
  getProjectAssetById,
  archiveProjectAsset,
  projectAssetToLegacyDocumentRow,
} from "@/lib/project-asset-store";
import { listLinkedCustomerAssetsForProject } from "@/lib/asset-link-store";
import { archiveCustomerAsset, getCustomerAssetById } from "@/lib/customer-asset-store";
import { archiveProposalAsset, getProposalAssetById } from "@/lib/proposal-asset-store";
import {
  documentCategoryDbToProjectDocCategory,
  projectDocCategoryToDbCategory,
} from "@/lib/document-category-registry";
import type { DocumentOwner } from "@/lib/document-category-registry";
import {
  listUnifiedProjectDocuments,
} from "@/lib/unified-documents-store";
import type { UnifiedDocumentRow } from "@/lib/unified-documents-types";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export interface ProjectDocumentRow {
  id: string;
  organization_id: string;
  project_id: string;
  doc_category: string;
  stage_at_upload: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_id: string | null;
  notes: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  archived_at: string | null;
  created_at: string;
}

export type ProjectDocumentWithUrl = ProjectDocumentRow & {
  download_url: string | null;
  owner?: DocumentOwner;
  category_label?: string;
  source?: string;
};

export type ProjectDocumentSummary = {
  total: number;
  by_category: Record<string, number>;
  by_owner?: Record<string, number>;
};

function unifiedRowToProjectDocument(
  row: UnifiedDocumentRow,
  projectId: string,
  orgId: string
): ProjectDocumentWithUrl {
  const docCategory =
    documentCategoryDbToProjectDocCategory(row.category) ?? row.category;
  return {
    id: row.id,
    organization_id: orgId,
    project_id: row.project_id ?? projectId,
    doc_category: docCategory,
    stage_at_upload: "survey",
    storage_path: "",
    filename: row.filename,
    mime_type: row.mime_type ?? "application/octet-stream",
    size_bytes: row.size_bytes,
    uploaded_by_id: null,
    notes: null,
    linked_entity_type: row.source,
    linked_entity_id: row.proposal_id,
    archived_at: null,
    created_at: row.uploaded_at,
    download_url: row.download_url,
    owner: row.owner,
    category_label: row.category_label,
    source: row.source,
  };
}

function stripLegacyDocId(documentId: string): string {
  if (documentId.startsWith("legacy-pd-")) return documentId.slice("legacy-pd-".length);
  if (documentId.startsWith("legacy-cf-")) return documentId.slice("legacy-cf-".length);
  return documentId;
}

export async function getProjectOrgContext(
  projectId: string
): Promise<
  | {
      ok: true;
      project: Pick<
        ProjectRow,
        | "id"
        | "organization_id"
        | "current_stage"
        | "assigned_manager_id"
        | "assigned_tech_id"
        | "lead_id"
      >;
    }
  | { ok: false; error: string }
> {
  const client = db();
  if (!client) return { ok: false, error: "db_unavailable" };

  const { data, error } = await client
    .from("projects")
    .select(
      "id, organization_id, current_stage, assigned_manager_id, assigned_tech_id, lead_id"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "project_not_found" };
  const orgId = (data as { organization_id: string | null }).organization_id;
  if (!orgId) return { ok: false, error: "project_not_found_or_no_org" };

  return {
    ok: true,
    project: data as Pick<
      ProjectRow,
      | "id"
      | "organization_id"
      | "current_stage"
      | "assigned_manager_id"
      | "assigned_tech_id"
      | "lead_id"
    >,
  };
}

async function attachSignedUrls(
  rows: ProjectDocumentRow[]
): Promise<ProjectDocumentWithUrl[]> {
  const out: ProjectDocumentWithUrl[] = [];
  for (const row of rows) {
    if (row.archived_at) {
      out.push({ ...row, download_url: null });
      continue;
    }
    const signed = await createProjectDocumentSignedUrl(row.storage_path);
    out.push({
      ...row,
      download_url: signed.ok ? signed.url : null,
    });
  }
  return out;
}

async function fetchLegacyProjectDocumentRows(
  projectId: string,
  opts?: {
    category?: ProjectDocumentCategory | null;
    stage?: string | null;
    includeArchived?: boolean;
  }
): Promise<ProjectDocumentRow[]> {
  const client = db();
  if (!client) return [];

  let query = client
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (!opts?.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (opts?.category) {
    query = query.eq("doc_category", opts.category);
  }
  if (opts?.stage) {
    query = query.eq("stage_at_upload", opts.stage);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];
  return data as ProjectDocumentRow[];
}

async function listV2ProjectDocumentRows(
  projectId: string,
  opts?: {
    category?: ProjectDocumentCategory | null;
    legacyIds?: Set<string>;
  }
): Promise<ProjectDocumentRow[]> {
  const legacyIds = opts?.legacyIds ?? new Set<string>();
  const v2Rows: ProjectDocumentRow[] = [];

  const assets = await listProjectAssets(projectId, {
    category: opts?.category ?? null,
  });
  for (const a of assets) {
    if (legacyIds.has(a.id)) continue;
    v2Rows.push(projectAssetToLegacyDocumentRow(a) as unknown as ProjectDocumentRow);
  }

  const linked = await listLinkedCustomerAssetsForProject(projectId);
  for (const { link, asset } of linked) {
    if (legacyIds.has(asset.id)) continue;
    if (opts?.category && asset.category !== opts.category) continue;
    v2Rows.push({
      id: asset.id,
      organization_id: link.organization_id,
      project_id: projectId,
      doc_category: asset.category,
      stage_at_upload: "survey",
      storage_path: asset.storage_path,
      filename: asset.filename,
      mime_type: asset.mime_type,
      size_bytes: asset.size_bytes,
      uploaded_by_id: asset.uploaded_by_id,
      notes: asset.notes,
      linked_entity_type: "asset_link",
      linked_entity_id: link.id,
      archived_at: null,
      created_at: asset.created_at,
    });
  }

  return v2Rows;
}

export async function listProjectDocuments(
  projectId: string,
  opts?: {
    category?: ProjectDocumentCategory | null;
    stage?: string | null;
    includeArchived?: boolean;
    withUrls?: boolean;
    owner?: DocumentOwner | null;
    q?: string | null;
  }
): Promise<ProjectDocumentRow[] | ProjectDocumentWithUrl[]> {
  const v2Write = isDocumentsHubV2WriteEnabled();

  if (v2Write && !opts?.includeArchived) {
    const ctx = await getProjectOrgContext(projectId);
    const orgId = ctx.ok ? ctx.project.organization_id! : "";
    const dbCategory = opts?.category ? projectDocCategoryToDbCategory(opts.category) : null;
    const { items } = await listUnifiedProjectDocuments(projectId, {
      owner: opts?.owner ?? null,
      category: dbCategory,
      q: opts?.q ?? undefined,
    });
    const mapped = items.map((row) => unifiedRowToProjectDocument(row, projectId, orgId));
    if (opts?.stage) {
      return mapped.filter((r) => r.stage_at_upload === opts.stage);
    }
    return mapped;
  }

  const legacyRead = isDocumentsHubLegacyReadEnabled();

  const legacyRows = legacyRead
    ? await fetchLegacyProjectDocumentRows(projectId, opts)
    : [];

  if (!v2Write) {
    if (opts?.withUrls) return attachSignedUrls(legacyRows);
    return legacyRows;
  }

  const legacyIds = new Set(legacyRows.map((r) => r.id));
  const v2Rows = await listV2ProjectDocumentRows(projectId, {
    category: opts?.category ?? null,
    legacyIds,
  });

  const merged = [...v2Rows, ...legacyRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (opts?.withUrls) {
    return attachSignedUrls(merged);
  }
  return merged;
}

export async function getProjectDocumentSummary(
  projectId: string
): Promise<ProjectDocumentSummary> {
  if (isDocumentsHubV2WriteEnabled()) {
    const { summary } = await listUnifiedProjectDocuments(projectId);
    const by_category: Record<string, number> = {};
    for (const [cat, n] of Object.entries(summary.by_category)) {
      const projCat = documentCategoryDbToProjectDocCategory(cat) ?? cat;
      by_category[projCat] = (by_category[projCat] ?? 0) + n;
    }
    return {
      total: summary.total,
      by_category,
      by_owner: summary.by_owner,
    };
  }

  const rows = await listProjectDocuments(projectId);
  const by_category: Record<string, number> = {};
  for (const row of rows) {
    const cat = row.doc_category || "other";
    by_category[cat] = (by_category[cat] ?? 0) + 1;
  }
  return { total: rows.length, by_category };
}

export async function getProjectDocumentById(
  projectId: string,
  documentId: string,
  withUrl = true
): Promise<ProjectDocumentWithUrl | null> {
  const client = db();
  if (!client) return null;

  const ctx = await getProjectOrgContext(projectId);
  const leadId =
    ctx.ok && ctx.project.lead_id != null ? String(ctx.project.lead_id) : null;
  const orgId = ctx.ok ? ctx.project.organization_id! : "";

  const legacyDocId = stripLegacyDocId(documentId);

  if (isDocumentsHubLegacyReadEnabled()) {
    const { data, error } = await client
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", legacyDocId)
      .maybeSingle();

    if (!error && data) {
      const row = data as ProjectDocumentRow;
      if (!withUrl || row.archived_at) {
        return { ...row, download_url: null };
      }
      const signed = await createProjectDocumentSignedUrl(row.storage_path);
      return { ...row, download_url: signed.ok ? signed.url : null };
    }
  }

  if (isDocumentsHubV2WriteEnabled()) {
    const asset = await getProjectAssetById(projectId, documentId);
    if (asset) {
      const row = projectAssetToLegacyDocumentRow(asset) as unknown as ProjectDocumentRow;
      if (!withUrl) return { ...row, download_url: null, owner: "project", source: "project_assets" };
      const signed = await createProjectDocumentSignedUrl(row.storage_path);
      return {
        ...row,
        download_url: signed.ok ? signed.url : null,
        owner: "project",
        source: "project_assets",
      };
    }

    const customerAsset = await getCustomerAssetById(documentId);
    if (customerAsset && leadId && customerAsset.customer_id === leadId) {
      const docCategory =
        documentCategoryDbToProjectDocCategory(customerAsset.category) ?? customerAsset.category;
      const row: ProjectDocumentRow = {
        id: customerAsset.id,
        organization_id: customerAsset.organization_id,
        project_id: projectId,
        doc_category: docCategory,
        stage_at_upload: "survey",
        storage_path: customerAsset.storage_path,
        filename: customerAsset.filename,
        mime_type: customerAsset.mime_type,
        size_bytes: customerAsset.size_bytes,
        uploaded_by_id: customerAsset.uploaded_by_id,
        notes: customerAsset.notes,
        linked_entity_type: "customer_assets",
        linked_entity_id: null,
        archived_at: null,
        created_at: customerAsset.created_at,
      };
      if (!withUrl) {
        return { ...row, download_url: null, owner: "customer", source: "customer_assets" };
      }
      let url: string | null = null;
      if (customerAsset.storage_path.startsWith("http")) {
        url = customerAsset.storage_path;
      } else if (customerAsset.storage_path) {
        const bucket = customerAsset.storage_bucket || "customer-files";
        const { data: signed } = await client.storage
          .from(bucket)
          .createSignedUrl(customerAsset.storage_path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return {
        ...row,
        download_url: url,
        owner: "customer",
        source: "customer_assets",
      };
    }

    const proposalAsset = await getProposalAssetById(documentId);
    if (proposalAsset && leadId && proposalAsset.customer_id === leadId) {
      const docCategory =
        documentCategoryDbToProjectDocCategory(proposalAsset.category) ?? "other";
      const row: ProjectDocumentRow = {
        id: proposalAsset.id,
        organization_id: proposalAsset.organization_id,
        project_id: projectId,
        doc_category: docCategory,
        stage_at_upload: "survey",
        storage_path: proposalAsset.storage_path,
        filename: proposalAsset.filename,
        mime_type: proposalAsset.mime_type,
        size_bytes: proposalAsset.size_bytes,
        uploaded_by_id: null,
        notes: null,
        linked_entity_type: "proposal_assets",
        linked_entity_id: proposalAsset.proposal_id,
        archived_at: null,
        created_at: proposalAsset.created_at,
      };
      if (!withUrl) {
        return { ...row, download_url: null, owner: "proposal", source: "proposal_assets" };
      }
      const { createProposalAssetSignedUrl } = await import("@/lib/proposal-asset-upload");
      const signed = await createProposalAssetSignedUrl(proposalAsset.storage_path);
      return {
        ...row,
        download_url: signed.ok ? signed.url : null,
        owner: "proposal",
        source: "proposal_assets",
      };
    }

    const linked = await listLinkedCustomerAssetsForProject(projectId);
    const hit = linked.find((x) => x.asset.id === documentId);
    if (hit) {
      const row: ProjectDocumentRow = {
        id: hit.asset.id,
        organization_id: hit.link.organization_id,
        project_id: projectId,
        doc_category:
          documentCategoryDbToProjectDocCategory(hit.asset.category) ?? hit.asset.category,
        stage_at_upload: "survey",
        storage_path: hit.asset.storage_path,
        filename: hit.asset.filename,
        mime_type: hit.asset.mime_type,
        size_bytes: hit.asset.size_bytes,
        uploaded_by_id: hit.asset.uploaded_by_id,
        notes: hit.asset.notes,
        linked_entity_type: "asset_link",
        linked_entity_id: hit.link.id,
        archived_at: null,
        created_at: hit.asset.created_at,
      };
      if (!withUrl) return { ...row, download_url: null, owner: "customer", source: "customer_assets" };
      let url: string | null = null;
      if (hit.asset.storage_path && !hit.asset.storage_path.startsWith("http")) {
        const bucket = hit.asset.storage_bucket || "customer-files";
        const { data: signed } = await client.storage
          .from(bucket)
          .createSignedUrl(hit.asset.storage_path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return { ...row, download_url: url, owner: "customer", source: "customer_assets" };
    }

    if (leadId && orgId) {
      const { items } = await listUnifiedProjectDocuments(projectId);
      const hitRow = items.find((r) => r.id === documentId);
      if (hitRow) {
        return unifiedRowToProjectDocument(hitRow, projectId, orgId);
      }
    }
  }

  return null;
}

export async function insertProjectDocument(input: {
  organizationId: string;
  projectId: string;
  docCategory: ProjectDocumentCategory;
  stageAtUpload: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById?: string | null;
  notes?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_documents")
    .insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      doc_category: input.docCategory,
      stage_at_upload: input.stageAtUpload,
      storage_path: input.storagePath,
      filename: input.filename,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      uploaded_by_id: input.uploadedById ?? null,
      notes: input.notes?.trim() || null,
      linked_entity_type: input.linkedEntityType ?? null,
      linked_entity_id: input.linkedEntityId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return data as ProjectDocumentRow;
}

export async function updateProjectDocumentMeta(
  projectId: string,
  documentId: string,
  patch: {
    doc_category?: ProjectDocumentCategory;
    notes?: string | null;
  }
): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  const payload: Record<string, unknown> = {};
  if (patch.doc_category) payload.doc_category = patch.doc_category;
  if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null;

  if (isDocumentsHubLegacyReadEnabled()) {
    const { data, error } = await client
      .from("project_documents")
      .update(payload)
      .eq("project_id", projectId)
      .eq("id", documentId)
      .is("archived_at", null)
      .select("*")
      .maybeSingle();

    if (!error && data) return data as ProjectDocumentRow;
  }

  if (isDocumentsHubV2WriteEnabled()) {
    const asset = await getProjectAssetById(projectId, documentId);
    if (asset) {
      return projectAssetToLegacyDocumentRow(asset) as unknown as ProjectDocumentRow;
    }
  }

  return null;
}

export async function archiveProjectDocument(
  projectId: string,
  documentId: string
): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  if (isDocumentsHubLegacyReadEnabled()) {
    const { data, error } = await client
      .from("project_documents")
      .update({ archived_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("id", stripLegacyDocId(documentId))
      .is("archived_at", null)
      .select("*")
      .maybeSingle();

    if (!error && data) return data as ProjectDocumentRow;
  }

  if (isDocumentsHubV2WriteEnabled()) {
    const asset = await getProjectAssetById(projectId, documentId);
    if (asset) {
      const ok = await archiveProjectAsset(documentId);
      if (!ok) return null;
      return { ...asset, archived_at: new Date().toISOString() } as unknown as ProjectDocumentRow;
    }

    const customerAsset = await getCustomerAssetById(documentId);
    if (customerAsset) {
      const ctx = await getProjectOrgContext(projectId);
      const leadId =
        ctx.ok && ctx.project.lead_id != null ? String(ctx.project.lead_id) : null;
      if (leadId && customerAsset.customer_id === leadId) {
        const ok = await archiveCustomerAsset(documentId);
        if (!ok) return null;
        return {
          id: customerAsset.id,
          organization_id: customerAsset.organization_id,
          project_id: projectId,
          doc_category:
            documentCategoryDbToProjectDocCategory(customerAsset.category) ??
            customerAsset.category,
          stage_at_upload: "survey",
          storage_path: customerAsset.storage_path,
          filename: customerAsset.filename,
          mime_type: customerAsset.mime_type,
          size_bytes: customerAsset.size_bytes,
          uploaded_by_id: customerAsset.uploaded_by_id,
          notes: customerAsset.notes,
          linked_entity_type: "customer_assets",
          linked_entity_id: null,
          archived_at: new Date().toISOString(),
          created_at: customerAsset.created_at,
        };
      }
    }

    const proposalAsset = await getProposalAssetById(documentId);
    if (proposalAsset) {
      const ctx = await getProjectOrgContext(projectId);
      const leadId =
        ctx.ok && ctx.project.lead_id != null ? String(ctx.project.lead_id) : null;
      if (leadId && proposalAsset.customer_id === leadId) {
        const ok = await archiveProposalAsset(documentId);
        if (!ok) return null;
        return {
          id: proposalAsset.id,
          organization_id: proposalAsset.organization_id,
          project_id: projectId,
          doc_category:
            documentCategoryDbToProjectDocCategory(proposalAsset.category) ?? "other",
          stage_at_upload: "survey",
          storage_path: proposalAsset.storage_path,
          filename: proposalAsset.filename,
          mime_type: proposalAsset.mime_type,
          size_bytes: proposalAsset.size_bytes,
          uploaded_by_id: null,
          notes: null,
          linked_entity_type: "proposal_assets",
          linked_entity_id: proposalAsset.proposal_id,
          archived_at: new Date().toISOString(),
          created_at: proposalAsset.created_at,
        };
      }
    }

    const linked = await listLinkedCustomerAssetsForProject(projectId);
    const hit = linked.find((x) => x.asset.id === documentId);
    if (hit) {
      const ok = await archiveCustomerAsset(documentId);
      if (!ok) return null;
      return {
        id: hit.asset.id,
        organization_id: hit.link.organization_id,
        project_id: projectId,
        doc_category:
          documentCategoryDbToProjectDocCategory(hit.asset.category) ?? hit.asset.category,
        stage_at_upload: "survey",
        storage_path: hit.asset.storage_path,
        filename: hit.asset.filename,
        mime_type: hit.asset.mime_type,
        size_bytes: hit.asset.size_bytes,
        uploaded_by_id: hit.asset.uploaded_by_id,
        notes: hit.asset.notes,
        linked_entity_type: null,
        linked_entity_id: null,
        archived_at: new Date().toISOString(),
        created_at: hit.asset.created_at,
      };
    }
  }

  return null;
}
