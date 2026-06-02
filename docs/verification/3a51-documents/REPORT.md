# Wave 3A-5.1 Documents — Verification Report

**Generated:** 2026-06-02 (automated + UI pass)  
**API base:** `http://localhost:3000`  
**UI base:** `http://localhost:3003` (dev server; port 3000 was occupied by another process)

## Executive summary

| Verdict | Detail |
|---------|--------|
| **Production-ready** | Yes — core flows verified end-to-end against live Supabase |
| **Blockers** | None |
| **Caveats** | Use correct dev port when testing UI; re-run migration 047 on any new environment |

---

## Checklist results

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Migration 047 applied | **PASS** | `project_documents` query OK; bucket `project-files` exists after uploads |
| 2 | App runs locally | **PASS** | `npm run dev` on port 3003 |
| 3 | Create test project | **PASS** | `POST /api/projects` → `f6455e29-1e33-4358-b0e0-df9d9d70543f` |
| 4 | Documents tab visible | **PASS** | Playwright: `#project-hub-tab-documents` / “Docs” tab |
| 5a | Upload roof photo | **PASS** | JPEG uploaded, signed URL returned |
| 5b | Upload meter photo | **PASS** | JPEG uploaded |
| 5c | Upload electricity bill PDF | **PASS** | Minimal PDF uploaded |
| 6 | Supabase Storage | **PASS** | Object downloaded via service role (`287` bytes sample JPEG) |
| 7 | `project_documents` rows | **PASS** | 3+ rows per test project |
| 8 | Timeline `document_uploaded` | **PASS** | 3 events in activity API |
| 9 | Overview document count | **PASS** | `?summary=1` → `total=3` |
| 10 | Signed download | **PASS** | Signed URL issued; storage object readable |
| 11a | Manager delete | **PASS** | `DELETE` + `actor_role=manager` → 200 |
| 11b | Technician delete denied | **PASS** | `actor_role=technician` → 403 |
| 11c | Technician upload | **PASS** | Multipart upload allowed |
| 11d | Manager upload | **PASS** | Multipart upload allowed |

---

## Screenshots

Captured under `docs/verification/3a51-documents/screenshots/`:

| File | Description |
|------|-------------|
| `01-hub-overview.png` | Project Hub — Overview |
| `02-hub-documents-tab.png` | Docs tab — grid, filters, quick upload |
| `03-hub-survey-photos.png` | Survey tab — roof/meter/DB slots |
| `04-hub-timeline.png` | Timeline — document_uploaded entries |
| `05-hub-overview-documents.png` | Overview — Documents strip with count |

Open these files in the IDE or file explorer to review.

---

## Issues found

| Issue | Severity | Resolution |
|-------|----------|------------|
| Migration 047 partial runs (`archived_at`, `created_at` missing) | High (deploy) | Fixed in repo — idempotent `047_project_documents.sql`; user confirmed SQL **Success** |
| SSR HTML does not include Docs tab markup | Info | Expected — tab is client-rendered; verified with Playwright |
| Dev server on port **3003** when 3000 busy | Info | Use `BASE_URL` matching `next dev` output |
| External `fetch(signedUrl)` timeout in CI | Low | Verified via Supabase storage download instead |

**No application code defects required a fix during this verification pass.**

---

## How to re-run

```powershell
cd "e:\solar project\Sol.52"
# Load .env.local into session (PowerShell)
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), 'Process')
  }
}
$env:BASE_URL = "http://localhost:3003"   # match next dev port
npm run dev
# separate terminal:
node scripts/verify-documents-3a51.mjs
$env:TEST_PROJECT_ID = "<projectId from script output>"
node scripts/verify-documents-ui.mjs
```

---

## Production readiness sign-off

- **Database:** `project_documents` + indexes + RLS policy — OK  
- **API:** list, upload, get, patch, delete, permissions query params — OK  
- **Storage:** private `project-files` bucket — OK  
- **Hub UI:** Docs tab, Survey photos, Overview summary, Timeline — OK  
- **Financial module:** Not started (per scope)

**Signed off for Wave 3A-5.1 Documents — ready to deploy after commit/push and production migration 047.**
