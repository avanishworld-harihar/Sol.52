# Sol.52 Design Studio — Roadmap (Future Ideas & Phases)

| Field | Value |
|-------|-------|
| **Status** | Approved phased roadmap — Phase 2 active |
| **Last Updated** | 2026-07-21 |
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

---

## 1. Phase map

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | 2D Geometry foundation — satellite map, roof polygon, obstructions, save/version | **COMPLETE** |
| **Phase 2** | **Auto Panel Placement Engine** + RCC/shed presets + manual fine-tune | **ACTIVE** |
| **Phase 3** | **Engineering Rules + Solar Design** — setbacks, strings, equipment points, basic SLD | Approved — queued |
| **Phase 4** | **Shadow Engine** — per-panel shade %, shade-free area, loss estimate | Approved — queued |
| **Phase 5** | Project/Survey/BOM/Proposal integration + snapshots + customer sign-off | Approved — queued |
| **Phase 6** | Cross-device QA, performance, security and pilot rollout | Approved — queued |

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

## 2. Phase 1 — 2D Geometry Foundation (ACTIVE)

**Goal:** `Open project → locate roof → draw/edit roof → add obstructions → save/version → reopen`

- Project Hub → Design → Open Design Studio.
- Satellite map, GPS/geocode center and optional roof-photo reference.
- Tap-to-place polygon plus mouse/Pencil vertex editing; freehand trace follows after the precise
  path is stable.
- Live roof area, perimeter and azimuth; roof type: flat RCC, sloped RCC, metal sheet, tile or
  ground mount.
- Manual obstruction markers for tank, tree, chimney and parapet with footprint/height.
- Undo/redo, IndexedDB draft recovery, org-scoped Supabase save and version history.
- Desktop and iPad share the same Core actions; phone receives the frozen light-edit subset.
- Data/API: `project_site_layouts`, `/api/projects/[id]/site-layout` and `/versions`.

---

## 3. Phase 2 — Auto Panel Placement Engine (FOUNDATION)

The foundation engine of the Design Studio. After the roof polygon is drawn, the system
automatically generates the best possible panel layout. The installer only fine-tunes the result
instead of placing every panel manually.

**Goal:** `Draw roof → Auto layout (Target kW or Fill max) → Minor adjustments → Save`

**Shipped (2026-07-22):** Target kW packing (default, seeded from project `capacity_kw` / survey /
design), Fill max toggle, live Max possible kW after obstruction keep-outs, brand→watt module
picker, manual place/move/undo, and Aurora-style 3-pane shell (tool rail | map | inspector).
Standalone Tools entry remains a future mount of the same `DesignStudioClient` — not a second
engine. Design/SLD stay outside customer proposal.

**Inputs:** panel dimensions, orientation (portrait/landscape), required setbacks, walkway
clearance, roof shape, installer spacing rules, optional `targetKw`.

**Algorithm outline (planning only):**
```
buildableArea = erode(roofPolygon, setback) − obstruction footprints (+ clearance)
rowSpacing    = f(tilt, mountingType)          -- inter-row self-shading gap
tile panel rectangles across buildableArea (respect walkway gaps)
accept panel if fully within buildableArea (no partial panels)
assign id, row/col index (used later for per-panel shadow grouping)
output PanelLayout: panels[], panelCount, dcCapacityKw, remainingAreaSqft, coveragePct
```

**Manual fine-tune actions (Shared Editor Actions):** `MOVE_PANEL`, `ROTATE_PANEL`, `DELETE_PANEL`,
`ADD_PANEL`, lock/unlock.

**Live metrics bar:** `Panels · DC kW · Remaining area · Coverage %` — identical on Desktop and iPad.

**Data:** `project_panel_layouts` table (persists the `PanelLayout` contract from architecture §4).

### 3.1 Layout presets (part of Phase 2)

One-click presets that re-run auto-packing with different parameters. Applying a preset re-packs
**only unlocked** panels; locked panels are preserved (with a warning).

| Preset | Parameter |
|--------|-----------|
| Portrait | orientation = vertical |
| Landscape | orientation = horizontal |
| East-West | opposite-tilted row pairs (flat/ground) |
| Flush Mount | mounting = flush, tilt = roof pitch, min setback |
| Elevated Structure | mounting = elevated, tilt override, larger row spacing |
| 10° / 15° / 20° | tilt override → recompute row spacing |

---

## 4. Phase 3 — Engineering Rules + Solar Design

A validation stage that runs **after** Auto Panel Placement and **before** Shadow Analysis. It
validates the `PanelLayout` and surfaces engineering warnings.

**Future workflow:**
`Roof → Auto Panel Placement → Engineering Validation → Manual Adjustments → Shadow Analysis`

**Checks:** setbacks, blocked walkways, maintenance access, row spacing, fire clearance,
clearance issues and severity-ranked engineering warnings.

**Consumes:** Walkway & Safety Profiles (§6.2) instead of hardcoded values.

**Solar design outputs:** inverter/DC-AC ratio validation, modules per string, string count, MPPT
allocation, voltage/current limit checks, equipment points (DCDB, inverter, ACDB, meter/grid),
cable-route indication, earthing/lightning-arrester points, installer material summary and a basic
exportable SLD: `PV strings → DCDB → inverter → ACDB → net meter → grid`.

---

## 5. Phase 4 — Shadow Engine

Consumes the **validated `PanelLayout` only** (never the raw roof polygon). Produces per-panel shade
percentages and roof-level shade-free area.

- Obstruction placement (tree / chimney / water tank) + height.
- Sun time slider + solstice presets (Jun 21 / Dec 21 × 9 AM / 12 PM / 3 PM), IST.
- Per-panel `shadeFraction` per time sample; auto-fill survey `shadow_free_sqft` +
  `shadow_analysis_note`.
- Compare layout before/after optimization and estimate annual generation loss.
- Output is a planning estimate with disclaimer (not a certified shading report).

---

## 6. Phase 5 — Workflow Integration & Output

> **Product lock (2026-07-21):** Design and SLD stay **outside** the customer proposal surface.
> Proposals remain a simple commercial offer for proposal-only / lower subscription tiers.
> Design + SLD are separate, subscription-gated capabilities with their own share links and print/PDF.
> See `.cursor/rules/design-sld-separate-from-proposal.mdc`.

- Map snapshot (`map.getCanvas().toDataURL()`) with panel layout overlay → Supabase storage.
- Project Hub Design tab summary card (thumbnail + metrics).
- **Separate Design pack** share link + print/PDF (not a proposal tab / proposal PDF block).
- **Separate SLD pack** share link + print/PDF when SLD ships (subscription-gated).
- Optional Project Hub cross-links between proposal and design; do not require Design/SLD inside proposal renderers.
- Survey roof area/type import; BOM panel/inverter sync; optional **installer-triggered** proposal size revise (new pricing snapshot) — not silent rewrite of frozen offers.
- Design task completion, customer design sign-off and installation handover package.
- Version history UI.
- Phone light-edit adapter finalized.
- Feature flags / plan categories: Proposal-only vs Design-enabled vs SLD-enabled.

---

## 7. Phase 6 — QA & Production Rollout

- Desktop/iPad parity and Apple Pencil palm-rejection QA.
- Cross-device save/reopen, IndexedDB recovery and snapshot-not-black tests.
- Polygon accuracy, panel collision/boundary, engineering-rule and shadow-engine tests.
- Multi-tenant RLS/security verification.
- Large industrial roof performance profiling and selected-installer pilot before general release.

---

## 8. Future architecture placeholders (reserved slots)

These are reserved extension points. The frozen architecture accommodates them without rework; none
are implemented now.

### 8.1 Roof Type Engine
The Auto Panel Placement Engine will support different roof types. Roof type influences available
presets, mounting method, panel packing strategy, and setback rules.

| Roof type | Influences |
|-----------|-----------|
| Flat RCC · Sloped RCC · Metal Sheet · Tile · Ground Mount | presets · mounting method · packing strategy · setback rules |

Engine 2 reserves a `roofType` input (derivable from survey `roof_type`). Current default: one
generic behaviour.

### 8.2 Walkway & Safety Profiles
Installer-configurable safety profiles replace hardcoded setback/walkway values. The Auto Panel
Placement Engine and Engineering Rules Engine both **consume** these profiles.

| Profile | Defines |
|---------|---------|
| Residential · Commercial · Industrial · Custom | walkway width · maintenance clearance · fire setback · edge setback |

Current default: a single residential profile assumed.

### 8.3 AI Obstruction Detection
A future AI module that detects water tanks, trees, chimneys, and parapet walls from drone images or
roof photos, producing obstruction markers (currently placed manually). The system remains **fully
manual** until this ships.

---

## 9. Adding to this roadmap

- New future ideas are appended here — **never** to the frozen architecture document.
- Promoting a roadmap item to implementation requires explicit approval.
- If implementing an item changes the frozen contracts (engines, adapters, data model, parity
  rules), bump the architecture document v1.0 → v1.1 with the change recorded in its version history.
