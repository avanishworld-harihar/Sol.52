# Customer Documents Hub — Phase 5A Rollback Instructions

**Phase 5A** turns off legacy table **reads** in the hub and hides legacy Quick upload UI. **No schema or data is deleted.**

---

## Quick rollback (production)

Set in environment (Vercel / `.env.local`):

```env
DOCUMENTS_HUB_LEGACY_READ=true
NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ=true
```

Redeploy or restart `npm run dev` so server and client bundles pick up `NEXT_PUBLIC_*`.

| Flag | Rollback effect |
|------|-----------------|
| `DOCUMENTS_HUB_LEGACY_READ=true` | Hub and `/api/customers/[id]/files` merge `customer_files` + `project_documents` again |
| `NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ=true` | Customer Quick upload + project Quick upload cards visible again |

**Keep** `DOCUMENTS_HUB_V2_WRITE=true` unless intentionally reverting writes to legacy-only.

---

## What rollback restores

- Unified hub shows legacy + v2 rows (dedupe may hide some duplicates)
- Customer detail “Quick upload” section returns
- Project documents tab “Quick upload” card returns
- `listProjectDocuments` reads `project_documents` table again

---

## What rollback does NOT do

- Does not delete `customer_assets`, `project_assets`, `proposal_assets`, or `document_migration_map`
- Does not DROP tables
- Does not undo backfill map rows

---

## Verify after rollback

```bash
DOCUMENTS_HUB_LEGACY_READ=true node scripts/phase4-hub-verification.mjs
```

Expect `customer_files` / `project_documents` in `by_source` when legacy read is on.

---

## Code references

| File | Role |
|------|------|
| `lib/documents-hub-read-config.ts` | Server legacy read gate |
| `lib/documents-hub-legacy-ui-config.ts` | Client legacy upload UI gate |
| `lib/unified-documents-store.ts` | Hub merge |
| `lib/project-document-store.ts` | Project doc list API |
| `lib/document-write-router.ts` | Customer files list API |
