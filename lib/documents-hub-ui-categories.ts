/**
 * Shared Documents Hub category chips — single source of truth with Project Hub.
 * Registry: lib/project-document-types.ts (PROJECT_DOCUMENT_CATEGORIES + labels).
 * Write routing: lib/document-category-registry.ts + lib/document-write-router.ts
 */

import { documentCategoryDbToProjectDocCategory } from "@/lib/document-category-registry";
import {
  PROJECT_DOCUMENT_CATEGORIES,
  PROJECT_DOCUMENT_CATEGORY_LABELS,
  isProjectDocumentCategory,
  type ProjectDocumentCategory,
} from "@/lib/project-document-types";
import type { UnifiedDocumentRow } from "@/lib/unified-documents-types";
import type { ProjectDocument } from "@/lib/project-api-client";

/** Single source of truth for hub chip ids (excludes "all"). */
export { PROJECT_DOCUMENT_CATEGORIES, PROJECT_DOCUMENT_CATEGORY_LABELS };
export type { ProjectDocumentCategory };

export type HubDocumentCategoryFilter = ProjectDocumentCategory | "all";

export type HubCategoryChipDef = {
  id: HubDocumentCategoryFilter;
  label: string;
  uploadable: boolean;
};

/** All + every project document category — identical on Customer and Project hubs. */
export const HUB_DOCUMENT_CATEGORY_CHIPS: HubCategoryChipDef[] = [
  { id: "all", label: "All", uploadable: false },
  ...PROJECT_DOCUMENT_CATEGORIES.map((id) => ({
    id,
    label: PROJECT_DOCUMENT_CATEGORY_LABELS[id],
    uploadable: true as const,
  })),
];

export function parseHubCategoryNotes(
  notes: string | null | undefined
): ProjectDocumentCategory | null {
  if (!notes?.trim()) return null;
  const m = notes.match(/^\[hub_category:([a-z_]+)\]/);
  const id = m?.[1];
  if (id && isProjectDocumentCategory(id)) return id;
  return null;
}

export function formatHubCategoryNotes(docCategory: ProjectDocumentCategory): string {
  return `[hub_category:${docCategory}]`;
}

/** Map unified row → hub chip id (matches project API doc_category rules). */
export function unifiedRowHubCategory(row: UnifiedDocumentRow): ProjectDocumentCategory {
  const fromNotes = parseHubCategoryNotes(row.notes);
  if (fromNotes) return fromNotes;

  const mapped = documentCategoryDbToProjectDocCategory(row.category);
  if (mapped) return mapped;

  if (row.owner === "proposal") return "other";
  return "other";
}

export function unifiedRowMatchesHubCategory(
  row: UnifiedDocumentRow,
  category: HubDocumentCategoryFilter
): boolean {
  if (category === "all") return true;
  return unifiedRowHubCategory(row) === category;
}

export function projectDocHubCategory(doc: ProjectDocument): ProjectDocumentCategory {
  const cat = doc.doc_category;
  if (cat && isProjectDocumentCategory(cat)) return cat;
  return "other";
}

export function countByHubCategoryFromUnifiedRows(
  rows: UnifiedDocumentRow[]
): Record<string, number> {
  const counts: Record<string, number> = { all: rows.length };
  for (const id of PROJECT_DOCUMENT_CATEGORIES) counts[id] = 0;
  for (const row of rows) {
    const hub = unifiedRowHubCategory(row);
    counts[hub] = (counts[hub] ?? 0) + 1;
  }
  return counts;
}

export function countByHubCategoryFromProjectDocs(
  docs: ProjectDocument[]
): Record<string, number> {
  const counts: Record<string, number> = { all: docs.length };
  for (const id of PROJECT_DOCUMENT_CATEGORIES) counts[id] = 0;
  for (const doc of docs) {
    const hub = projectDocHubCategory(doc);
    counts[hub] = (counts[hub] ?? 0) + 1;
  }
  return counts;
}

/** MIME accept string for hub upload zones. */
export function hubUploadAccept(category: ProjectDocumentCategory): string {
  if (
    category === "roof_photo" ||
    category === "meter_photo" ||
    category === "db_photo" ||
    category === "installation_photo" ||
    category === "site_other"
  ) {
    return "image/*";
  }
  return "image/*,application/pdf,.pdf,.doc,.docx";
}

export const HUB_OWNER_LABELS: Record<string, string> = {
  customer: "Customer",
  project: "Project",
  proposal: "Proposal",
};

/** Verification helper: category ids exposed by both hubs. */
export function hubCategoryRegistryIds(): string[] {
  return ["all", ...PROJECT_DOCUMENT_CATEGORIES];
}
