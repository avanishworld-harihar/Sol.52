/**
 * Behavioral checks against the real Design Studio TypeScript modules.
 * A tiny TypeScript require hook keeps this repository test-runner agnostic.
 */
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  const resolvedRequest = request.startsWith("@/")
    ? path.join(repoRoot, request.slice(2))
    : request;
  return originalResolveFilename.call(this, resolvedRequest, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = require("node:fs").readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const {
  calculateRoofMetrics,
  normalizeRoofPolygon,
} = require("../components/site-layout/core/geometry.ts");
const {
  autoPackPanels,
  createManualPanelAt,
  footprintInsideBuildable,
} = require("../components/site-layout/core/panel-placement.ts");
const {
  analyzePanelShadows,
  dateAtIst,
  sunPoseAt,
} = require("../lib/design-studio-shadow.ts");
const { polygon } = require("@turf/helpers");
const SunCalc = require("suncalc");

const openRing = {
  type: "Polygon",
  coordinates: [[[77, 23], [77.001, 23], [77.001, 23.001], [77, 23.001]]],
};
const normalized = normalizeRoofPolygon(openRing);
assert.ok(normalized, "valid open ring should normalize");
assert.deepEqual(
  normalized.coordinates[0][0],
  normalized.coordinates[0].at(-1),
  "normalization should close the ring"
);
assert.equal(
  normalizeRoofPolygon({
    ...openRing,
    coordinates: [openRing.coordinates[0], [[77, 23], ["bad", 23], [77, 23.1]]],
  }),
  null,
  "a malformed roof void must invalidate the polygon, not disappear"
);

const shortEdgeFirst = normalizeRoofPolygon({
  type: "Polygon",
  coordinates: [[[77, 23], [77, 23.0001], [77.001, 23.0001], [77.001, 23], [77, 23]]],
});
assert.ok(shortEdgeFirst);
const azimuth = calculateRoofMetrics(shortEdgeFirst).azimuthDeg;
assert.ok(
  azimuth != null && (Math.abs(azimuth - 90) < 1 || Math.abs(azimuth - 270) < 1),
  `dominant edge should drive azimuth, received ${azimuth}`
);

const concaveRoof = polygon([[
  [0, 0], [10, 0], [10, 10], [6, 10], [6, 7], [5, 6], [4, 7], [4, 10], [0, 10], [0, 0],
]]);
const bridgeAcrossNotch = {
  type: "Polygon",
  coordinates: [[[3, 5], [7, 5], [7, 8], [3, 8], [3, 5]]],
};
assert.equal(
  footprintInsideBuildable(bridgeAcrossNotch, concaveRoof),
  false,
  "panel edges must not bridge a concave roof cut-out"
);

const tinyRoof = normalizeRoofPolygon({
  type: "Polygon",
  coordinates: [[[77, 23], [77.000002, 23], [77.000002, 23.000002], [77, 23.000002], [77, 23]]],
});
assert.ok(tinyRoof);
const panelSpec = { model: "test", width_mm: 1134, height_mm: 2278, wattage: 550 };
const tinyPack = autoPackPanels({
  roof: tinyRoof,
  obstructions: [],
  panelSpec,
  orientation: "portrait",
  setbackFt: 1.5,
  packMode: "fill_max",
});
assert.equal(tinyPack.panelCount, 0, "requested setback must never be silently reduced to zero");

const sampleDate = dateAtIst(2026, 6, 21, 9);
const directSun = SunCalc.getPosition(sampleDate, 23.2599, 77.4126);
const studioSun = sunPoseAt(sampleDate, 23.2599, 77.4126);
assert.ok(Math.abs(studioSun.altitudeDeg - directSun.altitude) < 1e-9);
assert.ok(Math.abs(studioSun.sunBearingDeg - directSun.azimuth) < 1e-9);

const panel = createManualPanelAt({
  lng: 77.4126,
  lat: 23.2599,
  panelSpec,
  orientation: "portrait",
});
assert.ok(panel);
let partialObstruction = null;
let oneShadow = null;
for (let offset = -0.00004; offset <= 0.00004; offset += 0.000002) {
  const obstruction = {
    id: "ob-1",
    type: "chimney",
    lng: 77.4126 + offset,
    lat: 23.2599,
    height_ft: 6,
    radius_ft: 0.25,
    height_datum: "above_roof",
  };
  const result = analyzePanelShadows({
    panels: [panel],
    obstructions: [obstruction],
    date: sampleDate,
    latitudeDeg: 23.2599,
    longitudeDeg: 77.4126,
  });
  if (result.meanShadeFraction > 0.02 && result.meanShadeFraction < 0.95) {
    partialObstruction = obstruction;
    oneShadow = result;
    break;
  }
}
assert.ok(partialObstruction && oneShadow, "test setup should find a partial shadow");
const duplicateShadow = analyzePanelShadows({
  panels: [panel],
  obstructions: [partialObstruction, { ...partialObstruction, id: "ob-2" }],
  date: sampleDate,
  latitudeDeg: 23.2599,
  longitudeDeg: 77.4126,
});
assert.equal(
  duplicateShadow.meanShadeFraction,
  oneShadow.meanShadeFraction,
  "overlapping shadows must be counted once"
);

console.log("design-studio-core-tests: ok");
