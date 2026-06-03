/**
 * Central Document Category Registry — Customer Documents Hub.
 * DB CHECK constraints mirror `db` values (snake_case).
 * API filters may use registry ids (SCREAMING_SNAKE) via normalizeCategoryFilter().
 */

export const DOCUMENT_OWNERS = ["customer", "project", "proposal"] as const;
export type DocumentOwner = (typeof DOCUMENT_OWNERS)[number];

/** Registry id (API / UI filters). */
export const CUSTOMER_DOCUMENT_CATEGORY_IDS = [
  "BILL",
  "ROOF_PHOTO",
  "METER_PHOTO",
  "DB_PHOTO",
  "SURVEY_MEDIA",
] as const;

export const PROJECT_DOCUMENT_CATEGORY_IDS = [
  "AADHAAR",
  "PAN",
  "AGREEMENT",
  "ADVANCE_RECEIPT",
  "SLD",
  "NET_METERING",
  "INSTALLATION_PHOTO",
] as const;

/** Reserved for Phase 3 — no table in Phase 1. */
export const PROPOSAL_DOCUMENT_CATEGORY_IDS = [
  "PROPOSAL_PDF",
  "PROPOSAL_REVISION",
] as const;

export type CustomerDocumentCategoryId = (typeof CUSTOMER_DOCUMENT_CATEGORY_IDS)[number];
export type ProjectDocumentCategoryId = (typeof PROJECT_DOCUMENT_CATEGORY_IDS)[number];
export type ProposalDocumentCategoryId = (typeof PROPOSAL_DOCUMENT_CATEGORY_IDS)[number];
export type DocumentCategoryId =
  | CustomerDocumentCategoryId
  | ProjectDocumentCategoryId
  | ProposalDocumentCategoryId;

export type DocumentCategoryDb =
  | "bill"
  | "roof_photo"
  | "meter_photo"
  | "db_photo"
  | "survey_media"
  | "aadhaar"
  | "pan"
  | "agreement"
  | "advance_receipt"
  | "sld"
  | "net_metering"
  | "installation_photo"
  | "proposal_pdf"
  | "proposal_revision";

const REGISTRY_TO_DB: Record<DocumentCategoryId, DocumentCategoryDb> = {
  BILL: "bill",
  ROOF_PHOTO: "roof_photo",
  METER_PHOTO: "meter_photo",
  DB_PHOTO: "db_photo",
  SURVEY_MEDIA: "survey_media",
  AADHAAR: "aadhaar",
  PAN: "pan",
  AGREEMENT: "agreement",
  ADVANCE_RECEIPT: "advance_receipt",
  SLD: "sld",
  NET_METERING: "net_metering",
  INSTALLATION_PHOTO: "installation_photo",
  PROPOSAL_PDF: "proposal_pdf",
  PROPOSAL_REVISION: "proposal_revision",
};

const DB_TO_REGISTRY: Record<DocumentCategoryDb, DocumentCategoryId> = {
  bill: "BILL",
  roof_photo: "ROOF_PHOTO",
  meter_photo: "METER_PHOTO",
  db_photo: "DB_PHOTO",
  survey_media: "SURVEY_MEDIA",
  aadhaar: "AADHAAR",
  pan: "PAN",
  agreement: "AGREEMENT",
  advance_receipt: "ADVANCE_RECEIPT",
  sld: "SLD",
  net_metering: "NET_METERING",
  installation_photo: "INSTALLATION_PHOTO",
  proposal_pdf: "PROPOSAL_PDF",
  proposal_revision: "PROPOSAL_REVISION",
};

const CATEGORY_OWNER: Record<DocumentCategoryDb, DocumentOwner> = {
  bill: "customer",
  roof_photo: "customer",
  meter_photo: "customer",
  db_photo: "customer",
  survey_media: "customer",
  aadhaar: "project",
  pan: "project",
  agreement: "project",
  advance_receipt: "project",
  sld: "project",
  net_metering: "project",
  installation_photo: "project",
  proposal_pdf: "proposal",
  proposal_revision: "proposal",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryId, string> = {
  BILL: "Electricity bill",
  ROOF_PHOTO: "Roof photo",
  METER_PHOTO: "Meter photo",
  DB_PHOTO: "DB photo",
  SURVEY_MEDIA: "Survey media",
  AADHAAR: "Aadhaar",
  PAN: "PAN",
  AGREEMENT: "Agreement",
  ADVANCE_RECEIPT: "Advance receipt",
  SLD: "SLD",
  NET_METERING: "Net metering",
  INSTALLATION_PHOTO: "Installation photo",
  PROPOSAL_PDF: "Proposal export (PPTX)",
  PROPOSAL_REVISION: "Proposal revision (PPTX)",
};

export function categoryIdToDb(id: string): DocumentCategoryDb | null {
  const key = id.toUpperCase().replace(/-/g, "_") as DocumentCategoryId;
  return REGISTRY_TO_DB[key] ?? null;
}

export function categoryDbToId(db: string): DocumentCategoryId | null {
  const k = db.trim().toLowerCase().replace(/-/g, "_") as DocumentCategoryDb;
  return DB_TO_REGISTRY[k] ?? null;
}

export function getOwnerForCategoryDb(category: string): DocumentOwner | null {
  const k = category.trim().toLowerCase().replace(/-/g, "_") as DocumentCategoryDb;
  return CATEGORY_OWNER[k] ?? null;
}

export function getLabelForCategoryDb(category: string): string {
  const id = categoryDbToId(category);
  if (id) return DOCUMENT_CATEGORY_LABELS[id];
  return category.replace(/_/g, " ");
}

/** Legacy customer_files.file_type → registry db category */
export function legacyCustomerFileTypeToCategory(fileType: string): DocumentCategoryDb {
  switch (fileType) {
    case "bill":
      return "bill";
    case "site_image":
      return "survey_media";
    default:
      return "survey_media";
  }
}

/** Legacy project_documents.doc_category → project registry db where possible */
export function legacyProjectDocCategoryToDb(docCategory: string): DocumentCategoryDb | null {
  const c = docCategory.trim().toLowerCase().replace(/-/g, "_");
  if (getOwnerForCategoryDb(c) === "project") return c as DocumentCategoryDb;
  if (c === "roof_photo" || c === "meter_photo" || c === "db_photo") return c as DocumentCategoryDb;
  if (c === "electricity_bill") return "bill";
  if (c === "site_other") return "survey_media";
  if (
    c === "layout" ||
    c === "structural_drawing" ||
    c === "nm_application" ||
    c === "nm_inspection" ||
    c === "nm_letter"
  ) {
    return "net_metering";
  }
  if (c === "installation_photo" || c === "commissioning") return "installation_photo";
  if (c === "warranty" || c === "handover") return "agreement";
  if (c === "sld") return "sld";
  return null;
}

export function legacyProjectDocDisplayOwner(docCategory: string): DocumentOwner {
  const db = legacyProjectDocCategoryToDb(docCategory);
  if (db && getOwnerForCategoryDb(db) === "customer") return "customer";
  return "project";
}

/** Phase 2 write router: project Hub doc_category → customer_assets vs project_assets */
export function isCustomerOwnedProjectDocCategory(docCategory: string): boolean {
  return legacyProjectDocDisplayOwner(docCategory) === "customer";
}

/** Map project_documents.doc_category to customer_assets.category CHECK value */
export function projectDocCategoryToCustomerAssetCategory(
  docCategory: string
): DocumentCategoryDb | null {
  const db = legacyProjectDocCategoryToDb(docCategory);
  if (!db || getOwnerForCategoryDb(db) !== "customer") return null;
  return db;
}

/** Map project_documents.doc_category to project_assets.category CHECK value */
export function projectDocCategoryToProjectAssetCategory(
  docCategory: string
): DocumentCategoryDb | null {
  const db = legacyProjectDocCategoryToDb(docCategory);
  if (!db || getOwnerForCategoryDb(db) !== "project") return null;
  return db;
}

/** asset_links.link_role values created on project bootstrap */
export const AUTO_LINK_CUSTOMER_CATEGORIES: DocumentCategoryDb[] = [
  "bill",
  "roof_photo",
  "meter_photo",
  "db_photo",
  "survey_media",
];

export type DocumentOwnerFilter = DocumentOwner | "all";

export const FILTER_OWNER_OPTIONS: { value: DocumentOwnerFilter; label: string }[] = [
  { value: "all", label: "All owners" },
  { value: "customer", label: "Customer" },
  { value: "project", label: "Project" },
  { value: "proposal", label: "Proposal" },
];

export const FILTER_TYPE_OPTIONS: { value: DocumentCategoryId; label: string; owner: DocumentOwner }[] = [
  ...CUSTOMER_DOCUMENT_CATEGORY_IDS.map((id) => ({
    value: id,
    label: DOCUMENT_CATEGORY_LABELS[id],
    owner: "customer" as const,
  })),
  ...PROJECT_DOCUMENT_CATEGORY_IDS.map((id) => ({
    value: id,
    label: DOCUMENT_CATEGORY_LABELS[id],
    owner: "project" as const,
  })),
  ...PROPOSAL_DOCUMENT_CATEGORY_IDS.map((id) => ({
    value: id,
    label: DOCUMENT_CATEGORY_LABELS[id],
    owner: "proposal" as const,
  })),
];
