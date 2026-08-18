/**
 * Atelier PDF export — per-page raster capture.
 *
 * iPad / iOS: native window.print() mis-paginates (26 pages), drops photos, and
 * cannot match the on-screen A4 layout. Capture clones each live section at the
 * same 794×1123px geometry the web proposal uses — no alternate capture layout.
 *
 * Rasterizer: modern-screenshot (SVG <foreignObject>) only — the browser itself
 * paints the markup, so the bitmap matches the live proposal exactly. There is
 * no html2canvas fallback: it re-implements CSS layout and text metrics and
 * does not understand grid or multi-stop gradients, so a "successful" fallback
 * capture looked more broken than a failed modern-screenshot one. See
 * `captureElementToCanvas` for how a capture is made to actually succeed on
 * WebKit instead.
 */

type JsPdfCtor = typeof import("jspdf").jsPDF;
type CreateContextFn = typeof import("modern-screenshot")["createContext"];
type DomToForeignObjectSvgFn = typeof import("modern-screenshot")["domToForeignObjectSvg"];
type DestroyContextFn = typeof import("modern-screenshot")["destroyContext"];

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
   * capture, which is the only path that reproduces the A4 layout on iPadOS
   * (native print mis-paginates and splits single pages).
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
 * The capture clones that style tag into a fresh subtree, which means the
 * fonts must be re-fetched there too. On desktop this usually resolves from
 * cache in a few ms; on iPad Safari, cross-origin font requests made from
 * that freshly created capture context are far more likely to hit a
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
   * Atelier's Google Fonts @import + print @page rules), so they are carried
   * over onto our own clone explicitly instead.
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
     * Keep the capture tree fully opaque. Because the capture host is a real
     * DOM subtree, ancestor opacity genuinely renders into the bitmap — an
     * opacity:0.01 host washed out colours and made chart bars effectively
     * disappear on iPad.
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

/**
 * Hands the built PDF to the user.
 *
 * On iOS/iPadOS this deliberately does *not* attempt `navigator.share()`
 * itself. `share()` requires "transient activation" from a user gesture that
 * is at most a few seconds old, and a 9-14 sheet proposal takes 15-30s to
 * rasterize — by the time a PDF built from the original button tap is ready,
 * that gesture is long expired and `share()` rejects with `NotAllowedError`
 * every time. There is no way to "wait longer" or retry around this; the
 * only fix is a fresh gesture. So this presents an overlay with its own
 * Save/Share button, and `navigator.share()` is called only from *that*
 * button's own click handler (see `presentPdfSaveOverlay`), several
 * preset renderers (Atelier, Luxe Noir, HT-Commercial, Commercial) already
 * do the equivalent with their own React-rendered overlay bound to a
 * `pdfReady` state — this is the same pattern for callers that hand a file
 * straight to `downloadPdfFile` instead of managing that state themselves.
 *
 * Desktop/Android downloads are synchronous, but this is `async` (and every
 * caller should `await` it) so the caller's own busy state does not clear
 * before the hand-off — either the trigger of a real download, or the
 * overlay being attached to the document — has actually happened.
 */
export async function downloadPdfFile(file: AtelierPdfFile): Promise<void> {
  if (typeof window === "undefined") return;
  if (isAppleTouchDevice()) {
    presentPdfSaveOverlay(file);
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

/** Cleans up whichever save overlay is currently on screen, if any. */
let activePdfOverlayCleanup: (() => void) | null = null;

/**
 * A minimal "PDF ready" card with a Save/Share button — deliberately not a
 * PDF previewer. iOS Safari's `<iframe>` cannot reliably display a
 * multi-page PDF blob (it ignores `#view=FitH` and only ever paints the
 * first page), so a preview here would misrepresent a correctly-built
 * multi-page document as broken. The only job of this overlay is to give
 * the Save/Share button a fresh, real click to trigger `navigator.share()`
 * from.
 */
function presentPdfSaveOverlay(file: AtelierPdfFile): void {
  activePdfOverlayCleanup?.();
  document.querySelector("[data-proposal-pdf-overlay='true']")?.remove();

  const url = URL.createObjectURL(file.blob);
  const wrap = document.createElement("div");
  wrap.setAttribute("data-proposal-pdf-overlay", "true");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-label", file.fileName);
  wrap.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,0.72);display:flex;align-items:center;justify-content:center;padding:20px;padding-top:max(20px,env(safe-area-inset-top));padding-bottom:max(20px,env(safe-area-inset-bottom));";

  const card = document.createElement("div");
  card.style.cssText =
    "width:100%;max-width:340px;background:#fff;border-radius:16px;padding:24px 20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);font-family:system-ui,sans-serif;";

  const title = document.createElement("p");
  title.textContent = "Your PDF is ready";
  title.style.cssText = "margin:0;font:700 17px/1.3 system-ui,sans-serif;color:#0f172a;";

  const nameEl = document.createElement("p");
  nameEl.textContent = file.fileName;
  nameEl.style.cssText = "margin:0;font:400 12px/1.4 system-ui,sans-serif;color:#64748b;word-break:break-all;";

  const statusEl = document.createElement("p");
  statusEl.setAttribute("role", "status");
  statusEl.style.cssText =
    "margin:0;display:none;font:500 12px/1.4 system-ui,sans-serif;color:#b91c1c;";

  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  const shareBtnDefaultLabel = "Save / Share PDF";
  shareBtn.textContent = shareBtnDefaultLabel;
  shareBtn.style.cssText =
    "min-height:48px;border:0;border-radius:10px;background:#0f172a;color:#fff;font:600 15px/1.2 system-ui,sans-serif;";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Close";
  closeBtn.style.cssText =
    "min-height:44px;border:0;background:transparent;color:#64748b;font:600 14px/1.2 system-ui,sans-serif;";

  const cleanup = () => {
    wrap.remove();
    URL.revokeObjectURL(url);
    window.removeEventListener("pagehide", cleanup);
    if (activePdfOverlayCleanup === cleanup) activePdfOverlayCleanup = null;
  };

  shareBtn.addEventListener("click", () => {
    void (async () => {
      shareBtn.disabled = true;
      shareBtn.textContent = "Opening share sheet…";
      statusEl.style.display = "none";
      try {
        const shared = await sharePdfFile(file);
        if (shared) {
          cleanup();
          return;
        }
        /* User dismissed the native share sheet — leave the card open. */
      } catch (err) {
        console.error("[proposal-pdf] share failed", err);
        statusEl.textContent =
          err instanceof Error && err.name === "NotAllowedError"
            ? "That tap didn't reach Safari's share sheet in time — please try again."
            : "Couldn't open the share sheet. Please try again.";
        statusEl.style.display = "block";
      } finally {
        shareBtn.disabled = false;
        shareBtn.textContent = shareBtnDefaultLabel;
      }
    })();
  });
  closeBtn.addEventListener("click", cleanup);
  /*
   * `pagehide` (not `beforeunload`/`unload`) is the reliable, bfcache-safe
   * signal on iOS Safari for "the user is navigating away" — covers both
   * the blob URL leak and a stray overlay surviving a back/forward move.
   */
  window.addEventListener("pagehide", cleanup, { once: true });
  activePdfOverlayCleanup = cleanup;

  card.append(title, nameEl, shareBtn, statusEl, closeBtn);
  wrap.appendChild(card);
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

/**
 * Sample a small downscaled copy of the canvas and hash it. Cheap enough to
 * call every frame; used only to tell whether the last two draws produced
 * the same pixels, not to inspect the image itself.
 */
function sampleCanvasHash(
  source: CanvasImageSource,
  sample: HTMLCanvasElement,
  sampleCtx: CanvasRenderingContext2D
): string {
  sampleCtx.clearRect(0, 0, sample.width, sample.height);
  sampleCtx.drawImage(source, 0, 0, sample.width, sample.height);
  const { data } = sampleCtx.getImageData(0, 0, sample.width, sample.height);
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash * 31 + data[i]) | 0;
  }
  return String(hash);
}

/**
 * Keep redrawing `img` into `canvas` until two consecutive frames produce
 * identical pixels, instead of guessing a fixed retry count.
 *
 * WebKit can fire `load` and resolve `decode()` for an <img src="data:image/
 * svg+xml..."> containing a <foreignObject> before it has actually finished
 * painting that foreignObject's nested HTML — grid tracks, multi-stop
 * gradients and custom fonts settle a frame or more later. A single
 * `drawImage` right after decode() rasterizes whatever WebKit had ready at
 * that instant, which is why plain drawing sheets (no photos to stall on)
 * came back with flat navy where a gradient should be, or content shifted
 * as if a grid track hadn't resolved yet — while photo-heavy sheets, which
 * modern-screenshot happens to redraw a few times while waiting on image
 * decodes, painted correctly by coincidence.
 */
async function drawUntilPaintSettles(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  ctx2d: CanvasRenderingContext2D,
  background: string,
  ios: boolean
): Promise<void> {
  const sample = canvas.ownerDocument.createElement("canvas");
  sample.width = 48;
  sample.height = 48;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });

  const maxAttempts = ios ? 8 : 2;
  let previousHash: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    /*
     * A real frame boundary — not a microtask — is what gives WebKit's async
     * paint pipeline room to actually finish between attempts.
     */
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );
    if (background) {
      ctx2d.fillStyle = background;
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (!sampleCtx) return;
    const hash = sampleCanvasHash(canvas, sample, sampleCtx);
    if (previousHash !== null && hash === previousHash) return;
    previousHash = hash;
    if (ios) await new Promise((r) => window.setTimeout(r, 70));
  }
}

/**
 * Renders `el` to a canvas via modern-screenshot's dom → SVG foreignObject →
 * image pipeline, reimplemented here (rather than calling its `domToCanvas`
 * directly) for one reason: the intermediate `<img>` must be attached to the
 * live document, off-screen, before it is drawn. An unattached `new Image()`
 * — which is what `domToCanvas` uses internally — never receives a full
 * layout/paint pass on WebKit, so its foreignObject content can rasterize
 * incompletely no matter how long you wait on `decode()`. Once attached,
 * `drawUntilPaintSettles` keeps redrawing until the paint has visibly
 * stabilized.
 *
 * There is no fallback rasterizer. If this cannot produce a stable paint it
 * throws, so a broken sheet fails the export loudly instead of silently
 * shipping a half-painted page.
 */
async function captureElementToCanvas(
  el: HTMLElement,
  width: number,
  height: number,
  scale: number,
  background: string,
  ios: boolean,
  createContext: CreateContextFn,
  domToForeignObjectSvg: DomToForeignObjectSvgFn,
  destroyContext: DestroyContextFn
): Promise<HTMLCanvasElement> {
  const context = await createContext(el, {
    width,
    height,
    scale,
    backgroundColor: background,
    timeout: 30000,
    fetch: { requestInit: { mode: "cors", cache: "force-cache" } },
  });

  let svgImage: HTMLImageElement | null = null;
  try {
    const svg = await domToForeignObjectSvg(context);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      new XMLSerializer().serializeToString(svg)
    )}`;

    const ownerDocument = el.ownerDocument;
    svgImage = ownerDocument.createElement("img");
    svgImage.decoding = "sync";
    svgImage.width = Math.floor(width * scale);
    svgImage.height = Math.floor(height * scale);
    /*
     * Off-screen but attached, and at full size — see the function doc above
     * for why an unattached Image() paints incompletely on WebKit. Sizing the
     * CSS box down to save space (e.g. 1x1px) backfires here: WebKit
     * rasterizes an SVG <img> at its *displayed* box size, not its intrinsic
     * one, so a 1x1 box discards all detail before drawImage ever runs,
     * leaving a smeared, single-colour canvas — worse than the original bug.
     */
    svgImage.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:${height}px;pointer-events:none;`;
    ownerDocument.body.appendChild(svgImage);

    await new Promise<void>((resolve, reject) => {
      svgImage!.addEventListener("load", () => resolve(), { once: true });
      svgImage!.addEventListener(
        "error",
        () => reject(new Error("Failed to load the captured sheet image")),
        { once: true }
      );
      svgImage!.src = svgDataUrl;
    });
    await svgImage.decode().catch(() => {
      /* decode() can reject even after a real load event on some WebKit
         builds — drawUntilPaintSettles is the actual completion guard. */
    });

    const canvas = ownerDocument.createElement("canvas");
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) throw new Error("2D canvas context is unavailable");

    await drawUntilPaintSettles(svgImage, canvas, ctx2d, background, ios);
    return canvas;
  } finally {
    svgImage?.remove();
    destroyContext(context);
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

  const [{ jsPDF }, { createContext, domToForeignObjectSvg, destroyContext }] =
    (await Promise.all([
      import("jspdf"),
      import("modern-screenshot"),
    ])) as [
      { jsPDF: JsPdfCtor },
      {
        createContext: CreateContextFn;
        domToForeignObjectSvg: DomToForeignObjectSvgFn;
        destroyContext: DestroyContextFn;
      },
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
            await captureElementToCanvas(
              clone,
              A4_W_PX,
              A4_H_PX,
              scale,
              background,
              ios,
              createContext,
              domToForeignObjectSvg,
              destroyContext
            ),
          ];
        } else {
          clone.style.setProperty("height", `${contentH}px`, "important");
          const fullCanvas = await captureElementToCanvas(
            clone,
            A4_W_PX,
            contentH,
            scale,
            background,
            ios,
            createContext,
            domToForeignObjectSvg,
            destroyContext
          );
          canvases = sliceCanvasToA4Pages(fullCanvas, scale, background);
          fullCanvas.width = 0;
          fullCanvas.height = 0;
        }
      } else {
        applyPageBox(clone, sections[i]);
        canvases = [
          await captureElementToCanvas(
            clone,
            A4_W_PX,
            A4_H_PX,
            scale,
            background,
            ios,
            createContext,
            domToForeignObjectSvg,
            destroyContext
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
