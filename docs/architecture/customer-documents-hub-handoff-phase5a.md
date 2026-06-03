# Customer Documents Hub — Phase 5A Handoff

**Status:** Implemented — awaiting review (no commit/tag)  
**Prerequisite:** Phase 4 backfill complete (`document_migration_map` populated for migratable rows)

---

## Flags

```env
DOCUMENTS_HUB_LEGACY_READ=false
NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ=false
DOCUMENTS_HUB_V2_WRITE=true
DOCUMENTS_HUB_PROPOSAL_PERSIST=true
```

## Rollback

[`customer-documents-hub-phase5a-rollback.md`](./customer-documents-hub-phase5a-rollback.md)

## Validation

[`customer-documents-hub-phase5a-validation-report.md`](./customer-documents-hub-phase5a-validation-report.md)

## Audit command

```bash
node scripts/phase5a-validation-audit.mjs
```

## Deferred (not Phase 5A)

- DROP legacy tables
- Remove schema
- Delete `customer_files` / `project_documents` rows
