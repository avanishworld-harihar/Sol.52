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
};

export type ProjectDocumentSummary = {
  total: number;
  by_category: Record<string, number>;
};

export async function getProjectOrgContext(
  projectId: string
): Promise<
  | { ok: true; project: Pick<ProjectRow, "id" | "organization_id" | "current_stage" | "assigned_manager_id" | "assigned_tech_id"> }
  | { ok: false; error: string }
> {
  const client = db();
  if (!client) return { ok: false, error: "db_unavailable" };

  const { data, error } = await client
    .from("projects")
    .select(
      "id, organization_id, current_stage, assigned_manager_id, assigned_tech_id"
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
      "id" | "organization_id" | "current_stage" | "assigned_manager_id" | "assigned_tech_id"
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

export async function listProjectDocuments(
  projectId: string,
  opts?: {
    category?: ProjectDocumentCategory | null;
    stage?: string | null;
    includeArchived?: boolean;
    withUrls?: boolean;
  }
): Promise<ProjectDocumentRow[] | ProjectDocumentWithUrl[]> {
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
  const rows = data as ProjectDocumentRow[];
  if (opts?.withUrls) {
    return attachSignedUrls(rows);
  }
  return rows;
}

export async function getProjectDocumentSummary(
  projectId: string
): Promise<ProjectDocumentSummary> {
  const client = db();
  if (!client) return { total: 0, by_category: {} };

  const { data, error } = await client
    .from("project_documents")
    .select("doc_category")
    .eq("project_id", projectId)
    .is("archived_at", null);

  if (error || !Array.isArray(data)) return { total: 0, by_category: {} };

  const by_category: Record<string, number> = {};
  for (const row of data as { doc_category: string }[]) {
    const cat = row.doc_category || "other";
    by_category[cat] = (by_category[cat] ?? 0) + 1;
  }
  return { total: data.length, by_category };
}

export async function getProjectDocumentById(
  projectId: string,
  documentId: string,
  withUrl = true
): Promise<ProjectDocumentWithUrl | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as ProjectDocumentRow;
  if (!withUrl || row.archived_at) {
    return { ...row, download_url: null };
  }
  const signed = await createProjectDocumentSignedUrl(row.storage_path);
  return { ...row, download_url: signed.ok ? signed.url : null };
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

  const { data, error } = await client
    .from("project_documents")
    .update(payload)
    .eq("project_id", projectId)
    .eq("id", documentId)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return data as ProjectDocumentRow;
}

export async function archiveProjectDocument(
  projectId: string,
  documentId: string
): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_documents")
    .update({ archived_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("id", documentId)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return data as ProjectDocumentRow;
}
