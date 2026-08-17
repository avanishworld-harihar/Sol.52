# Proposal page contract

Rules every proposal preset follows — residential, commercial, and any preset added later.

## The sheet never changes size

A preset page is an A4 sheet: **794 × 1123 px** (210 × 297 mm). That size is the same on a phone, an iPad in either orientation, a desktop browser, in print, and in the exported PDF.

When a screen is too narrow for the sheet, `ProposalPageFit` scales the whole document down, the way a PDF viewer does. It does **not** make the sheet narrower.

This matters because a page is a *fixed-height* box. Shrinking only its width keeps the height, so the content is squeezed and clipped. iPad portrait (~768–834 px) is narrower than the sheet and landscape (~1024–1194 px) is wider, which is exactly how one proposal ended up rendering three different ways across portrait, landscape and print while desktop looked right.

## What this means when you add a preset

- Give each page a fixed `210mm × 297mm` (or `794px × 1123px`) box.
- Render one `<section>` per page.
- Put `data-proposal-preset="<preset id>"` on the renderer root.
- Register the preset in `components/proposals/_registry/preset-renderers.ts`. `ProposalRenderer` wraps every registered preset in the fit shell, so you get tablet and print behaviour for free.
- **Do not** add a `@media (max-width: …)` above **640 px** that changes a page's `width`, `max-width`, `flex-direction`, or collapses `min-height` to `0`. Below 640 px you may stack the page into a phone layout; above it the sheet must stay intact and let the shell scale it.
- Letting a page grow taller (`height: auto` with the `min-height` kept) is fine.

## Checks

Both run against every preset, including ones added later.

| Check | Command | What it does |
| --- | --- | --- |
| Static | `npm run test:proposal-stability` | Scans preset CSS for sheet-resizing rules above 640 px. Runs in `npm run build`. |
| Runtime | `npm run test:proposal-sheet-fit` | Loads preview routes in a headless browser at phone/tablet/desktop widths and asserts the sheet measures 794 × 1123 everywhere. Needs a running server and `npx playwright install chromium`. |

Add new preview routes to `ROUTES` in `scripts/check-proposal-sheet-fit.mjs` to cover a new preset in the runtime check.

## PDF export

`buildAtelierProposalPdf` (re-exported as `buildResidentialProposalPdf` from `residential-pdf-export.ts`) rasterises each page off-screen at exact A4 pixels. It is preset-agnostic: pass your `root`, `presetId` and `pageSelector`. It reads the sheet background from the live page, so dark themes export correctly without registering anything.
