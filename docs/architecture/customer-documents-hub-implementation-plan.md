# Customer Documents Hub — Implementation Plan

**Status:** Awaiting approval before schema migrations  
**Approved architecture:** Customer-as-master discovery + three asset domains + unified hub  
**Date:** June 2026

---

## 1. Goals (non-negotiable)

1. **Customer Documents Hub** is the primary document discovery surface.
2. Unified hub aggregates **Customer Assets**, **Project Assets**, **Proposal Assets**.
3. Filters: filename search, type, project, date, owner; pagination for 100+ files.
4. **Centralized Document Category Registry** (code + DB reference).
5. **No duplicate uploads** — customer assets linkable to projects; project assets stay project-scoped.
6. **Customer Profile timeline:** CRM activities + major project milestones only.
7. **Project Timeline:** full execution detail (unchanged scope).
8. **No destructive DB changes** until this plan is approved.

---

## 2. Affected tables (current → target)

### 2.1 Current (do not drop in Phase 1)

| Table | Bucket | Used by |
|-------|--------|---------|
| `leads` | — | Customer identity (`customer_id` = `leads.id`) |
| `customer_files` | `customer-files` | CRM Attachments (`file_type`: bill, site_image, document) |
| `project_documents` | `project-files` | Project Hub Docs / Survey uploads |
| `proposals` | — | Commercial JSON (`ppt_input`), `accepted_snapshot_id` |
| `proposal_pricing_snapshots` | — | Immutable pricing revisions (JSONB, not files) |
| `activity_events` | — | CRM timeline |
| `project_activity_log` | — | Project timeline |
| `projects` | — | Execution; `lead_id` FK |

### 2.2 New (additive migrations only until Phase 4)

| Table | Purpose |
|-------|---------|
| `customer_assets` | Customer-owned file metadata (replaces `customer_files` writes) |
| `project_assets` | Project-owned file metadata (replaces `project_documents` writes) |
| `proposal_assets` | Frozen PDF/PPT exports per send/revision |
| `asset_links` | Customer asset ↔ project (no duplicate blobs) |
| `document_category_registry` | Optional seed table; minimum = TypeScript registry + CHECK constraints |

### 2.3 Deprecated (Phase 4+, after backfill verified)

| Table | Action |
|-------|--------|
| `customer_files` | Read-only → archive → drop |
| `project_documents` | Read-only → archive → drop |

Storage buckets `customer-files` and `project-files` remain; new uploads use unified path convention under `org/{org_id}/customers/{customer_id}/...` (existing objects untouched).

---

## 3. Document Category Registry

### 3.1 TypeScript source of truth

**File:** `lib/document-category-registry.ts`

```ts
export const DOCUMENT_OWNERS = ["customer", "project", "proposal"] as const;

export const CUSTOMER_DOCUMENT_CATEGORIES = [
  "BILL",
  "ROOF_PHOTO",
  "METER_PHOTO",
  "SURVEY_MEDIA",
] as const;

export const PROJECT_DOCUMENT_CATEGORIES = [
  "AADHAAR",
  "PAN",
  "AGREEMENT",
  "ADVANCE_RECEIPT",
  "SLD",
  "NET_METERING",
  "INSTALLATION_PHOTO",
] as const;

export const PROPOSAL_DOCUMENT_CATEGORIES = [
  "PROPOSAL_PDF",
  "PROPOSAL_REVISION",
] as const;
```

Helpers: `getOwnerForCategory()`, `isValidCategory()`, `legacyCategoryMap()` for migration.

### 3.2 DB enforcement

- `customer_assets.category` CHECK ∈ customer list (lowercase snake in DB: `bill`, `roof_photo`, … — registry maps display `BILL` → `bill`).
- `project_assets.category` CHECK ∈ project list.
- `proposal_assets.category` CHECK ∈ proposal list.

**Convention:** Store **snake_case** in DB; expose **SCREAMING_SNAKE** in API filters for clarity.

| Registry ID | DB value | Owner |
|-------------|----------|-------|
| BILL | `bill` | customer |
| ROOF_PHOTO | `roof_photo` | customer |
| METER_PHOTO | `meter_photo` | customer |
| SURVEY_MEDIA | `survey_media` | customer |
| AADHAAR | `aadhaar` | project |
| PAN | `pan` | project |
| AGREEMENT | `agreement` | project |
| ADVANCE_RECEIPT | `advance_receipt` | project |
| SLD | `sld` | project |
| NET_METERING | `net_metering` | project |
| INSTALLATION_PHOTO | `installation_photo` | project |
| PROPOSAL_PDF | `proposal_pdf` | proposal |
| PROPOSAL_REVISION | `proposal_revision` | proposal |

### 3.3 Legacy mapping (migration)

| Legacy | New |
|--------|-----|
| `customer_files.bill` | `bill` |
| `customer_files.site_image` | `survey_media` (or `roof_photo` if tagged later) |
| `customer_files.document` | `survey_media` |
| `project_documents.roof_photo` | customer `roof_photo` + **link** OR stay project during transition — **Phase 2 rule:** survey photos uploaded via project UI become **customer-owned + link** |
| `project_documents.meter_photo` | customer `meter_photo` + link |
| `project_documents.db_photo` | customer `meter_photo` / `survey_media` (registry: meter vs survey — **db_photo** maps to `survey_media` slot or add `DB_PHOTO` in Phase 1.5 if required) |

**Open decision for approval:** Add `DB_PHOTO` under Customer (recommended — matches field ops). If approved, extend customer list to include `DB_PHOTO` / `db_photo`.

---

## 4. Proposed schema (Migration 048+)

> **Do not run until approved.** Migrations are idempotent, additive only.

### 4.1 `customer_assets`

```sql
CREATE TABLE public.customer_assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  category          text NOT NULL,
  storage_bucket    text NOT NULL DEFAULT 'customer-files',
  storage_path      text NOT NULL,
  filename          text NOT NULL,
  mime_type         text NOT NULL,
  size_bytes        integer NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  sha256            text NULL,
  version           integer NOT NULL DEFAULT 1,
  supersedes_id     uuid NULL REFERENCES customer_assets(id) ON DELETE SET NULL,
  source_channel    text NOT NULL DEFAULT 'crm_ui',
  uploaded_by_id    uuid NULL REFERENCES installer_profiles(id) ON DELETE SET NULL,
  notes             text NULL,
  archived_at       timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_assets_customer_time_idx
  ON customer_assets (organization_id, customer_id, created_at DESC)
  WHERE archived_at IS NULL;
CREATE INDEX customer_assets_customer_category_idx
  ON customer_assets (organization_id, customer_id, category)
  WHERE archived_at IS NULL;
```

### 4.2 `project_assets`

```sql
CREATE TABLE public.project_assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category          text NOT NULL,
  storage_bucket    text NOT NULL DEFAULT 'project-files',
  storage_path      text NOT NULL,
  filename          text NOT NULL,
  mime_type         text NOT NULL,
  size_bytes        integer NOT NULL DEFAULT 0,
  uploaded_by_id    uuid NULL,
  notes             text NULL,
  archived_at       timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_assets_customer_time_idx
  ON project_assets (organization_id, customer_id, created_at DESC)
  WHERE archived_at IS NULL;
CREATE INDEX project_assets_project_idx
  ON project_assets (project_id, category)
  WHERE archived_at IS NULL;
```

### 4.3 `proposal_assets`

```sql
CREATE TABLE public.proposal_assets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id         uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  proposal_id         uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  pricing_snapshot_id uuid NULL REFERENCES proposal_pricing_snapshots(id) ON DELETE SET NULL,
  category            text NOT NULL,
  revision_number     integer NOT NULL DEFAULT 1,
  storage_bucket      text NOT NULL DEFAULT 'proposal-assets',
  storage_path        text NOT NULL,
  filename            text NOT NULL,
  mime_type           text NOT NULL,
  size_bytes          integer NOT NULL DEFAULT 0,
  triggered_by        text NOT NULL DEFAULT 'sent',
  archived_at         timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proposal_assets_customer_time_idx
  ON proposal_assets (organization_id, customer_id, created_at DESC);
CREATE INDEX proposal_assets_proposal_idx
  ON proposal_assets (proposal_id, revision_number DESC);
```

### 4.4 `asset_links`

```sql
CREATE TABLE public.asset_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  asset_id        uuid NOT NULL REFERENCES customer_assets(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  link_role       text NOT NULL,
  pinned          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, link_role)  -- optional: one primary slot per role
);
CREATE INDEX asset_links_project_idx ON asset_links (project_id);
CREATE INDEX asset_links_asset_idx ON asset_links (asset_id);
```

### 4.5 Search (Migration 049 optional)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX customer_assets_filename_trgm_idx ON customer_assets USING gin (filename gin_trgm_ops);
-- repeat for project_assets, proposal_assets
```

### 4.6 Unified read view (optional SQL view)

```sql
CREATE VIEW v_customer_document_index AS
  SELECT ... customer_assets ... owner_scope = 'customer'
  UNION ALL
  SELECT ... project_assets ... owner_scope = 'project'
  UNION ALL
  SELECT ... proposal_assets ... owner_scope = 'proposal';
```

---

## 5. API changes

### 5.1 New (primary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/customers/[id]/documents` | **Unified hub** — search, filters, cursor pagination |
| POST | `/api/customers/[id]/documents` | Upload customer-owned asset (+ optional `project_id` to auto-link) |
| GET | `/api/customers/[id]/documents/[assetId]` | Metadata + signed URL |
| PATCH | `/api/customers/[id]/documents/[assetId]` | Notes / archive |
| POST | `/api/customers/[id]/documents/[assetId]/link` | Link customer asset → project (`project_id`, `link_role`) |
| DELETE | `/api/customers/[id]/documents/[assetId]/link` | Unlink (not delete blob) |

**Query params (GET hub):**

| Param | Example |
|-------|---------|
| `q` | filename search |
| `types` | `bill,roof_photo` (comma-separated) |
| `project_id` | uuid or `none` (customer-only) |
| `owner` | `customer` \| `project` \| `proposal` |
| `from` / `to` | ISO date range |
| `limit` | default 40, max 100 |
| `cursor` | keyset token |

**Response row shape:**

```ts
type UnifiedDocumentRow = {
  id: string;
  owner: "customer" | "project" | "proposal";
  category: string;
  category_label: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  customer_id: string;
  project_id: string | null;
  project_label: string | null;
  proposal_id: string | null;
  proposal_revision: number | null;
  uploaded_at: string;
  download_url: string | null;
  link_role: string | null; // if linked to project
};
```

### 5.2 Project-scoped upload (execution workspace)

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/api/projects/[id]/documents` | **Phase 2:** If category is customer-owned → write `customer_assets` + `asset_links`; else `project_assets` |
| GET | `/api/projects/[id]/documents` | Project view = linked customer assets + project assets (not full customer hub) |

Existing routes remain during transition; internally delegate to new stores.

### 5.3 Proposal assets (Phase 3)

| Hook | Behavior |
|------|----------|
| Proposal status → `sent` / `revised` / `approved` | Generate PDF once → insert `proposal_assets` (`proposal_pdf` or `proposal_revision`) |
| GET | Included in unified hub via `owner=proposal` |

### 5.4 Timeline (Phase 2b — no schema)

| Method | Change |
|--------|--------|
| GET `/api/customers/[id]/timeline` | Merge `activity_events` + **project milestone projection** (subset of `project_activity_log`) |

**Milestone event types (allowlist):**

- `project_created`
- `stage_changed`
- `project_completed`
- `project_archived`

Exclude: `task_completed`, `document_uploaded`, `comment_added` (stay on project timeline only).

### 5.5 Legacy (compat until Phase 4)

| Path | Status |
|------|--------|
| `/api/customers/[id]/files` | Read merges legacy + new; writes redirect to new POST |
| `/api/projects/[id]/documents` | Same |

---

## 6. UI changes

### 6.1 Customer Profile (`components/customers/customer-detail-page.tsx`)

| Before | After |
|--------|-------|
| Attachments: Bills / Site Images / Documents (3 silos) | **Documents Hub** (single section) |
| — | Search input + filter chips (type, project, date, owner) |
| — | Virtualized / paginated list |
| — | Row actions: Open, Download, “View in project” |
| — | Upload dropdown by registry category (customer categories only) |

**Activity timeline:**

- Keep CRM events.
- Append **milestone cards** from project log (collapsed group “Project updates” optional).

### 6.2 Project Hub

| Tab | Change |
|-----|--------|
| Survey | Upload → customer asset + link; show linked + “All on customer profile” link |
| Docs | Project categories only + banner: “Full library on customer Documents” |
| Overview | Document count from unified index scoped to project |

### 6.3 Customers list / workspace

- No change in Phase 1 except deep links to `#documents` on profile.

### 6.4 New components (suggested)

- `components/customers/customer-documents-hub.tsx`
- `components/customers/customer-documents-filters.tsx`
- `hooks/use-customer-documents.ts` (SWR + cursor)

---

## 7. Migration strategy (phased)

### Phase 0 — Approval gate (this document)

- [ ] Stakeholder approves schema + `DB_PHOTO` decision
- [ ] Approve bucket `proposal-assets` creation

### Phase 1 — Additive schema + read path (no legacy writes removed)

1. Migration `048_customer_project_proposal_assets.sql` (new tables only).
2. `lib/document-category-registry.ts`
3. `lib/customer-assets-store.ts`, `lib/project-assets-store.ts`, `lib/unified-documents-store.ts`
4. GET `/api/customers/[id]/documents` — union legacy + new (empty until backfill)
5. Customer Documents Hub UI (read-only against union)
6. **No** drop of `customer_files` / `project_documents`

### Phase 2 — Write path + linking

1. POST customer upload → `customer_assets`
2. POST project upload → split by registry owner
3. `asset_links` + `onProjectCreated` auto-link job (bill, roof, meter, survey)
4. Project/CRM upload UIs wired
5. Backfill script: `scripts/backfill-document-assets.mjs` (copy metadata; **reuse** `storage_path` / `file_url` — no binary copy)

### Phase 3 — Proposal assets

1. Bucket `proposal-assets`
2. Hook proposal send/revise → persist PDF
3. Hub `owner=proposal` filter

### Phase 4 — Deprecation (destructive — separate approval)

1. Stop writes to legacy tables (feature flag)
2. 90-day read-only fallback
3. Migration `049_deprecate_legacy_file_tables.sql` (DROP only after verification)

### Backfill mapping table

```sql
CREATE TABLE public.document_migration_map (
  legacy_table text NOT NULL,
  legacy_id uuid NOT NULL,
  new_table text NOT NULL,
  new_id uuid NOT NULL,
  migrated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (legacy_table, legacy_id)
);
```

---

## 8. Rollback strategy

| Phase | Rollback |
|-------|----------|
| Phase 1 | Drop new tables if empty; remove API route; UI feature flag off. Legacy untouched. |
| Phase 2 | Feature flag `DOCUMENTS_V2_WRITE=false` → legacy upload paths only. New rows remain readable. |
| Phase 3 | Disable proposal PDF persistence hook; hub hides `owner=proposal`. |
| Phase 4 | **Irreversible** — require DB backup before DROP. Keep `document_migration_map` for audit. |

**Feature flag:** `NEXT_PUBLIC_DOCUMENTS_HUB_V2` / server `DOCUMENTS_HUB_V2_WRITE`.

**Backup:** Supabase point-in-time recovery before Phase 4; export `customer_files` + `project_documents` row counts pre-migration.

---

## 9. Implementation order (no broad refactor)

```
Week 1:  Registry + Migration 048 (approved) + unified GET + Hub UI (read)
Week 2:  Customer POST + asset_links + auto-link on project create
Week 3:  Project upload adapter + backfill script + Hub write
Week 4:  Timeline milestones + proposal_assets (Phase 3)
Week 5+: Legacy read-only → deprecate (Phase 4 approval)
```

**Explicitly out of scope for Phase 1–2:**

- Dropping legacy tables
- Merging activity timelines into one table
- Multi-bucket consolidation (paths can stay per bucket)

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Dual-write drift | Short window; monitor counts; migration_map |
| RLS / anon read failures | Service role in server routes (pattern from `listPipelineProjects` fix) |
| Hundreds of files perf | Keyset pagination + indexes + trgm |
| Survey db_photo gap | Add `DB_PHOTO` to customer registry (pending approval) |
| Proposal PDF storage cost | Generate only on send/revise; retention policy later |

---

## 11. Approval checklist

Before running **Migration 048**:

- [ ] Schema sections 4.1–4.4 approved
- [ ] Category registry including DB_PHOTO yes/no
- [ ] API contract section 5 approved
- [ ] UI section 6 approved
- [ ] Phase 4 destructive window acknowledged separately
- [ ] Rollback + feature flags acceptable

**Approver signature / date:** _______________

---

## 12. References

- Prior architecture: conversation + `docs/architecture/phase-3a-4-project-hub.md` (§16 Documents placeholder)
- Current: `customer_files` (034), `project_documents` (047)
- Proposals: `proposal_pricing_snapshots` (022), on-demand PPT (`/api/proposals/[id]/ppt`)
