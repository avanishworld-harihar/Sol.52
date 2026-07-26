# Sol.52 Design Studio — Roadmap (Future Ideas & Phases)

| Field | Value |
|-------|-------|
| **Status** | Phases 1–6 core complete — reserved engines (roof type + safety) shipped light |
| **Last Updated** | 2026-07-26 |
| **Canonical architecture (FROZEN)** | [`docs/architecture/design-studio-architecture.md`](../architecture/design-studio-architecture.md) |

> **This is the only place where future ideas, future phases, and future enhancements are added.**
> Nothing here is in current implementation scope. Items here **do not** modify the frozen
> architecture. When a roadmap item is ready to build, it requires **explicit approval**; if it
> changes the frozen architecture, that requires a version increment (v1.0 → v1.1) in the
> architecture document.

> **Product-owner approval (2026-07-19):** Build the complete 2D Design Studio roadmap in phases.
> **3D roof modelling is explicitly excluded from the current product scope.** The frozen v1.0
> four-engine sequence remains unchanged. Phase 1 starts now; later phases stay queued in the
> approved order below and must pass their acceptance gate before the next phase begins.

> **Product lock (2026-07-21):** Design + SLD stay **outside** the customer proposal. Separate pack
> share links only — see `.cursor/rules/design-sld-separate-from-proposal.mdc`.

---

## 1. Phase map

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | 2D Geometry foundation — satellite map, roof polygon, obstructions, save/version | **COMPLETE** |
| **Phase 2** | Auto Panel Placement Engine + RCC/shed presets + manual fine-tune | **COMPLETE** — East-West + tilt chips (2026-07-26) |
| **Phase 3** | Engineering Rules + Solar Design — setbacks, strings, studio SLD | **COMPLETE** — SLD pack share `/sld/[token]` (2026-07-26) |
| **Phase 4** | **Shadow Engine** — per-panel shade %, shade-free area, loss estimate | **COMPLETE (core)** |
| **Phase 5** | Project/Survey/BOM + snapshots + customer design sign-off | **COMPLETE** — version restore, survey conflict UX, Hub sign-off (2026-07-26) |
| **Phase 6** | Cross-device QA, performance, security and pilot rollout | **COMPLETE (core)** — automated gates + process checklist (2026-07-26) |

### Phase gates

- **Phase 1 gate:** draw/edit a roof on satellite imagery; save and reopen identical geometry
  across Desktop and iPad; phone can view and perform light edits.
- **Phase 2 gate:** every generated panel is fully inside buildable area and outside obstructions;
  panel count and DC capacity match the selected module.
- **Phase 3 gate:** engineering warnings are deterministic; string/MPPT values respect equipment
  limits; a basic SLD and installer-ready summary can be exported.
- **Phase 4 gate:** shadow results attach to panel IDs from the validated layout and provide
  time/season-specific shade fractions.
- **Phase 5 gate:** one saved design consistently drives Project Hub, Survey, BOM and Proposal
  output without duplicate data entry.
- **Phase 6 gate:** parity, RLS, recovery, snapshot and large-roof performance checks pass before
  general release.

---

## 2. Phase 1 — 2D Geometry Foundation (COMPLETE)

**Goal:** `Open project → locate roof → draw/edit roof → add obstructions → save/version → reopen`

Shipped as frozen v1.0 geometry path: Project Hub → Design → Open Design Studio, satellite map,
GPS/geocode, polygons + obstructions, undo/redo, IndexedDB draft recovery, org-scoped save.

---

## 3. Phase 2 — Auto Panel Placement Engine (COMPLETE)

**Shipped:** Target kW / Fill max, module picker, manual fine-tune, Portrait / Landscape /
**East-West**, Flush / Elevated / Ground, **10° / 15° / 20° tilt chips** (re-pack on change).

---

## 4. Phase 3 — Engineering Rules + Solar Design (COMPLETE)

Studio SLD sheet + **SLD pack share** (`/sld/[token]`, Copy link on Hub / SLD sheet). Not embedded
in proposal renderers.

---

## 5. Phase 4 — Shadow Engine (COMPLETE — core)

Per-panel shade samples, survey fill, hour slider, annual loss estimate.

---

## 6. Phase 5 — Integration + sign-off (COMPLETE)

Design pack share, Hub BOM sync, site-layout **version restore**, survey roof **conflict UX**,
**Customer design sign-off** Hub action (CRM task template — not legal e-sign).

**Plan flags (Wave 2):** `design_studio` + `sld` on `PlanFeatures`; starter = proposal-only
(both false); trial/pro/business = both true. Asserts on Design/SLD APIs; Hub upgrade hint when
gated (`BILLING_ENFORCE`). Migration `075_design_studio_plan_features.sql`.

---

## 7. Phase 6 — QA & Production Rollout (**COMPLETE — core**)

**Automated (2026-07-26):**
- `lib/design-studio-phase6-gates.ts` — PNG validity + draft integrity (wired on IndexedDB reopen).
- `npm run test:design-studio-phase6` — PNG/draft helpers + packing/collision/shadow/share/perf smoke.
- Share-token org isolation logical smoke (Design + SLD tokens must match org).

**Still human / process (not fake-complete in code):**
- Desktop/iPad parity + Apple Pencil palm-rejection QA.
- Selected-installer pilot before general release.

Pilot remains an operator checklist; core automated gates are green.

---

## 8. Architecture placeholders

### 8.1 Roof Type Engine — **SHIPPED (light)** 2026-07-26
Survey/`roof_type` drives mounting default, East-West availability, and setback advice in Studio
inspector + packer (`lib/design-studio-safety-profiles.ts`).

### 8.2 Walkway & Safety Profiles — **SHIPPED (light)** 2026-07-26
Residential / Commercial / Industrial / Custom profiles set edge setback, walkway, obstruction
clearance; consumed by packer. Persist via `setback_ft` / `walkway_ft` + draft `safety_profile_id`.

### 8.3 AI Obstruction Detection — **explicit future**
Manual markers only until approved.

---

## 9. Adding to this roadmap

- New future ideas are appended here — **never** to the frozen architecture document.
- Promoting a roadmap item to implementation requires explicit approval.
- If implementing an item changes the frozen contracts (engines, adapters, data model, parity
  rules), bump the architecture document v1.0 → v1.1 with the change recorded in its version history.
