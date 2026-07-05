# Sol.52 Design Studio — Architecture (Canonical, FROZEN)

| Field | Value |
|-------|-------|
| **Status** | **FROZEN** |
| **Version** | **v1.0** |
| **Last Updated** | 2026-07-06 |
| **Document type** | Canonical source of truth |
| **Roadmap (future ideas)** | [`docs/roadmap/design-studio-roadmap.md`](../roadmap/design-studio-roadmap.md) |

> **This document is the single canonical source of truth for the Sol.52 Design Studio.**
> It is **frozen**. Future ideas, future phases, and future enhancements are **never** added here —
> they live only in the roadmap document. Any change to this document requires **explicit approval**
> and a **version increment** (v1.0 → v1.1). Future ideas must never modify this frozen architecture automatically.

---

## 0. Core principle

> **One editor. Multiple input models. Zero feature difference.**

The Design Studio is a **single shared editor engine**. It is **not** architected as separate
Desktop and iPad editors. Desktop is the primary professional workspace (mouse + keyboard, long
sessions); iPad delivers the **same** editing capabilities via touch + Apple Pencil. There must be
**no feature differences** between Desktop and iPad — only the interaction model changes.

Phone is an intentional **light-edit** tier (a subset of the same actions), not a separate product.

---

## 1. Layered architecture (single implementation)

```
INPUT SOURCES        Mouse  ·  Apple Pencil  ·  Touch
                              │
                              ▼
INPUT ADAPTER        Per-device. ONLY translates raw events → intents.
                     Contains ZERO editor / business logic.
                              │
                              ▼
SHARED EDITOR        Semantic, device-agnostic commands:
ACTIONS              ADD_VERTEX · MOVE_VERTEX · COMMIT_POLYGON · APPLY_PRESET ·
                     AUTO_PACK_PANELS · MOVE_PANEL · ROTATE_PANEL · DELETE_PANEL ·
                     PLACE_OBSTRUCTION · SET_SUN_TIME · UNDO · REDO · SAVE
                              │
                              ▼
SHARED EDITOR        ONE implementation. The four engines (§3).
CORE                 No `if (isIpad)` / `if (isDesktop)` branching allowed here.
                              │
                              ▼
SHARED STATE         Single state tree. One shape. No per-device branch.
                              │
                              ▼
SHARED DATABASE      project_site_layouts · project_panel_layouts.
                     Same API for all clients.
```

### 1.1 Enforceable layering rules (frozen)

1. **Core is device-agnostic.** `components/site-layout/core/` holds one implementation. No device
   detection or branching inside Core.
2. **Adapters translate only.** `adapters/mouse-adapter`, `adapters/pencil-touch-adapter`,
   `adapters/phone-adapter` map raw input events → Shared Editor Actions. No geometry / panel /
   shadow / validation logic inside adapters.
3. **Parity is guaranteed by construction, not by testing.** Desktop and iPad call the *same* Core
   actions through different adapters; they cannot diverge in feature set.
4. **New feature = new Core action.** Adding a capability means adding a Shared Editor Action; both
   Desktop and iPad receive it automatically (only the UI trigger — button/gesture/shortcut — is
   added per adapter).

---

## 2. Device tiers & parity contract

### 2.1 Tiers

| Tier | Input model | Capability |
|------|-------------|-----------|
| **Desktop** | Mouse + keyboard | **100% features** — primary professional workspace, long sessions |
| **iPad** (Air M1 + Apple Pencil) | Touch + Pencil | **100% features — identical to Desktop** |
| **Phone** (<768px) | Touch | **Light-edit subset** (see §2.3) |

**Non-negotiable:** Desktop and iPad are the **same capability class**. The only permitted
difference is interaction model.

### 2.2 Parity contract (feature ⇄ dual interaction)

Every capability must have a defined path on **both** Desktop and iPad. A row where either the
Desktop or iPad column is empty is a **parity break = incomplete feature**.

| Capability | Desktop (mouse/keyboard) | iPad (touch/Pencil) | Phone |
|------------|--------------------------|---------------------|-------|
| Draw roof polygon | Click / click-drag | Pencil tap / press-drag | ✗ |
| Freehand trace | Click-drag | Pencil press-drag | ✗ |
| Move vertex | Drag | Pencil/finger drag (loupe) | ✗ |
| Delete vertex | Select + `Del` | Tap select + trash | ✗ |
| Nudge vertex | Arrow keys | Long-press + drag / stepper | ✗ |
| Auto-pack panels | Button / `Ctrl+G` | Toolbar button | ✓ (trigger + view) |
| Apply preset | Click chip | Tap chip | ✓ |
| Move panel | Drag | Pencil/finger drag + loupe | ✗ |
| Rotate panel | Handle drag / `R` | Handle drag | ✗ |
| Lock / unlock panel | Click icon | Tap icon | View only |
| Place obstruction | Toolbar + click | Toolbar + Pencil tap | ✓ (simple pin) |
| Set obstruction height | Type value | Stepper / numpad | ✓ |
| Sun time | Slider + arrow keys | Slider + Pencil drag | ✓ slider |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` | 2-finger tap / toolbar | — |
| Upload roof photo | File picker | Camera / file | ✓ |
| Move GPS pin | Drag | Drag | ✓ |
| Save / version | `Ctrl+S` | Save button | Auto (light edits) |

### 2.3 Phone light-edit scope (frozen)

Phone is **light-edit**, not read-only. Allowed: view layout, move GPS pin, upload roof photos,
add obstruction markers (tank/tree/chimney), adjust sun time slider, view measurements, view panel
layout, trigger a preset and view the result. **Disabled only:** precise polygon vertex editing and
pixel-level panel drag (require fine motor precision unsuitable for a phone; would create bad data).
Phone uses the **same Shared Editor Actions** — the `phone-adapter` simply does not expose the two
disabled operations.

---

## 3. Engine pipeline (frozen structure)

The Shared Editor Core is composed of **four named engines** in a strict, sequential dependency
chain. No engine performs another engine's job independently.

```
Roof Polygon (installer draws)
        │
        ▼
┌─────────────────────────────────────────┐
│  ENGINE 1 — Geometry Engine              │  Phase 1 — CURRENT SCOPE
│  turf area · buildable-area erosion      │
│  (setback) · obstruction subtraction     │
└───────────────────┬───────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  ENGINE 2 — Auto Panel Placement Engine  │  FUTURE (reserved) — the FOUNDATION
│  Output: PanelLayout (§4)                 │
└───────────────────┬───────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  ENGINE 3 — Engineering Rules Engine     │  FUTURE (reserved)
│  Validates BEFORE shadow, AFTER placement │
└───────────────────┬───────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  ENGINE 4 — Shadow Engine                │  FUTURE (reserved)
│  Consumes validated PanelLayout ONLY      │
└─────────────────────────────────────────┘
```

**Frozen workflow:**
`Roof → Auto Panel Placement → Engineering Rules Validation → Manual Adjustments → Shadow Analysis`

### 3.1 Frozen dependency rules

1. **Shadow Engine consumes `PanelLayout` only.** It must never compute shading directly from the
   roof polygon. Shadow results are therefore always **per-panel actionable** (e.g. "panel #7 is 30%
   shaded 9–11 AM winter"), not merely a roof-area percentage. This also prevents a second,
   independent shadow implementation from ever existing.
2. **Engineering Rules Engine sits between panel placement and shadow.** Validation runs on the
   `PanelLayout` before any shadow analysis.
3. **Auto Panel Placement Engine is the foundation.** It answers the installer's first question —
   "how many panels can fit?" — and produces the geometry every downstream engine depends on.

---

## 4. Engine dependency contract — `PanelLayout` (reserved interface)

This contract is **reserved now** so the Phase 1 data model accommodates future engines without
rework. (Interface only; not implemented in current scope.)

```
PanelLayout {
  siteLayoutId            // links to roof polygon (Engine 1 output)
  panelSpec               { widthMm, heightMm, wattage, model }
  orientation             "portrait" | "landscape" | "east_west"
  tiltDeg
  mountingType            "flush" | "elevated" | "ground_mount"
  setbackFt, walkwayFt
  panels: [
    { id, footprintGeoJson, rowIndex, colIndex,
      rotationDeg, isLocked, isManuallyPlaced }
  ]
  panelCount, dcCapacityKw, remainingAreaSqft, coveragePct
  generatedAt, editedAt
}
```

- **Shadow Engine input:** `PanelLayout.panels[]` + obstructions + sun position. Output: a
  `shadeFraction` per panel `id`, per time sample.
- **Preset behaviour rule:** applying a preset re-packs **only** unlocked panels; `isLocked` panels
  are untouched.

---

## 5. Data model (frozen)

### 5.1 `project_site_layouts` (Phase 1 — current scope)

Roof polygon + site context. Versioned, org-scoped, RLS like migration `038_project_designs.sql`.

```
project_site_layouts
  id, organization_id (NOT NULL, RLS), project_id
  design_id             FK → project_designs (nullable)
  version_number, is_current            -- one-current-per-project invariant
  center_lat, center_lng
  roof_geojson          jsonb           -- Polygon
  roof_azimuth_deg
  obstructions_geojson  jsonb           -- [{footprint, height_ft, type}]
  roof_area_sqft
  map_snapshot_path     text            -- Supabase storage
  created_by_id, created_at
```

On save, sync `project_site_surveys.shadow_free_sqft` and `shadow_analysis_note` (existing fields).

### 5.2 `project_panel_layouts` (reserved — Engine 2, future)

Reserved shape; not created in current scope. Persists the `PanelLayout` contract (§4). Per-panel
shadow values (Engine 4) attach onto `panels_geojson` entries.

### 5.3 API surface (client-agnostic)

- `GET / PUT /api/projects/[id]/site-layout` (+ `/versions`) — current scope.
- `GET / PUT /api/projects/[id]/panel-layout` — reserved for Engine 2.
- Same endpoints for all clients (Desktop, iPad, Phone). No mobile-only store.

---

## 6. Current implementation scope

**Only Phase 1 is in scope.** Everything in Engines 2–4 is architecturally reserved and lives in the
roadmap.

**Phase 1 — Shared editor foundation:**
- `project_site_layouts` migration + RLS + API.
- Editor Core v0: Geometry Engine actions (`ADD_VERTEX`, `MOVE_VERTEX`, `COMMIT_POLYGON`) + turf area.
- Input adapters: mouse + pencil/touch (parity from day one) + phone light-edit.
- Responsive shell: Desktop, iPad landscape/portrait, Phone.
- Map shell (Mapbox), GPS/geocode entry, roof polygon draw + save.
- Entry point: Project Hub → Design tab → "Open site layout" (replaces the current
  "future editor" placeholder in `components/projects/hub/project-hub-design-tab.tsx`).

---

## 7. Technology decisions (frozen)

| Concern | Decision |
|---------|----------|
| Map | Mapbox GL JS (satellite) |
| Draw | `@mapbox/mapbox-gl-draw` + **custom pointer-event layer** for Pencil/touch |
| Geometry | `@turf/turf` (geodesic area, buffer/erosion, simplify, centroid) |
| Sun position | `suncalc` (client-side, free) — IST |
| Map snapshot | `map.getCanvas().toDataURL('image/png')` (NOT `html2canvas` — fails on WebGL) |
| Snapshot storage | Supabase Storage bucket `site-layouts/` |
| Token | `NEXT_PUBLIC_MAPBOX_TOKEN` (URL-restricted public token) |
| Autosave | Local draft (IndexedDB) on both Desktop and iPad |

### 7.1 iPad / Apple Pencil interaction (frozen)

- **Pointer Events API** (`pointerType`: `pen` / `touch` / `mouse`).
- **Palm rejection:** while `pen` is active, ignore `touch` events.
- **Roles:** Pencil = draw/edit; 1-finger = pan; 2-finger = pinch zoom/rotate.
- **Two draw modes:** tap-to-place (precise) and freehand trace (press-drag → `turf.simplify`).
- **Precision aids:** undo/redo, vertex edit, right-angle/parallel snapping, magnifier loupe,
  Pencil hover crosshair.
- **iOS Safari:** `touch-action: none` on draw layer, `100dvh`, safe-area insets,
  `-webkit-touch-callout: none`, disable double-tap zoom, `preserveDrawingBuffer: true` only during
  snapshot capture.

### 7.2 Shadow math (reserved — Engine 4, documented for contract stability)

Flat/low-pitch assumption v1; per-obstruction: `shadowLength = height / tan(sunElevation)`,
direction `= sunAzimuth + 180°`, projected footprints unioned and intersected against panels.
True-north = map north (MP magnetic declination ≈ 0–1°, ignored). Output is a **planning estimate**,
not a certified shading report (disclaimer required in UI + PDF).

---

## 8. Testing & parity gates

- **Parity gate:** every parity-matrix row (§2.2) must work on **both** Desktop and iPad before a
  capability is considered complete.
- **Cross-device data test:** a layout created on one device reopens on the other with **identical**
  state and data (no feature/data loss).
- **Snapshot test:** exported PNG is never black (WebGL capture correctness).
- **Manual iPad QA is mandatory:** Apple Pencil interactions cannot be simulated by Playwright.
- **Phone:** verify light-edit subset only; no polygon/panel precise-edit UI exposed.

---

## 9. Change control (frozen document)

- This architecture is **frozen at v1.0**. It is the canonical source of truth.
- **Future ideas do not modify this document.** They are added to
  [`docs/roadmap/design-studio-roadmap.md`](../roadmap/design-studio-roadmap.md) only.
- Any change to this document requires **explicit approval** and a **version increment**
  (v1.0 → v1.1), with the change recorded in §11.
- Recall / continuation commands (product owner convention):
  - "Recall Design Studio" / "Continue Design Studio" / "Open Design Studio Architecture" → load
    **this** frozen document first.
  - "Design Studio Roadmap" / "Future ideas" / "Next phase" → load the **roadmap** document.

---

## 10. Open decisions (to confirm at implementation start — do not expand scope)

1. **Map provider:** Mapbox (recommended) vs Google Maps.
2. **Freehand trace mode:** launch with both tap + freehand, or tap-only for Phase 1.
3. **Panel spec source (Engine 2, future):** auto-pull default panel model/wattage from
   `project_designs`/BOM (recommended, with manual override) vs pick in editor each time.

---

## 11. Version history

| Version | Date | Change | Approved by |
|---------|------|--------|-------------|
| v1.0 | 2026-07-06 | Initial frozen architecture: single shared editor, parity by construction, 4-engine pipeline (Geometry → Auto Panel Placement → Engineering Rules → Shadow), phone light-edit, `project_site_layouts` data model, Phase 1 current scope. | Product owner |
