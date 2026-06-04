/**
 * Field-staff category chips for Customer / Project Documents Hub UI.
 * Maps unified rows ↔ hub categories without schema changes.
 */

import type { DocumentCategoryDb } from "@/lib/document-category-registry";
import { documentCategoryDbToProjectDocCategory } from "@/lib/document-category-registry";
import type { ProjectDocumentCategory } from "@/lib/project-document-types";
import type { UnifiedDocumentRow } from "@/lib/unified-documents-types";
import type { ProjectDocument } from "@/lib/project-api-client";

export type CustomerHubCategoryId =
  | "all"
  | "electricity_bill"
  | "aadhaar"
  | "pan"
  | "agreement"
  | "advance_receipt"
  | "site_photo"
  | "other";

export type CustomerHubUploadCategory = Exclude<CustomerHubCategoryId, "all">;

export const CUSTOMER_HUB_CATEGORIES: {
  id: CustomerHubCategoryId;
  label: string;
  uploadable: boolean;
}[] = [
  { id: "all", label: "All", uploadable: false },
  { id: "electricity_bill", label: "Electricity Bill", uploadable: true },
  { id: "aadhaar", label: "Aadhaar", uploadable: true },
  { id: "pan", label: "PAN", uploadable: true },
  { id: "agreement", label: "Agreement", uploadable: true },
  { id: "advance_receipt", label: "Advance Receipt", uploadable: true },
  { id: "site_photo", label: "Site Photo", uploadable: true },
  { id: "other", label: "Other", uploadable: true },
];

const SITE_PHOTO_DB: DocumentCategoryDb[] = [
  "survey_media",
  "roof_photo",
  "meter_photo",
  "db_photo",
];

const KYC_DB: DocumentCategoryDb[] = ["aadhaar", "pan", "agreement", "advance_receipt"];

function hubCategoryFromNotes(notes: string | null | undefined): CustomerHubUploadCategory | null {
  if (!notes?.trim()) return null;
  const m = notes.match(/^\[hub_category:([a-z_]+)\]/);
  if (!m?.[1]) return null;
  const id = m[1] as CustomerHubUploadCategory;
  return CUSTOMER_HUB_CATEGORIES.some((c) => c.id === id && c.uploadable) ? id : null;
}

/** Map unified row → customer hub chip (for counts / filter). */
export function unifiedRowCustomerHubCategory(row: UnifiedDocumentRow): CustomerHubCategoryId {
  const fromNotes = parseHubCategoryNotes(row.notes);
  if (fromNotes) return fromNotes;

  if (row.category === "bill") return "electricity_bill";
  if (row.category === "aadhaar") return "aadhaar";
  if (row.category === "pan") return "pan";
  if (row.category === "agreement") return "agreement";
  if (row.category === "advance_receipt") return "advance_receipt";
  if (SITE_PHOTO_DB.includes(row.category)) return "site_photo";
  if (row.owner === "proposal") return "other";
  if (KYC_DB.includes(row.category)) return row.category as CustomerHubCategoryId;
  const projCat = documentCategoryDbToProjectDocCategory(row.category);
  if (projCat === "electricity_bill") return "electricity_bill";
  if (projCat === "site_other") return "site_photo";
  if (projCat === "aadhaar") return "aadhaar";
  if (projCat === "pan") return "pan";
  if (projCat === "agreement") return "agreement";
  if (projCat === "advance_receipt") return "advance_receipt";
  if (projCat === "other") return "other";
  return "other";
}

export function unifiedRowMatchesCustomerHubCategory(
  row: UnifiedDocumentRow,
  category: CustomerHubCategoryId
): boolean {
  if (category === "all") return true;
  return unifiedRowCustomerHubCategory(row) === category;
}

export function projectDocCustomerHubCategory(doc: ProjectDocument): CustomerHubCategoryId {
  const cat = doc.doc_category as ProjectDocumentCategory;
  if (cat === "electricity_bill") return "electricity_bill";
  if (cat === "aadhaar") return "aadhaar";
  if (cat === "pan") return "pan";
  if (cat === "agreement" || cat === "warranty" || cat === "handover") return "agreement";
  if (cat === "advance_receipt") return "advance_receipt";
  if (
    cat === "site_other" ||
    cat === "roof_photo" ||
    cat === "meter_photo" ||
    cat === "db_photo"
  ) {
    return "site_photo";
  }
  return "other";
}

export function countByCustomerHubCategory(
  rows: UnifiedDocumentRow[]
): Record<CustomerHubCategoryId, number> {
  const counts = Object.fromEntries(
    CUSTOMER_HUB_CATEGORIES.map((c) => [c.id, 0])
  ) as Record<CustomerHubCategoryId, number>;
  counts.all = rows.length;
  for (const row of rows) {
    counts[unifiedRowCustomerHubCategory(row)] += 1;
  }
  return counts;
}

export function countByProjectDocCategory(
  docs: ProjectDocument[]
): Record<string, number> {
  const counts: Record<string, number> = { all: docs.length };
  for (const doc of docs) {
    const cat = doc.doc_category || "other";
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

/** Project doc_category for customer-hub KYC upload (project write path). */
export function customerHubCategoryToProjectDocCategory(
  hubCategory: CustomerHubUploadCategory
): ProjectDocumentCategory | null {
  switch (hubCategory) {
    case "electricity_bill":
      return "electricity_bill";
    case "aadhaar":
      return "aadhaar";
    case "pan":
      return "pan";
    case "agreement":
      return "agreement";
    case "advance_receipt":
      return "advance_receipt";
    case "site_photo":
      return "site_other";
    case "other":
      return "other";
    default:
      return null;
  }
}

export function formatHubCategoryNotes(hubCategory: CustomerHubUploadCategory): string {
  return `[hub_category:${hubCategory}]`;
}

export function parseHubCategoryNotes(notes: string | null | undefined): CustomerHubUploadCategory | null {
  return hubCategoryFromNotes(notes);
}

export const HUB_OWNER_LABELS: Record<string, string> = {
  customer: "Customer",
  project: "Project",
  proposal: "Proposal",
};

export function customerHubUploadAccept(category: CustomerHubUploadCategory): string {
  if (category === "electricity_bill") return "image/*,application/pdf,.pdf";
  if (category === "site_photo") return "image/*";
  return "image/*,application/pdf,.pdf,.doc,.docx";
}

export function projectHubUploadAccept(category: ProjectDocumentCategory): string {
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
