# Design Studio quality review — 2026-10-26

| Field | Value |
|---|---|
| Scope | Existing 2D Design Studio only |
| Review type | Geometry, packing, shadow accuracy, interaction performance, persistence and tests |
| 2.5D implementation | Not started |
| Result | High-risk accuracy fallbacks removed; core regression coverage added |

## 1. Existing product reviewed

The review covered the shared roof geometry core, panel packing and movement, engineering warnings,
shadow calculations, Google Maps overlay lifecycle, save/version APIs, database contracts, draft
recovery, design-pack/SLD outputs and the Phase 6 QA scripts.

Strengths already present:

- one shared editor for desktop and iPad, with phone intentionally limited;
- multi-section GeoJSON roofs, versioned saves and IndexedDB recovery;
- module catalogue, target-kW/fill-max packing, locked panels and manual adjustment;
- obstruction height datum, IST sun samples and per-panel shade results;
- engineering warnings, design pack, SLD, BOM/project integrations and plan entitlements.

## 2. Findings resolved in this review

| Severity | Finding | Resolution |
|---|---|---|
| Critical | When requested setback produced no fit, auto-pack silently retried with zero setback. | Removed the retry. The requested setback is never weakened implicitly. |
| High | Setback erosion or obstruction subtraction could fail open and use unsafe geometry. | Geometry now fails closed; no panels are generated for the affected section. |
| High | Corner/centre sampling could accept a panel whose edge crossed a concave roof cut-out. | Containment now uses exact polygon difference (`panel − buildable = empty`). |
| High | Overlapping obstruction shadows were added twice and could inflate shade loss. | Shadows are subtracted sequentially from the unshaded panel polygon, so overlap is counted once. |
| High | Runtime SunCalc unit guessing was ambiguous near the horizon/north. | Locked SunCalc v2 degree contract is used directly. |
| Medium | Roof azimuth depended on the first drawn edge. | The longest exterior edge across all roof sections now determines the dominant bearing. |
| Medium | Malformed/open GeoJSON rings could pass through inconsistently. | Coordinates are validated, consecutive duplicates removed and rings closed; an invalid interior ring rejects the roof instead of disappearing. |
| Medium | Large layouts created several decorative polylines per panel. | Cell-detail polylines are disabled above 400 panels; the functional panel geometry remains. |
| Medium | Annual shadow analysis ran during ordinary panel interactions even when hidden. | It now runs only while shadow output or the design pack needs it. |
| Medium | Existing QA scripts mostly tested copies/smoke helpers rather than production modules. | Added `test:design-studio-core`, which loads the real TypeScript modules and exercises the fixed behavior. |

## 3. Verification completed

- `npm run test:design-studio-phase6` — passes, including the new production-module regression suite.
- `npm run typecheck` — passes.
- Regression cases include: ring closure/rejection, dominant-edge azimuth, concave containment,
  no zero-setback fallback, SunCalc degree parity and overlapping-shadow de-duplication.

## 4. Known limitations intentionally not hidden

These are not regressions introduced by this review. They require larger product/model decisions and
are routed into the saved 2.5D plan rather than being patched ad hoc.

1. Auto-pack uses a north-aligned grid. It can under-use rotated roofs; manual plant rotation is
   available, but a roof-aligned packing basis needs a stable face-orientation model.
2. `walkway_ft` influences spacing heuristically; it is not yet a drawn access corridor.
3. Obstructions are circular point/radius models, not surveyed polygon footprints.
4. Numeric shadow results remain a flat/low-pitch planning estimate with six solstice samples.
5. The yield estimate is planning-grade; it is not a bankable simulation or certified shade report.
6. Google Maps raster mode is currently initialized at zero tilt; there is no 2.5D renderer.
7. Manual iPad + Apple Pencil QA and a selected-installer pilot remain process gates.

## 5. Recommended operating rule until 2.5D

- Treat geometry errors as blocking, never as permission to reduce safety clearances.
- Keep the existing planning disclaimer on shadow/yield outputs.
- Require installer confirmation of roof dimensions, heights, setbacks and obstructions before
  using the pack for construction.
- Do not call the current six-sample estimate a certified annual shade report.

