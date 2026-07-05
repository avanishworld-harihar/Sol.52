# Sol.52 Design Studio — Roadmap (Future Ideas & Phases)

| Field | Value |
|-------|-------|
| **Status** | Active roadmap (future ideas) |
| **Last Updated** | 2026-07-06 |
| **Canonical architecture (FROZEN)** | [`docs/architecture/design-studio-architecture.md`](../architecture/design-studio-architecture.md) |

> **This is the only place where future ideas, future phases, and future enhancements are added.**
> Nothing here is in current implementation scope. Items here **do not** modify the frozen
> architecture. When a roadmap item is ready to build, it requires **explicit approval**; if it
> changes the frozen architecture, that requires a version increment (v1.0 → v1.1) in the
> architecture document.

---

## 1. Phase map

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Shared editor foundation — map, roof polygon, save (Engine 1: Geometry) | **Current scope** (see architecture doc) |
| **Phase 2** | **Auto Panel Placement Engine** (foundation) + presets + manual fine-tune | Future — reserved |
| **Phase 3** | **Engineering Rules Engine** — validation before shadow | Future — reserved |
| **Phase 4** | **Shadow Engine** — per-panel shade %, shade-free area | Future — reserved |
| **Phase 5** | Output & polish — snapshot, proposal PDF block, version history, phone light-edit finalize | Future |

---

## 2. Phase 2 — Auto Panel Placement Engine (FOUNDATION)

The foundation engine of the Design Studio. After the roof polygon is drawn, the system
automatically generates the best possible panel layout. The installer only fine-tunes the result
instead of placing every panel manually.

**Goal:** `Draw roof → Auto layout generated → Minor adjustments → Save`

**Inputs:** panel dimensions, orientation (portrait/landscape), required setbacks, walkway
clearance, roof shape, installer spacing rules.

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

### 2.1 Layout presets (part of Phase 2)

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

## 3. Phase 3 — Engineering Rules Engine (validation)

A validation stage that runs **after** Auto Panel Placement and **before** Shadow Analysis. It
validates the `PanelLayout` and surfaces engineering warnings.

**Future workflow:**
`Roof → Auto Panel Placement → Engineering Validation → Manual Adjustments → Shadow Analysis`

**Future checks:** setbacks, blocked walkways, maintenance access, row spacing, fire clearance,
clearance issues, general engineering warnings.

**Consumes:** Walkway & Safety Profiles (§6.2) instead of hardcoded values.

---

## 4. Phase 4 — Shadow Engine

Consumes the **validated `PanelLayout` only** (never the raw roof polygon). Produces per-panel shade
percentages and roof-level shade-free area.

- Obstruction placement (tree / chimney / water tank) + height.
- Sun time slider + solstice presets (Jun 21 / Dec 21 × 9 AM / 12 PM / 3 PM), IST.
- Per-panel `shadeFraction` per time sample; auto-fill survey `shadow_free_sqft` +
  `shadow_analysis_note`.
- Output is a planning estimate with disclaimer (not a certified shading report).

---

## 5. Phase 5 — Output & polish

- Map snapshot (`map.getCanvas().toDataURL()`) with panel layout overlay → Supabase storage.
- Project Hub Design tab summary card (thumbnail + metrics).
- Proposal PDF block: "Site layout & shadow" (panel diagram + per-panel shade info + disclaimer).
- Version history UI.
- Phone light-edit adapter finalized.

---

## 6. Future architecture placeholders (reserved slots)

These are reserved extension points. The frozen architecture accommodates them without rework; none
are implemented now.

### 6.1 Roof Type Engine
The Auto Panel Placement Engine will support different roof types. Roof type influences available
presets, mounting method, panel packing strategy, and setback rules.

| Roof type | Influences |
|-----------|-----------|
| Flat RCC · Sloped RCC · Metal Sheet · Tile · Ground Mount | presets · mounting method · packing strategy · setback rules |

Engine 2 reserves a `roofType` input (derivable from survey `roof_type`). Current default: one
generic behaviour.

### 6.2 Walkway & Safety Profiles
Installer-configurable safety profiles replace hardcoded setback/walkway values. The Auto Panel
Placement Engine and Engineering Rules Engine both **consume** these profiles.

| Profile | Defines |
|---------|---------|
| Residential · Commercial · Industrial · Custom | walkway width · maintenance clearance · fire setback · edge setback |

Current default: a single residential profile assumed.

### 6.3 AI Obstruction Detection
A future AI module that detects water tanks, trees, chimneys, and parapet walls from drone images or
roof photos, producing obstruction markers (currently placed manually). The system remains **fully
manual** until this ships.

---

## 7. Adding to this roadmap

- New future ideas are appended here — **never** to the frozen architecture document.
- Promoting a roadmap item to implementation requires explicit approval.
- If implementing an item changes the frozen contracts (engines, adapters, data model, parity
  rules), bump the architecture document v1.0 → v1.1 with the change recorded in its version history.
