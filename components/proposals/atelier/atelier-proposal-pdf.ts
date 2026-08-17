/**
 * Atelier PDF export — per-page raster capture.
 *
 * iPad / iOS: native window.print() mis-paginates (26 pages), drops photos, and
 * cannot match the on-screen A4 layout. Capture clones each live section at the
 * same 794×1123px geometry the web proposal uses — no alternate capture layout.
 *
 * Rasterizer: modern-screenshot (SVG <foreignObject>) is preferred because the
 * browser itself paints the markup, so the bitmap matches the live proposal
 * exactly. html2canvas re-implements CSS layout and text metrics, which on iPad
 * produced object-fit images stretching, text baselines drifting into bars and
 * card edges, heading underlines colliding with the heading, and content
 * spilling past the sheet. It stays only as a fallback if foreignObject
 * capture fails.
 */

type JsPdfCtor = typeof import("jspdf").jsPDF;
type Html2CanvasFn = typeof import("html2canvas")["default"];
type DomToCanvasFn = typeof import("modern-screenshot")["domToCanvas"];

import styles from "./atelier.module.css";

const A4_W_PX = 794;
const A4_H_PX = 1123;

export const ATELIER_PDF_CAPTURE_HOST_ID = "atelier-pdf-capture-host";

export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Classic iOS/iPadOS UA still carries the device name.
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  /*
   * iPadOS 13+ Safari requests desktop sites by default: the UA reports as
   * "Macintosh" and navigator.platform can be "MacIntel" — indistinguishable
   * from a real Mac by UA alone. A genuine desktop Mac has no touch screen
   * (maxTouchPoints === 0), so touch capability on an Apple-reported platform
   * means it is really an iPad. navigator.platform is deprecated and empty in
   * some browsers, so also accept an Apple-looking UA. This keeps real Macs on
   * the native (vector) print path while routing every iPad to the raster
   * html2canvas capture, which is the only path that reproduces the A4 layout
   * on iPadOS (native print mis-paginates and splits single pages).
   */
  const maxTouch = navigator.maxTouchPoints || 0;
  const applePlatform =
    navigator.platform === "MacIntel" || /Mac/i.test(ua);
  return applePlatform && maxTouch > 1;
}

function safeFileName(input: string): string {
  return input.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "solar-proposal";
}

async function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return;
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const done = () => {
            void img.decode?.().then(() => resolve()).catch(() => resolve());
          };
          if (img.complete && img.naturalWidth > 0) return done();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          window.setTimeout(() => resolve(), 8000);
        })
    )
  );
}

/*
 * Atelier's only font source is a runtime `@import url(fonts.googleapis.com...)`
 * inside a <style> tag rendered as a child of the root (see atelier-renderer.tsx).
 * html2canvas re-resolves that @import inside a *fresh* cloned document/iframe,
 * which means the fonts must be re-fetched there too. On desktop this usually
 * resolves from cache in a few ms; on iPad Safari, cross-origin font requests
 * made from that freshly created capture context are far more likely to hit a
 * slow/blocked network round trip (stricter cache partitioning for third-party
 * resources) — so the capture proceeds before Montserrat/Lato are ready and
 * silently falls back to the system font, changing line-wrapping, spacing and
 * page fills only in the exported PDF. Explicitly loading the exact families
 * we use and awaiting `document.fonts.ready` on *that* document closes the race.
 */
const ATELIER_FONT_SPECS = [
  "300 16px Lato",
  "400 16px Lato",
  "700 16px Lato",
  "400 16px Montserrat",
  "500 16px Montserrat",
  "600 16px Montserrat",
  "700 16px Montserrat",
  "800 16px Montserrat",
];

async function waitForFontSet(
  fontSet: FontFaceSet | undefined,
  timeoutMs: number
): Promise<void> {
  if (!fontSet) return;
  try {
    await Promise.all(
      ATELIER_FONT_SPECS.map((spec) => fontSet.load(spec).catch(() => []))
    );
  } catch {
    /* best-effort — fall through to the ready race below */
  }
  await Promise.race([
    fontSet.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

async function waitForFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  await waitForFontSet(document.fonts, 8000);
}

function applyPageBox(el: HTMLElement, source?: HTMLElement): void {
  el.style.setProperty("width", `${A4_W_PX}px`, "important");
  el.style.setProperty("max-width", `${A4_W_PX}px`, "important");
  el.style.setProperty("height", `${A4_H_PX}px`, "important");
  el.style.setProperty("min-height", `${A4_H_PX}px`, "important");
  el.style.setProperty("max-height", `${A4_H_PX}px`, "important");
  el.style.setProperty("margin", "0", "important");
  el.style.setProperty("box-shadow", "none", "important");
  el.style.setProperty("border", "0", "important");
  el.style.setProperty("border-radius", "0", "important");
  el.style.setProperty("overflow", "hidden", "important");
  el.style.setProperty("box-sizing", "border-box", "important");
  el.style.setProperty("position", "relative", "important");
  el.style.setProperty("transform", "none", "important");
  /*
   * Copy the live page's flex axis. Atelier sheets are column; Emerald /
   * Sienna split-folios are row (sidebar | content). Forcing column here
   * stacked Emerald's green rail on top of the photo — iPad PDF looked
   * nothing like the on-screen A4 split.
   */
  let display = "flex";
  let dir = "column";
  try {
    const cs = getComputedStyle(source && source.isConnected ? source : el);
    if (cs.display && cs.display !== "none") display = cs.display;
    if (cs.flexDirection === "row" || cs.flexDirection === "row-reverse") {
      dir = cs.flexDirection;
    }
  } catch {
    /* keep column default */
  }
  el.style.setProperty("display", display, "important");
  el.style.setProperty("flex-direction", dir, "important");
  if (dir === "row" || dir === "row-reverse") {
    el.style.setProperty("align-items", "stretch", "important");
  }
}

function prepareCaptureClone(root: ParentNode): void {
  /*
   * Drop any live-preview marker inside the capture subtree so viewport-based
   * @media (max-width) tablet rules can never match on small screens (iPad).
   * The capture host must render the fixed desktop/print A4 layout everywhere.
   */
  if (root instanceof HTMLElement) {
    root.removeAttribute("data-proposal-live");
    delete root.dataset.proposalLive;
  }
  for (const live of Array.from(
    root.querySelectorAll<HTMLElement>("[data-proposal-live]")
  )) {
    live.removeAttribute("data-proposal-live");
    delete live.dataset.proposalLive;
  }
  for (const inner of Array.from(root.querySelectorAll<HTMLElement>("[class*='pageInner']"))) {
    inner.style.setProperty("flex", "1 1 auto", "important");
    inner.style.setProperty("min-height", "0", "important");
    inner.style.setProperty("overflow", "hidden", "important");
    inner.style.setProperty("display", "flex", "important");
    inner.style.setProperty("flex-direction", "column", "important");
  }
  for (const footer of Array.from(root.querySelectorAll<HTMLElement>("[class*='pageFooter']"))) {
    footer.style.setProperty("margin-top", "auto", "important");
    footer.style.setProperty("flex-shrink", "0", "important");
  }
}

function syncCloneImages(clone: ParentNode): void {
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  for (const img of Array.from(clone.querySelectorAll("img"))) {
    const src = img.currentSrc || img.src;
    if (!src) continue;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    /*
     * Off-screen (left:-10000px) images never intersect the viewport, and
     * Safari's lazy-load implementation is far more conservative than
     * Chromium's about ever firing `load` for an element that will never be
     * seen — drop the hint so every image decodes eagerly for capture.
     */
    img.removeAttribute("loading");
    img.decoding = "sync";

    let isCrossOrigin = false;
    try {
      isCrossOrigin = Boolean(currentOrigin) && new URL(src, currentOrigin).origin !== currentOrigin;
    } catch {
      isCrossOrigin = false;
    }
    /*
     * Only force a CORS-mode reload when the image is actually cross-origin.
     * Re-assigning `src` after adding `crossOrigin` always triggers a brand
     * new network request in CORS mode — on Safari/iPadOS that request can
     * fail (or simply never resolve in time) even though the same asset just
     * displayed fine live without CORS, which silently drops or blanks
     * photos only in the exported PDF.
     */
    if (isCrossOrigin) {
      img.crossOrigin = "anonymous";
      img.src = src;
    }
  }
}

function cloneRootStyleTags(root: HTMLElement, shell: HTMLElement): void {
  /*
   * `createRootShell` deliberately uses a shallow clone of the root so it
   * keeps only the class/attributes needed for descendant selectors. That
   * also drops any <style> children rendered directly under the root (e.g.
   * Atelier's Google Fonts @import + print @page rules). html2canvas builds
   * its own document clone independently, but carrying these over on our own
   * clone removes any dependency on how faithfully it does that.
   */
  for (const styleEl of Array.from(root.querySelectorAll(":scope > style"))) {
    shell.appendChild(styleEl.cloneNode(true));
  }
}

function createCaptureHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.id = ATELIER_PDF_CAPTURE_HOST_ID;
  host.className = styles.pdfCaptureHost;
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    /*
     * Keep the capture tree fully opaque. html2canvas includes ancestor
     * opacity in the bitmap, so opacity:0.01 washed out colours and made
     * chart bars effectively disappear on iPad.
     */
    "left:-10000px",
    "top:0",
    `width:${A4_W_PX}px`,
    `height:${A4_H_PX}px`,
    "overflow:hidden",
    "pointer-events:none",
    "z-index:-1",
    "background:#fff",
  ].join(";");
  document.body.appendChild(host);
  return host;
}

function createRootShell(root: HTMLElement): HTMLElement {
  /*
   * Pages depend on theme variables and descendant selectors declared on the
   * renderer root (Atelier's --page-pad-x, --or, --h, etc.). Cloning a page
   * directly under a generic host drops that context and produces zero
   * padding, wrong colours and broken charts.
   */
  const shell = root.cloneNode(false) as HTMLElement;
  shell.removeAttribute("id");
  shell.removeAttribute("aria-label");
  /*
   * The live root carries data-proposal-live="true" so responsive
   * @media screen (max-width) tablet/phone rules scope to the on-screen
   * preview only. cloneNode copies that marker onto the capture shell, and
   * because the off-screen host still lives in the real document, on an iPad
   * (viewport < 1180px) those fluid rules would match the capture clone —
   * turning fixed A4 sheets into auto-height/overflowing pages (wrong colours,
   * broken layout, 12 pages ballooning to ~24). Strip it so only the
   * capture-host print-mirror CSS applies, matching the PC print/@media print
   * output on every device.
   */
  shell.removeAttribute("data-proposal-live");
  delete shell.dataset.proposalLive;
  shell.dataset.pdfCaptureRoot = "true";
  shell.style.setProperty("display", "block", "important");
  shell.style.setProperty("width", `${A4_W_PX}px`, "important");
  shell.style.setProperty("min-width", `${A4_W_PX}px`, "important");
  shell.style.setProperty("max-width", `${A4_W_PX}px`, "important");
  shell.style.setProperty("height", `${A4_H_PX}px`, "important");
  shell.style.setProperty("min-height", `${A4_H_PX}px`, "important");
  shell.style.setProperty("margin", "0", "important");
  shell.style.setProperty("padding", "0", "important");
  shell.style.setProperty("overflow", "hidden", "important");
  shell.style.setProperty("transform", "none", "important");
  return shell;
}

export type AtelierPdfProgress = {
  current: number;
  total: number;
};

export type AtelierPdfFile = {
  blob: Blob;
  fileName: string;
};

export function downloadPdfFile(file: AtelierPdfFile): void {
  if (typeof window === "undefined") return;
  /*
   * iOS Safari ignores <a download> and navigates to the blob: URL. Refreshing
   * that tab then fails with WebKitBlobResource error 1 because the blob is gone.
   * Share the file in-place (or an overlay on this page) — never change location.
   */
  if (isAppleTouchDevice()) {
    void sharePdfOnAppleTouch(file);
    return;
  }
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

async function sharePdfOnAppleTouch(file: AtelierPdfFile): Promise<void> {
  try {
    const shared = await sharePdfFile(file);
    if (shared) return;
    return;
  } catch {
    /* Share unavailable — keep the user on the proposal page. */
  }
  presentPdfOverlay(file);
}

function presentPdfOverlay(file: AtelierPdfFile): void {
  const existing = document.querySelector("[data-proposal-pdf-overlay='true']");
  existing?.remove();
  const url = URL.createObjectURL(file.blob);
  const wrap = document.createElement("div");
  wrap.setAttribute("data-proposal-pdf-overlay", "true");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-label", file.fileName);
  wrap.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;background:#0f172a;display:flex;flex-direction:column;";
  const bar = document.createElement("div");
  bar.style.cssText =
    "flex:0 0 auto;display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;padding-top:max(12px,env(safe-area-inset-top));background:#0f172a;";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.style.cssText =
    "min-height:44px;padding:8px 16px;border:0;border-radius:8px;background:#f8fafc;color:#0f172a;font:600 14px/1.2 system-ui,sans-serif;";
  const iframe = document.createElement("iframe");
  iframe.src = `${url}#view=FitH`;
  iframe.title = file.fileName;
  iframe.style.cssText = "flex:1;width:100%;border:0;background:#fff;";
  const cleanup = () => {
    wrap.remove();
    URL.revokeObjectURL(url);
  };
  close.addEventListener("click", cleanup);
  bar.appendChild(close);
  wrap.appendChild(bar);
  wrap.appendChild(iframe);
  document.body.appendChild(wrap);
}

/** iOS Share — files only (no title) to avoid extra text.txt in Files. */
export async function sharePdfFile(file: AtelierPdfFile): Promise<boolean> {
  const pdfFile = new File([file.blob], file.fileName, {
    type: "application/pdf",
  });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  if (typeof nav.share !== "function") {
    throw new Error("Share is not supported on this device.");
  }

  const shareData: ShareData = { files: [pdfFile] };
  if (nav.canShare && !nav.canShare(shareData)) {
    throw new Error("Sharing PDF files is not supported on this device.");
  }

  try {
    await nav.share(shareData);
    return true;
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "AbortError") return false;
    throw err;
  }
}

/**
 * Backing colour behind a captured sheet.
 *
 * Read it from the live page instead of matching class names: a class-name
 * heuristic only knows the preset it was written for, so every other preset
 * (and every preset added later) fell back to white and dark themes rendered a
 * white halo around the sheet edges.
 */
function resolveSheetBackground(source: HTMLElement): string {
  let node: HTMLElement | null = source;
  for (let depth = 0; node && depth < 4; depth += 1) {
    const color = getComputedStyle(node).backgroundColor;
    if (color && !/^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/.test(color)) {
      return color;
    }
    node = node.parentElement;
  }
  return "#ffffff";
}

function relaxPageBox(el: HTMLElement): void {
  el.style.setProperty("width", `${A4_W_PX}px`, "important");
  el.style.setProperty("max-width", `${A4_W_PX}px`, "important");
  el.style.setProperty("height", "auto", "important");
  el.style.setProperty("min-height", "0", "important");
  el.style.setProperty("max-height", "none", "important");
  el.style.setProperty("overflow", "visible", "important");
  el.style.setProperty("margin", "0", "important");
  el.style.setProperty("box-shadow", "none", "important");
  el.style.setProperty("border", "0", "important");
  el.style.setProperty("border-radius", "0", "important");
  el.style.setProperty("box-sizing", "border-box", "important");
  el.style.setProperty("position", "relative", "important");
  el.style.setProperty("transform", "none", "important");
}

function sliceCanvasToA4Pages(
  fullCanvas: HTMLCanvasElement,
  scale: number,
  background: string
): HTMLCanvasElement[] {
  const slicePx = A4_H_PX * scale;
  const pages: HTMLCanvasElement[] = [];
  for (let y = 0; y < fullCanvas.height; y += slicePx) {
    const sliceH = Math.min(slicePx, fullCanvas.height - y);
    const page = document.createElement("canvas");
    page.width = A4_W_PX * scale;
    page.height = slicePx;
    const ctx = page.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, page.width, page.height);
    ctx.drawImage(
      fullCanvas,
      0,
      y,
      fullCanvas.width,
      sliceH,
      0,
      0,
      fullCanvas.width,
      sliceH
    );
    pages.push(page);
  }
  return pages.length > 0 ? pages : [fullCanvas];
}

async function rasterizeCapturePage(
  el: HTMLElement,
  width: number,
  height: number,
  scale: number,
  background: string,
  domToCanvas: DomToCanvasFn,
  html2canvas: Html2CanvasFn,
  ios: boolean
): Promise<HTMLCanvasElement> {
  try {
    return await domToCanvas(el, {
      width,
      height,
      scale,
      backgroundColor: background,
      timeout: 30000,
      fetch: { requestInit: { mode: "cors", cache: "force-cache" } },
    });
  } catch (err) {
    console.warn(
      "[proposal-pdf] foreignObject capture failed, falling back to html2canvas",
      err
    );
    return html2canvas(el, {
      scale,
      backgroundColor: background,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      onclone: async (clonedDoc, clonedEl) => {
        prepareCaptureClone(clonedEl as HTMLElement);
        await waitForFontSet(clonedDoc.fonts, ios ? 4000 : 1500);
      },
    });
  }
}

export async function buildAtelierProposalPdf(options: {
  root: HTMLElement;
  customerName?: string;
  /** The preset owns this selector; never capture the route/document body. */
  pageSelector?: string;
  presetId?: string;
  /** Slice sections taller than one A4 sheet into multiple PDF pages (commercial). */
  paginateOverflow?: boolean;
  /** Run once before capture (e.g. commercial print snap / lazy reveal). */
  beforeCapture?: () => Promise<void>;
  onProgress?: (p: AtelierPdfProgress) => void;
}): Promise<AtelierPdfFile> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF download is supported only in browser.");
  }
  if (
    options.presetId &&
    options.root.dataset.proposalPreset &&
    options.root.dataset.proposalPreset !== options.presetId
  ) {
    throw new Error("The visible proposal does not match the selected export preset.");
  }

  const sections = Array.from(
    options.root.querySelectorAll<HTMLElement>(
      options.pageSelector ?? ":scope > section"
    )
  );
  if (sections.length === 0) {
    throw new Error("No proposal pages found to export.");
  }

  const [{ jsPDF }, { default: html2canvas }, { domToCanvas }] =
    (await Promise.all([
      import("jspdf"),
      import("html2canvas"),
      import("modern-screenshot"),
    ])) as [
      { jsPDF: JsPdfCtor },
      { default: Html2CanvasFn },
      { domToCanvas: DomToCanvasFn },
    ];

  const ios = isAppleTouchDevice();
  /*
   * Integer scale only. 1.5 made the 1123px sheet resolve to 1684.5 device
   * pixels, which WebKit rounded differently and could lose the final row.
   */
  const scale = 2;
  const jpegQuality = 0.92;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const host = createCaptureHost();

  try {
    await waitForFonts();
    await waitForImages(options.root);
    if (options.beforeCapture) {
      await options.beforeCapture();
    }
    await new Promise((r) => window.setTimeout(r, 100));

    let pdfPageIndex = 0;

    for (let i = 0; i < sections.length; i += 1) {
      options.onProgress?.({ current: i + 1, total: sections.length });

      host.replaceChildren();
      const clone = sections[i].cloneNode(true) as HTMLElement;
      prepareCaptureClone(clone);
      const rootShell = createRootShell(options.root);
      cloneRootStyleTags(options.root, rootShell);
      rootShell.appendChild(clone);
      host.appendChild(rootShell);
      syncCloneImages(clone);

      await waitForImages(clone);
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(undefined)))
      );
      await new Promise((r) => window.setTimeout(r, ios ? 120 : 40));

      const background = resolveSheetBackground(sections[i]);

      let canvases: HTMLCanvasElement[];
      if (options.paginateOverflow) {
        relaxPageBox(clone);
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r(undefined)))
        );
        const contentH = Math.max(
          A4_H_PX,
          Math.ceil(clone.getBoundingClientRect().height)
        );
        if (contentH <= A4_H_PX) {
          applyPageBox(clone, sections[i]);
          canvases = [
            await rasterizeCapturePage(
              clone,
              A4_W_PX,
              A4_H_PX,
              scale,
              background,
              domToCanvas,
              html2canvas,
              ios
            ),
          ];
        } else {
          clone.style.setProperty("height", `${contentH}px`, "important");
          const fullCanvas = await rasterizeCapturePage(
            clone,
            A4_W_PX,
            contentH,
            scale,
            background,
            domToCanvas,
            html2canvas,
            ios
          );
          canvases = sliceCanvasToA4Pages(fullCanvas, scale, background);
          fullCanvas.width = 0;
          fullCanvas.height = 0;
        }
      } else {
        applyPageBox(clone, sections[i]);
        canvases = [
          await rasterizeCapturePage(
            clone,
            A4_W_PX,
            A4_H_PX,
            scale,
            background,
            domToCanvas,
            html2canvas,
            ios
          ),
        ];
      }

      for (const canvas of canvases) {
        const image = canvas.toDataURL("image/jpeg", jpegQuality);
        if (pdfPageIndex > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight);
        pdfPageIndex += 1;
        canvas.width = 0;
        canvas.height = 0;
      }

      host.replaceChildren();
      /*
       * Give WebKit a beat to reclaim the canvas backing store before the
       * next page — iPad Safari has a much tighter canvas memory ceiling
       * than desktop, and back-to-back captures across a 13+ page document
       * were the most likely place for a later page to silently render
       * blank/garbled only on iPad.
       */
      if (ios) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        await new Promise((r) => window.setTimeout(r, 60));
      }
    }

    return {
      blob: pdf.output("blob"),
      fileName: `${safeFileName(options.customerName ?? "solar")}-${safeFileName(
        options.presetId ?? "atelier"
      )}-proposal.pdf`,
    };
  } finally {
    host.remove();
  }
}
