/**
 * Project document categories and MIME allowlists (Phase 3A-5.1).
 */

export const PROJECT_DOCUMENT_CATEGORIES = [
  "roof_photo",
  "meter_photo",
  "db_photo",
  "electricity_bill",
  "site_other",
  "sld",
  "layout",
  "structural_drawing",
  "nm_application",
  "nm_inspection",
  "nm_letter",
  "installation_photo",
  "commissioning",
  "warranty",
  "handover",
  "other",
] as const;

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
  sld: "SLD",
  layout: "Layout drawing",
  structural_drawing: "Structural drawing",
  nm_application: "NM application",
  nm_inspection: "NM inspection",
  nm_letter: "DISCOM / NM letter",
  installation_photo: "Installation photo",
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
