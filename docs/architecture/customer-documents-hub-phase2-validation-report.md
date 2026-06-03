# Customer Documents Hub — Phase 2 Validation Report (template)

**Status:** Code implemented; operator verification required.  
**Backfill:** Not executed automatically — await explicit approval.

---

## Environment

| Check | Command / value |
|-------|-----------------|
| Migration 048 applied | `customer_assets`, `project_assets`, `asset_links` exist |
| Migration 049 applied | `document_migration_map` exists |
| V2 writes enabled | `DOCUMENTS_HUB_V2_WRITE` unset or not `false` |
| Rollback test | `DOCUMENTS_HUB_V2_WRITE=false` → legacy writes only |

---

## 1. Upload flow

| Step | Customer profile | Project Hub |
|------|------------------|-------------|
| Upload UI | Quick upload (Bills / Site / Documents) | Docs tab multipart POST |
| Endpoint | `POST /api/customers/[id]/files/upload` | `POST /api/projects/[id]/documents` |
| V2 target table | `customer_assets` | `customer_assets` + `asset_links` OR `project_assets` |
| Legacy row created (V2 on) | No | No |
| Hub refreshes | SWR `customer-documents` + `/files` | N/A (project list API) |

**Pass criteria:** Upload returns `201`; no new `customer_files` / `project_documents` rows when V2 on.

---

## 2. Customer asset creation

```sql
SELECT id, customer_id, category, storage_path, source_channel, created_at
FROM customer_assets
WHERE customer_id = '<lead_uuid>'
ORDER BY created_at DESC
LIMIT 10;
```

| Category (DB) | Trigger |
|---------------|---------|
| `bill` | Bill upload |
| `survey_media` | Site / document upload |
| `roof_photo` / `meter_photo` / `db_photo` | Project survey slot (customer-owned) |

---

## 3. Project asset creation

```sql
SELECT id, project_id, category, storage_path, created_at
FROM project_assets
WHERE project_id = '<project_uuid>'
ORDER BY created_at DESC;
```

**Pass criteria:** SLD / PAN / agreement-class uploads create `project_assets` only (not duplicate blob in `project_documents`).

---

## 4. Asset link creation

```sql
SELECT al.*, ca.category, ca.filename
FROM asset_links al
JOIN customer_assets ca ON ca.id = al.asset_id
WHERE al.project_id = '<project_uuid>';
```

**Trigger:** `POST /api/projects` with `lead_id`, or `ensureProjectForWonLead`, links latest customer asset per `AUTO_LINK_CUSTOMER_CATEGORIES`.

**Pass criteria:** Rows exist after project create; `asset_id` points at existing `customer_assets.id`; no second storage object.

---

## 5. Search / filter (hub)

`GET /api/customers/[id]/documents`

| Test | Query |
|------|--------|
| All | `?limit=20` |
| Owner | `?owner=customer`, `?owner=project` |
| Type | `?types=ROOF_PHOTO` |
| Search | `?q=roof` |
| Project | `?project_id=<uuid>` |

**Pass criteria:** V2 rows appear with `source: customer_assets` / `project_assets`; `legacy: false`; filters narrow results correctly.

---

## 6. No duplicate storage

| Check | Method |
|-------|--------|
| Single blob per upload | Storage bucket object count before/after one upload (+1 only) |
| Backfill | `node scripts/backfill-document-assets.mjs --dry-run` — metadata only, reuses paths |
| Hub dedup | Same filename from legacy + v2 should not duplicate after backfill if map used |

---

## 7. Backfill (operator — not auto-run)

```bash
node scripts/backfill-document-assets.mjs --dry-run
# after approval:
node scripts/backfill-document-assets.mjs --execute
node scripts/backfill-document-assets.mjs --rollback-report
```

---

## Known limitations (carry-forward)

- Orphan projects (`lead_id IS NULL`) excluded from backfill and hub.
- `site_other` maps to customer-owned `survey_media`.
- Dual visibility: legacy rows remain until Phase 4; hub merges legacy + v2 (dedupe imperfect pre-backfill).

---

## Sign-off

| Role | Date | Notes |
|------|------|-------|
| Engineering | | |
| Operator | | Backfill execute: yes / no |
