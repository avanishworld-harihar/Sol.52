/**
 * Atelier PDF export — per-page html2canvas capture.
 *
 * iPad / iOS: native window.print() mis-paginates (26 pages), drops photos, and
 * cannot match the on-screen A4 layout. Capture clones each live section at the
 * same 794×1123px geometry the web proposal uses — no alternate capture layout.
 */

type JsPdfCtor = typeof import("jspdf").jsPDF;
type Html2CanvasFn = typeof import("html2canvas")["default"];

import styles from "./atelier.module.css";

const A4_W_PX = 794;
const A4_H_PX = 1123;

export const ATELIER_PDF_CAPTURE_HOST_ID = "atelier-pdf-capture-host";

export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadDesktopUa =
    navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  return /iPad|iPhone|iPod/i.test(ua) || iPadDesktopUa;
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

async function waitForFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, 8000)),
  ]);
}

function applyPageBox(el: HTMLElement): void {
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
}

function syncCloneImages(clone: ParentNode): void {
  for (const img of Array.from(clone.querySelectorAll("img"))) {
    const src = img.currentSrc || img.src;
    if (!src) continue;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.crossOrigin = "anonymous";
    img.src = src;
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

export async function buildAtelierProposalPdf(options: {
  root: HTMLElement;
  customerName?: string;
  /** The preset owns this selector; never capture the route/document body. */
  pageSelector?: string;
  presetId?: string;
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
    throw new Error("No Atelier pages found to export.");
  }

  const [{ jsPDF }, { default: html2canvas }] = (await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ])) as [{ jsPDF: JsPdfCtor }, { default: Html2CanvasFn }];

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
    await new Promise((r) => window.setTimeout(r, 100));

    for (let i = 0; i < sections.length; i += 1) {
      options.onProgress?.({ current: i + 1, total: sections.length });

      host.replaceChildren();
      const clone = sections[i].cloneNode(true) as HTMLElement;
      applyPageBox(clone);
      const rootShell = createRootShell(options.root);
      rootShell.appendChild(clone);
      host.appendChild(rootShell);
      syncCloneImages(clone);

      await waitForImages(clone);
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(undefined)))
      );
      await new Promise((r) => window.setTimeout(r, ios ? 120 : 40));

      const isDarkSheet = /coverPage|closingPage/.test(clone.className);

      const canvas = await html2canvas(clone, {
        scale,
        backgroundColor: isDarkSheet ? "#0A0F1C" : "#ffffff",
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        width: A4_W_PX,
        height: A4_H_PX,
        windowWidth: A4_W_PX,
        windowHeight: A4_H_PX,
        scrollX: 0,
        scrollY: 0,
        onclone: (_doc, clonedEl) => {
          applyPageBox(clonedEl as HTMLElement);
        },
      });

      const image = canvas.toDataURL("image/jpeg", jpegQuality);
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight);

      canvas.width = 0;
      canvas.height = 0;
      host.replaceChildren();
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
