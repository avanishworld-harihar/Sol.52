import type { DocumentCategoryDb, DocumentOwner } from "@/lib/document-category-registry";

export type UnifiedDocumentOwner = DocumentOwner;

export type UnifiedDocumentSource =
  | "customer_assets"
  | "project_assets"
  | "proposal_assets"
  | "customer_files"
  | "project_documents";

export type UnifiedDocumentRow = {
  id: string;
  owner: UnifiedDocumentOwner;
  category: DocumentCategoryDb;
  category_label: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number;
  customer_id: string;
  project_id: string | null;
  project_label: string | null;
  proposal_id: string | null;
  proposal_revision: number | null;
  uploaded_at: string;
  download_url: string | null;
  link_role: string | null;
  source: UnifiedDocumentSource;
  legacy: boolean;
  notes?: string | null;
};

export type UnifiedDocumentsQuery = {
  q?: string;
  types?: DocumentCategoryDb[];
  projectId?: string | "none" | null;
  owner?: UnifiedDocumentOwner | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
  cursor?: string | null;
};

export type UnifiedDocumentsResult = {
  items: UnifiedDocumentRow[];
  next_cursor: string | null;
  total_in_page: number;
  facets: {
    projects: { id: string; label: string }[];
  };
};

export type UnifiedProjectDocumentsQuery = {
  owner?: UnifiedDocumentOwner | null;
  category?: string | null;
  q?: string;
};

export type UnifiedProjectDocumentsSummary = {
  total: number;
  by_category: Record<string, number>;
  by_owner: Record<string, number>;
};
