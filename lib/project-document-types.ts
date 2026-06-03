/**
 * Project document categories and MIME allowlists (Phase 3A-5.1).
 */

export const PROJECT_DOCUMENT_CATEGORIES = [
  "roof_photo",
  "meter_photo",
  "db_photo",
  "electricity_bill",
  "site_other",
  /* Phase 2 registry-aligned project deliverables (→ project_assets) */
  "aadhaar",
  "pan",
  "agreement",
  "advance_receipt",
  "sld",
  "net_metering",
  "installation_photo",
  /* Legacy / extended Hub categories (still valid uploads) */
  "layout",
  "structural_drawing",
  "nm_application",
  "nm_inspection",
  "nm_letter",
  "commissioning",
  "warranty",
  "handover",
  "other",
] as const;

/** Registry project categories accepted by upload API (Phase 2). */
export const PROJECT_REGISTRY_UPLOAD_CATEGORIES = [
  "aadhaar",
  "pan",
  "agreement",
  "advance_receipt",
  "sld",
  "net_metering",
  "installation_photo",
] as const satisfies readonly ProjectDocumentCategory[];

export type ProjectDocumentCategory = (typeof PROJECT_DOCUMENT_CATEGORIES)[number];

export const SURVEY_PHOTO_CATEGORIES: ProjectDocumentCategory[] = [
  "roof_photo",
  "meter_photo",
  "db_photo",
];

const IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const DOC_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const PROJECT_DOCUMENT_ALLOWED_MIME = new Set([...IMAGE_MIME, ...DOC_MIME]);

export const PROJECT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const PROJECT_DOCUMENT_CATEGORY_LABELS: Record<ProjectDocumentCategory, string> = {
  roof_photo: "Roof photo",
  meter_photo: "Meter photo",
  db_photo: "DB photo",
  electricity_bill: "Electricity bill",
  site_other: "Site photo",
  aadhaar: "Aadhaar",
  pan: "PAN",
  agreement: "Agreement",
  advance_receipt: "Advance receipt",
  sld: "SLD",
  net_metering: "Net metering",
  installation_photo: "Installation photo",
  layout: "Layout drawing",
  structural_drawing: "Structural drawing",
  nm_application: "NM application",
  nm_inspection: "NM inspection",
  nm_letter: "DISCOM / NM letter",
  commissioning: "Commissioning report",
  warranty: "Warranty",
  handover: "Handover checklist",
  other: "Other document",
};

export function isProjectDocumentCategory(value: string): value is ProjectDocumentCategory {
  return (PROJECT_DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}

export function isImageMime(mime: string): boolean {
  const m = mime.split(";")[0]?.trim().toLowerCase() || "";
  return IMAGE_MIME.has(m);
}
