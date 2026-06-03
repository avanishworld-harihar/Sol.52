# Customer Documents Hub — Phase 1 Delivery

**Status:** Implemented (read-only + additive schema)  
**Migration:** `supabase/migrations/048_customer_documents_hub_phase1.sql`  
**Deferred:** `proposal_assets`, write redirects, table drops

---

## Migration summary

Run in Supabase SQL editor (or CLI) after approval:

| Action | Object |
|--------|--------|
| **CREATE** | `customer_assets` |
| **CREATE** | `project_assets` |
| **CREATE** | `asset_links` |
| **CREATE INDEX** | time, category, filename trgm (×2) |
| **CREATE POLICY** | service_all_* (RLS enabled) |
| **EXTENSION** | `pg_trgm` (if not present) |

**Not included:** `proposal_assets`, DROP, ALTER on legacy tables.

**Rollback:** `DROP TABLE IF EXISTS asset_links, project_assets, customer_assets CASCADE;` (only if empty / Phase 1 rollback)

---

## Schema diff (new columns/tables)

### `customer_assets`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK → organizations | |
| customer_id | uuid FK → leads | |
| category | text CHECK | bill, roof_photo, meter_photo, **db_photo**, survey_media |
| storage_bucket | text | default customer-files |
| storage_path | text | |
| filename | text | |
| mime_type | text | |
| size_bytes | int | |
| sha256 | text nullable | Phase 2 dedup |
| version | int | default 1 |
| supersedes_id | uuid nullable | |
| source_channel | text | default crm_ui |
| uploaded_by_id | uuid nullable | |
| notes | text nullable | |
| archived_at | timestamptz nullable | |
| created_at | timestamptz | |

### `project_assets`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | |
| customer_id | uuid FK → leads | denormalized for hub |
| project_id | uuid FK → projects | |
| category | text CHECK | aadhaar, pan, agreement, advance_receipt, sld, net_metering, installation_photo |
| storage_* | text | default project-files bucket |
| filename, mime_type, size_bytes | | |
| uploaded_by_id, notes, archived_at, created_at | | |

### `asset_links`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | |
| asset_id | uuid FK → customer_assets | |
| customer_id | uuid FK | |
| project_id | uuid FK | |
| link_role | text | survey slot / role |
| pinned | boolean | |
| created_at | timestamptz | |
| **UNIQUE** | (project_id, link_role) | one primary link per role |

---

## New API endpoints

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/customers/[id]/documents` | Unified hub (read-only) |

**Query parameters:**

| Param | Example | Description |
|-------|---------|-------------|
| q | `roof` | Filename substring search |
| types | `BILL,ROOF_PHOTO` | Registry ids or db snake values |
| project_id | uuid or `none` | Project filter |
| owner | `customer` \| `project` | Owner filter (no proposal in Phase 1) |
| from / to | ISO datetime | Upload date range |
| limit | 40 | Page size (max 100) |
| cursor | base64url | Keyset pagination |

**Response:** `{ ok, data: { items, next_cursor, total_in_page, facets: { projects } } }`

### Updated endpoint

| Method | Path | Change |
|--------|------|--------|
| **GET** | `/api/customers/[id]/timeline` | CRM events + **project milestones** (`project_created`, `stage_changed`, `project_completed`, `project_archived`) |

**Unchanged (legacy writes):**

- `POST/GET /api/customers/[id]/files`
- `POST /api/customers/[id]/files/upload`
- `GET/POST /api/projects/[id]/documents`

---

## UI changes

| Surface | Change |
|---------|--------|
| **Customer profile** (`/customers/[id]`) | **Documents** section with unified hub (search, filters, load more) |
| Same page | Legacy **Quick upload** (Bills / Site / Documents) unchanged below hub |
| **Activity timeline** | Shows CRM + project milestone entries |
| **Customers workspace pane** | Timeline tab compatible with merged timeline items |

### Screenshots

Captured locally (Playwright, `npm run dev` on port 3000):

| File | Content |
|------|---------|
| `docs/verification/customer-documents-hub/01-customer-profile.png` | Route shell (loading state without session cookie) |
| `docs/verification/customer-documents-hub/02-documents-hub.png` | **Documents** hub: search, Owner/Type/Project/Date filters, empty state + project facet |

Re-capture while logged in for populated rows and timeline milestones on the same page.

---

## Code map

| File | Role |
|------|------|
| `lib/document-category-registry.ts` | Category registry + DB_PHOTO |
| `lib/unified-documents-types.ts` | API types |
| `lib/unified-documents-store.ts` | Read merge legacy + new tables |
| `lib/customer-documents-client.ts` | Client fetcher |
| `lib/customer-timeline-store.ts` | Milestone aggregation |
| `app/api/customers/[id]/documents/route.ts` | GET hub |
| `components/customers/customer-documents-hub.tsx` | Hub UI |

---

## Phase 2 preview (not in this PR)

- Writes → `customer_assets` / `project_assets`
- Auto-link on `project_created`
- `proposal_assets` optional later
