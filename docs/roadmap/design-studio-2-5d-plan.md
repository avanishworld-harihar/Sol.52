# Sol.52 Design Studio — 2.5D implementation plan

| Field | Value |
|---|---|
| Status | **PLANNED — NOT APPROVED FOR IMPLEMENTATION** |
| Plan version | v1.0-reviewed |
| Created / reviewed | 2026-10-26 |
| Trigger to start | Product owner explicitly says to implement this saved plan |
| Existing architecture impact | Requires an approved canonical architecture bump from v1.1 to v1.2 |
| Estimated delivery | 35–49 working days, followed by installer pilot |

> This document saves the complete plan only. It does not authorize dependency installation,
> database migration, Google Cloud configuration or 2.5D code implementation.

## 1. Product definition

2.5D means the existing accurate 2D roof/site drawing remains the source of truth while height,
roof plane, panel tilt and obstruction dimensions are used to generate an interactive perspective
scene. Users can orbit, tilt, rotate and zoom, but the system does not claim automatic photogrammetry
or a survey-grade digital twin.

The first release will provide:

- a `2D | 2.5D` mode switch inside the same Design Studio;
- extruded multi-section roofs with per-section elevation;
- parapets, water tanks, chimneys, trees and generic box/cylinder obstructions;
- panel frames rendered at saved footprint, orientation and tilt;
- north indicator, scale, reset camera and saved presentation view;
- live sun direction and visually cast shadows;
- synced selection between 2D and 2.5D;
- desktop and iPad parity, plus phone view-only 2.5D;
- graceful 2D fallback on unsupported/low-memory devices.

## 2. Explicit non-goals for this plan

- automatic roof extraction from satellite imagery;
- drone/LiDAR/photogrammetry processing;
- photorealistic building façades or neighbourhood reconstruction;
- structural loading, wind engineering or construction certification;
- replacing SAM/PVsyst or producing a certified shade report;
- arbitrary free-form mesh editing;
- moving Design/SLD into the customer proposal.

These boundaries keep the release achievable and prevent a visual model from being presented as
survey truth.

## 3. Current foundation and gaps

Reusable today:

- GeoJSON `Polygon | MultiPolygon` roof geometry;
- versioned `project_site_layouts` and `project_panel_layouts`;
- panel footprints, module dimensions, tilt, mounting type and manual/locked state;
- obstruction location, radius, height and datum;
- SunCalc-based sun position and the planning shadow engine;
- Google Maps hybrid imagery, camera centre, heading state and snapshot/export paths;
- desktop/iPad shared action architecture and draft recovery.

Gaps to close:

- stable roof-face IDs instead of relying only on array indexes;
- per-face base/eave/ridge height, pitch and facing direction;
- explicit rectangular/polygon obstruction footprints;
- a local metric coordinate frame for rendering;
- vector-map configuration and GPU overlay lifecycle;
- camera/presentation state persistence;
- renderer performance, context-loss recovery and visual regression coverage.

## 4. UX and workflow

### 4.1 Mode behavior

1. Design starts in 2D for precise tracing and panel editing.
2. `2.5D` opens the same saved design in perspective—no duplicate project/model.
3. Initial 2.5D release is visualization-first. Selecting a roof, panel or obstruction selects the
   same entity in 2D; precision vertex editing remains top-down.
4. Inspector changes to height, pitch, tilt or object size update both views immediately.
5. `Reset view`, `Top`, `North`, `Fit site` and `Save presentation view` are always available.
6. If WebGL fails, the editor returns to 2D without losing unsaved design state.

### 4.2 Input parity

| Action | Desktop | iPad | Phone |
|---|---|---|---|
| Orbit | right-drag / Shift+drag | two-finger drag | two-finger drag |
| Pan | left/middle drag | one-finger drag | one-finger drag |
| Zoom | wheel/pinch | pinch | pinch |
| Select object | click | tap/Pencil tap | tap/view details |
| Edit dimensions | inspector/keyboard | inspector/numpad | disabled |
| Precision roof edit | switch to 2D | switch to 2D | disabled |
| Reset/top/north | toolbar + shortcuts | toolbar | compact toolbar |

Orbit gestures must never conflict with Pencil drawing. While Pencil is active in 2D, touch remains
reserved for navigation according to the existing parity contract.

## 5. Technical architecture decision

### 5.1 Renderer

Use Google Maps JavaScript vector rendering plus `WebGLOverlayView`, with Three.js as the scene
renderer. Google documents that vector maps provide programmatic tilt/heading, fractional zoom and
custom 2D/3D WebGL overlays. References:

- <https://developers.google.com/maps/documentation/javascript/vector-map>
- <https://developers.google.com/maps/documentation/javascript/webgl>

Required configuration at implementation time:

- add a referrer-restricted Google Maps browser key as already used;
- create/configure a JavaScript **vector Map ID** in the same Cloud project;
- add `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` and keep a documented 2D fallback;
- explicitly enable vector rendering, tilt interaction and heading interaction;
- load Three.js behind the 2.5D feature boundary, not in the initial 2D bundle.

Do not adopt the separate Google `Map3DElement` as the first implementation: it would create a
second map/editor lifecycle and make exact synchronization with the current polygon editor harder.

### 5.2 One model, two projections

```text
Saved Design Scene
  ├─ Roof faces + metric height/pitch
  ├─ Obstruction footprints + height datum
  ├─ Existing panel footprints + tilt
  ├─ Sun/camera presentation state
  ├─ 2D Google Maps projection
  └─ 2.5D WebGL scene projection
```

The renderer is a pure projection. It must not create a second editable truth or calculate business
metrics independently.

### 5.3 Coordinate system

- Choose a stable scene anchor near the combined roof centroid.
- Convert WGS84 longitude/latitude to local East-North-Up metres for geometry calculations.
- Keep saved geometry in WGS84; local coordinates are derived/cache data only.
- Use the Google overlay coordinate transformer for camera matrices.
- Re-anchor only on project load, never during an edit session.
- Store heights internally in metres; convert feet only at UI/API boundaries.

This avoids precision jitter caused by feeding large geographic coordinates directly to WebGL.

## 6. Proposed data contract (implementation requires approval)

Create an additive, versioned `project_design_scenes` table rather than mutating old GeoJSON rows in
place. It will reference the exact site-layout and panel-layout versions used to build the scene.

```text
project_design_scenes
  id, organization_id, project_id
  site_layout_id, panel_layout_id
  version_number, is_current, schema_version
  scene_json
  created_by_id, created_at, updated_at
```

Proposed `scene_json` v1:

```text
anchor: { lng, lat, elevationM? }
roofFaces[]:
  { id, sectionIndex, footprintGeoJson,
    roofKind: flat | mono_pitch | dual_pitch,
    baseHeightM, eaveHeightM, ridgeHeightM?, pitchDeg, azimuthDeg,
    parapetHeightM, material }
obstructions[]:
  { id, type, footprint: circle | rectangle | polygon,
    center/geoJson, widthM?, depthM?, radiusM?, heightM,
    heightDatum: above_roof | agl, roofFaceId? }
panelProjection:
  { sourcePanelLayoutId, clearanceM, frameDepthM }
presentation:
  { headingDeg, tiltDeg, zoom, targetLng, targetLat,
    sunDateTimeIso, showShadows, showIrradiance }
```

Rules:

- legacy projects derive scene v1 lazily from current 2D data;
- a derived scene is not persisted until the user saves;
- every entity gets a stable ID; section index remains compatibility metadata only;
- all writes are org-scoped and validated with Zod plus SQL constraints;
- save site layout, panel layout and scene references consistently; reject stale version references;
- draft state includes `schemaVersion` and supports migration/rollback.

## 7. Geometry and visual accuracy

### 7.1 Roofs

- Triangulate roof footprints including valid holes; reject self-intersections with a visible fix
  prompt rather than guessing.
- Flat RCC: extrude footprint from ground/base datum to roof elevation.
- Mono-pitch: compute vertex Z from pitch and azimuth over the local plane.
- Dual-pitch: require explicit ridge line; split into two faces before generating planes.
- Parapets are separate wall meshes so their height participates in visual shadows.
- Roof-face area remains geodesic/projected 2D area; optionally display sloped surface area as a
  separate metric. Never silently replace the existing plan area.

### 7.2 Panels

- The existing footprint remains authoritative for XY position.
- Z comes from the supporting roof plane plus mounting clearance.
- Tilt and facing direction generate the panel transform; do not bake visual transforms back into
  the footprint without an explicit edit command.
- Use `InstancedMesh` grouped by module/material for large arrays.
- Preserve panel IDs for selection, shade result mapping, stringing and exports.

### 7.3 Obstructions

- Keep legacy circle behavior when no surveyed footprint exists.
- Add rectangle/polygon footprint editing in 2D before rendering in 2.5D.
- Resolve `above_roof` versus `agl` exactly once in a shared height function.
- Mark defaulted dimensions visually as “assumed”; measured values as “confirmed”.

## 8. Sun, shadow and yield strategy

Two distinct outputs must remain clearly labelled:

1. **Visual shadow:** GPU shadow map for a smooth sun-path preview.
2. **Numeric shade estimate:** deterministic CPU geometry/raycast result attached to panel IDs.

The GPU image must never become the authoritative numeric result. Numeric v2 will:

- use roof planes, parapets and polygon obstructions;
- sample multiple points per panel rather than only a single footprint fraction;
- use monthly representative days and daylight-hour weighting;
- avoid double counting overlapping occluders;
- return per-panel, per-time shade fraction with model/version metadata;
- run in a Web Worker and cancel stale calculations during slider movement;
- debounce continuous sun-slider input, then calculate the final precise result on release;
- retain the planning/non-certified disclaimer until independently benchmarked.

Validation set: at least 10 surveyed sites covering flat RCC, sloped shed, water tanks, trees,
parapets and adjacent buildings. Compare against field/drone measurements or a trusted reference
tool; define signed error tolerances before claiming improved accuracy.

## 9. Performance and resilience budgets

| Metric | Desktop target | iPad target |
|---|---:|---:|
| 1,000-panel orbit | ≥55 FPS p50, ≥40 FPS p95 | ≥30 FPS p50 |
| Selection feedback | <100 ms | <150 ms |
| 2.5D mode first usable | <2.5 s warm / <5 s cold | <4 s warm / <7 s cold |
| Sun-slider visual update | <50 ms | <80 ms |
| Numeric shade job | worker; UI never blocks >50 ms | worker; UI never blocks >50 ms |
| Context recovery | scene restored without reload/data loss | same |

Measures:

- dynamic import renderer/Three.js;
- instanced panel meshes and shared materials/geometries;
- level of detail for panel cell lines, trees and distant objects;
- dirty-flag rendering—no permanent animation loop while camera/scene is idle;
- object picking through instance IDs, not one DOM/Maps object per panel;
- dispose geometries/materials/listeners on mode switch;
- handle `webglcontextlost` and provide a one-click 2D fallback;
- cap device pixel ratio on iPad/low-memory devices;
- telemetry for mode load time, FPS bands, context loss and fallback reason—no geometry payloads.

## 10. Security, privacy and cost controls

- Keep API key HTTP-referrer restricted; Map ID and key belong to the same Cloud project.
- No service-role keys or unrestricted Google keys in the browser.
- RLS and org isolation mirror the current site/panel layout tables.
- Validate scene payload size, entity count and finite coordinate/height ranges server-side.
- Strip internal/customer data from renderer error telemetry.
- Track Maps loads and WebGL feature adoption before enabling by default.
- Feature flag rollout: internal → selected installers → opt-in production → default on.

## 11. Delivery phases and gates

| Phase | Working days | Deliverable | Acceptance gate |
|---|---:|---|---|
| 0. Contract + benchmark | 3–4 | Architecture v1.2 proposal, scene schema, 10-site fixture set, performance harness | Product owner approves scope/contracts; no implementation ambiguity |
| 1. Renderer foundation | 5–7 | Vector map, WebGL overlay, lazy bundle, 2D fallback, camera controls | Stable orbit/pan/zoom on desktop+iPad; context loss recovers |
| 2. Roof + obstruction scene | 6–8 | ENU conversion, flat/mono roof meshes, parapets, core obstruction meshes | Known dimensions reproduce within agreed tolerance; holes/invalid shapes fail visibly |
| 3. Panels + selection sync | 5–7 | Instanced panels, roof-plane Z, tilt, bidirectional selection | 1,000 panels meet FPS/selection budgets; IDs remain stable |
| 4. Sun + shadow v2 | 6–9 | GPU preview, worker numeric engine, debounced timeline, per-panel results | No UI blocking; overlap/height-datum regressions pass; benchmark report recorded |
| 5. Persistence + export | 4–6 | Migration/API/draft versioning, saved view, 2.5D snapshot/design pack image | Cross-device reopen is identical; stale-version writes rejected |
| 6. QA + pilot hardening | 6–8 | accessibility, iPad Pencil QA, browser/device matrix, telemetry, runbook | All automated gates + manual parity matrix + selected-installer sign-off |

Total: **35–49 working days**. Automatic imagery-to-roof reconstruction is not included.

## 12. Test plan

### Automated

- unit: ENU transforms, roof plane Z, mesh triangulation, panel transforms, height datum;
- property tests: round-trip WGS84↔ENU, finite meshes, panel IDs and bounds;
- geometry fixtures: convex, concave, holes, MultiPolygon, tiny/invalid rings;
- shadow fixtures: duplicate/overlap, below-roof trees, parapets, night/low sun;
- API/schema: org isolation, stale version, payload limits, legacy lazy derivation;
- Playwright: 2D↔2.5D switch, selection sync, fallback, save/reopen, screenshots;
- performance: 100/500/1,000/5,000 panels, memory/disposal and context-loss harness;
- visual regression: fixed camera/time for the 10 benchmark scenes.

### Mandatory manual

- Chrome/Edge desktop; Safari iPadOS on target iPad Air M1; current Android/iPhone view mode;
- mouse, trackpad, touch and Apple Pencil gesture conflicts;
- poor network, Maps failure, WebGL disabled, background/resume and orientation change;
- installer review of dimensions, assumptions, shadows and printed/exported disclaimer.

## 13. Rollout and rollback

1. Ship behind `DESIGN_STUDIO_2_5D` org entitlement/feature flag.
2. Internal fixture sites only; collect performance and geometry defects.
3. Selected-installer pilot with explicit feedback checklist.
4. Opt-in production; 2D remains the default until success thresholds are met.
5. Default-on only after crash/fallback rate and support load are acceptable.
6. Rollback disables the renderer flag only. Additive scene rows remain intact; 2D editing and
   current site/panel APIs continue to work.

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Vector map/Map ID misconfiguration | blank or non-tilting map | startup capability check + automatic 2D fallback |
| 2D and 2.5D drift | wrong customer/installer view | one scene model, stable IDs, cross-projection tests |
| WebGL load on iPad | lag/context loss | instancing, LOD, DPR cap, dirty rendering, device budget gate |
| Visual shadow differs from numeric | loss of trust | separate labels/engines; CPU result authoritative |
| Assumed heights look exact | false confidence | “assumed/confirmed” provenance and persistent disclaimer |
| Roof-index changes break panels | orphan/misplaced objects | stable roof-face IDs + migration mapping |
| Scope expands toward full 3D | missed schedule | non-goals and phase gates cannot be bypassed |

## 15. Plan review record

The plan was reviewed against the existing frozen architecture, current database/API contracts,
desktop/iPad parity promise, current Design/SLD separation rule, geometry/shadow audit findings,
performance characteristics and rollback requirements.

Review findings and resulting revisions:

1. **Initial idea: enable map tilt and extrude polygons only.** Rejected as insufficient because it
   would not provide stable IDs, height provenance, persistence or numeric/visual shadow separation.
2. **Initial idea: edit directly in 2.5D from day one.** Reduced to visualization-first with synced
   selection; precision topology edits remain 2D, lowering gesture and geometry risk.
3. **Initial idea: store 2.5D fields inside existing GeoJSON.** Replaced with an additive versioned
   scene record referencing exact 2D versions, preserving rollback and old clients.
4. **Initial idea: use rendered GPU shadows for shade numbers.** Rejected; deterministic worker
   calculations remain authoritative and benchmarkable.
5. **Missing fallback risk.** Added capability detection, context-loss handling, lazy loading and
   feature-flag rollback with no data loss.
6. **Missing assumption visibility.** Added measured/defaulted provenance and installer confirmation.
7. **Performance risk from one object per panel.** Added instancing, LOD, dirty rendering and explicit
   1,000-panel device budgets.
8. **Architecture change control.** Implementation cannot start until canonical architecture v1.2
   and the scene contract are explicitly approved.

### Final review verdict

**Ready to retain as the implementation blueprint; not authorized to build yet.** No unresolved
decision blocks Phase 0. Decisions that require the product owner at kickoff are limited to Google
Cloud Map ID ownership, the selected-installer benchmark sites and final rollout entitlement.

