#!/usr/bin/env node
/**
 * Proposal A4 sheet fit check.
 *
 * Renders preset preview routes at phone, tablet-portrait, tablet-landscape and
 * desktop widths and asserts the A4 sheet keeps its designed size at every one.
 * A sheet that narrows on a tablet is the regression that made iPad portrait,
 * iPad landscape and print disagree, so this fails the run instead of leaving
 * it to be noticed on a device.
 *
 * Usage:
 *   node scripts/check-proposal-sheet-fit.mjs [--base http://localhost:3000]
 *
 * Requires a running dev/prod server and the `playwright` dev dependency.
 */

import process from "node:process";

const SHEET_WIDTH_PX = 794;
const SHEET_HEIGHT_PX = 1123;
const WIDTH_TOLERANCE_PX = 6;
const HEIGHT_TOLERANCE_PX = 8;

/** Routes that render a real preset. Add new preset previews here. */
const ROUTES = [
  { path: "/dev/luxe-preview", label: "atelier" },
  { path: "/dev/premium-luxe-preview", label: "luxe-noir" },
  { path: "/dev/voltaic-preview", label: "voltaic" },
];

const VIEWPORTS = [
  { label: "phone", width: 390, height: 844, expectSheet: false },
  { label: "tablet-portrait", width: 834, height: 1112, expectSheet: true },
  { label: "tablet-portrait-mini", width: 768, height: 1024, expectSheet: true },
  { label: "tablet-landscape", width: 1194, height: 834, expectSheet: true },
  { label: "desktop", width: 1440, height: 900, expectSheet: true },
];

/**
 * Rotating a tablet resizes the viewport without reloading, so the shell has to
 * re-measure on the fly. Printing must drop the scale entirely. Both are how
 * the layout diverged before, so both are asserted rather than assumed.
 */
const ROTATION_STEPS = [
  { label: "portrait", width: 834, height: 1112 },
  { label: "landscape (rotated)", width: 1194, height: 834 },
  { label: "portrait (rotated back)", width: 834, height: 1112 },
];

const MEASURE = `(() => {
  const wrap = document.querySelector('[data-proposal-fit]');
  if (!wrap) return { error: 'no fit wrapper' };
  const zoom = parseFloat(getComputedStyle(wrap).zoom) || 1;
  const sections = Array.from(wrap.querySelectorAll('section')).slice(0, 6);
  if (!sections.length) return { error: 'no sections' };
  const sheet = sections
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .sort((a, b) => b.r.width - a.r.width)[0];
  return {
    fit: wrap.getAttribute('data-proposal-fit'),
    zoom,
    sheetCssWidth: Math.round(sheet.r.width / zoom),
    sheetCssHeight: Math.round(sheet.r.height / zoom),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  };
})()`;

function parseArgs() {
  const args = process.argv.slice(2);
  const baseIdx = args.indexOf("--base");
  return {
    base: baseIdx >= 0 ? args[baseIdx + 1] : "http://localhost:3000",
  };
}

async function main() {
  const { base } = parseArgs();
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("playwright is not installed — run: npm i -D playwright && npx playwright install chromium");
    process.exit(2);
  }

  const browser = await chromium.launch();
  const failures = [];
  const rows = [];

  try {
    for (const route of ROUTES) {
      for (const vp of VIEWPORTS) {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        try {
          await page.goto(`${base}${route.path}`, {
            waitUntil: "networkidle",
            timeout: 90_000,
          });
          await page.waitForSelector("[data-proposal-fit] section", { timeout: 60_000 });
          // Let fonts/images settle so the fit shell has run its final pass.
          await page.waitForTimeout(1200);

          const result = await page.evaluate(MEASURE);
          const id = `${route.label} @ ${vp.label} (${vp.width}px)`;

          if (result.error) {
            failures.push(`${id}: ${result.error}`);
            continue;
          }
          rows.push({ id, ...result });

          if (result.scrollWidth > result.innerWidth + 2) {
            failures.push(
              `${id}: horizontal overflow — scrollWidth ${result.scrollWidth} > innerWidth ${result.innerWidth}`
            );
          }

          if (!vp.expectSheet) continue;

          if (Math.abs(result.sheetCssWidth - SHEET_WIDTH_PX) > WIDTH_TOLERANCE_PX) {
            failures.push(
              `${id}: sheet width ${result.sheetCssWidth}px, expected ~${SHEET_WIDTH_PX}px. ` +
                `The A4 sheet must keep its width on every screen; scale it instead of reflowing it.`
            );
          }
          if (Math.abs(result.sheetCssHeight - SHEET_HEIGHT_PX) > HEIGHT_TOLERANCE_PX) {
            failures.push(
              `${id}: sheet height ${result.sheetCssHeight}px, expected ~${SHEET_HEIGHT_PX}px.`
            );
          }
        } finally {
          await page.close();
        }
      }

      // Rotation + print on a single page instance (no reload between steps).
      const page = await browser.newPage({
        viewport: { width: 834, height: 1112 },
        deviceScaleFactor: 1,
      });
      try {
        await page.goto(`${base}${route.path}`, {
          waitUntil: "networkidle",
          timeout: 90_000,
        });
        await page.waitForSelector("[data-proposal-fit] section", { timeout: 60_000 });

        for (const step of ROTATION_STEPS) {
          await page.setViewportSize({ width: step.width, height: step.height });
          await page.waitForTimeout(1200);
          const result = await page.evaluate(MEASURE);
          const id = `${route.label} @ ${step.label}`;
          if (result.error) {
            failures.push(`${id}: ${result.error}`);
            continue;
          }
          rows.push({ id, ...result });
          if (Math.abs(result.sheetCssWidth - SHEET_WIDTH_PX) > WIDTH_TOLERANCE_PX) {
            failures.push(
              `${id}: sheet width ${result.sheetCssWidth}px after rotation, expected ~${SHEET_WIDTH_PX}px.`
            );
          }
          if (result.scrollWidth > result.innerWidth + 2) {
            failures.push(`${id}: horizontal overflow after rotation`);
          }
        }

        await page.emulateMedia({ media: "print" });
        await page.waitForTimeout(600);
        const printed = await page.evaluate(MEASURE);
        const printId = `${route.label} @ print`;
        rows.push({ id: printId, ...printed });
        if (printed.zoom !== 1) {
          failures.push(`${printId}: print must not be scaled (zoom ${printed.zoom})`);
        }
        if (Math.abs(printed.sheetCssWidth - SHEET_WIDTH_PX) > WIDTH_TOLERANCE_PX) {
          failures.push(
            `${printId}: sheet width ${printed.sheetCssWidth}px, expected ~${SHEET_WIDTH_PX}px.`
          );
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\n=== Proposal A4 sheet fit ===\n");
  for (const row of rows) {
    console.log(
      `  ${row.id.padEnd(46)} sheet ${String(row.sheetCssWidth).padStart(4)}x${row.sheetCssHeight}  zoom ${row.zoom}  fit ${row.fit}`
    );
  }

  if (failures.length) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log("\nAll sheet-fit checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
