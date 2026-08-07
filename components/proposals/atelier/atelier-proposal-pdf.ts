/**
 * Atelier PDF export via per-page capture (html2canvas + jsPDF).
 *
 * iPad / iOS Safari notes:
 * - Never navigate to blob: URLs (window.open / location.assign) — causes
 *   "WebKitBlobResource error 1" and breaks refresh of the proposal tab.
 * - navigator.share({ files }) needs a fresh user gesture; after a long capture
 *   the original tap is expired, so the UI must show a Share button to tap again.
 */

type JsPdfCtor = typeof import("jspdf").jsPDF;
type Html2CanvasFn = typeof import("html2canvas")["default"];

const A4_W_PX = 794;
const A4_H_PX = 1123;

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
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          window.setTimeout(() => resolve(), 6000);
        })
    )
  );
}

function applyCaptureBox(el: HTMLElement): void {
  el.style.cssText = [
    `width:${A4_W_PX}px`,
    `max-width:${A4_W_PX}px`,
    `height:${A4_H_PX}px`,
    `min-height:${A4_H_PX}px`,
    `max-height:${A4_H_PX}px`,
    "margin:0",
    "box-shadow:none",
    "border-radius:0",
    "overflow:hidden",
    "position:relative",
    "box-sizing:border-box",
    "left:auto",
    "right:auto",
    "transform:none",
  ].join(";");
}

function createCaptureHost(wrapperClassName: string): HTMLDivElement {
  const host = document.createElement("div");
  host.id = "atelier-pdf-capture-host";
  // Reuse the real proposal wrapper so its CSS variables and desktop rules are
  // inherited by the page clone. Do not apply a second "PDF layout" variant.
  host.className = wrapperClassName;
  host.setAttribute("aria-hidden", "true");
  // Keep in viewport (opacity only) — far off-screen clones often rasterize blank on iOS.
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_W_PX}px`,
    `height:${A4_H_PX}px`,
    "overflow:hidden",
    "opacity:0.01",
    "pointer-events:none",
    "z-index:2147483646",
    "background:#fff",
  ].join(";");
  document.body.appendChild(host);
  return host;
}

export type AtelierPdfProgress = {
  current: number;
  total: number;
};

export type AtelierPdfFile = {
  blob: Blob;
  fileName: string;
};

/** Desktop: trigger a file download. Never used for iOS navigation. */
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

/**
 * iOS-safe share. Call from a direct button tap (fresh user gesture).
 * Returns true if the share sheet was shown / completed.
 */
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

  const shareData: ShareData = {
    files: [pdfFile],
    title: file.fileName,
  };
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
 * Build a portrait A4 PDF from Atelier page sections (does not navigate the browser).
 */
export async function buildAtelierProposalPdf(options: {
  root: HTMLElement;
  customerName?: string;
  onProgress?: (p: AtelierPdfProgress) => void;
}): Promise<AtelierPdfFile> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF download is supported only in browser.");
  }

  const sections = Array.from(
    options.root.querySelectorAll<HTMLElement>(":scope > section")
  );
  if (sections.length === 0) {
    throw new Error("No Atelier pages found to export.");
  }

  const [{ jsPDF }, { default: html2canvas }] = (await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ])) as [{ jsPDF: JsPdfCtor }, { default: Html2CanvasFn }];

  const ios = isAppleTouchDevice();
  // Keep iOS memory lower — large blobs + open(blob) is what triggers WebKitBlobResource.
  const scale = ios ? 1.25 : 2;
  const jpegQuality = ios ? 0.78 : 0.92;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const host = createCaptureHost(options.root.className);

  try {
    await waitForImages(options.root);
    await new Promise((r) => window.setTimeout(r, 80));

    for (let i = 0; i < sections.length; i += 1) {
      options.onProgress?.({ current: i + 1, total: sections.length });

      host.replaceChildren();
      const clone = sections[i].cloneNode(true) as HTMLElement;
      applyCaptureBox(clone);
      host.appendChild(clone);

      for (const img of Array.from(clone.querySelectorAll("img"))) {
        const src = img.currentSrc || img.src;
        if (src) {
          img.removeAttribute("srcset");
          img.src = src;
        }
      }

      await waitForImages(clone);
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(undefined)))
      );
      await new Promise((r) => window.setTimeout(r, ios ? 90 : 30));

      const canvas = await html2canvas(clone, {
        scale,
        backgroundColor:
          clone.className.includes("cover") || clone.className.includes("closing")
            ? "#0A0F1C"
            : "#ffffff",
        useCORS: true,
        allowTaint: false,
        imageTimeout: 12000,
        logging: false,
        width: A4_W_PX,
        height: A4_H_PX,
        windowWidth: A4_W_PX,
        windowHeight: A4_H_PX,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });

      const out = document.createElement("canvas");
      out.width = Math.round(A4_W_PX * scale);
      out.height = Math.round(A4_H_PX * scale);
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("PDF canvas unavailable.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0, out.width, out.height);

      const image = out.toDataURL("image/jpeg", jpegQuality);
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

      canvas.width = 0;
      canvas.height = 0;
      out.width = 0;
      out.height = 0;
      host.replaceChildren();
    }

    return {
      blob: pdf.output("blob"),
      fileName: `${safeFileName(options.customerName ?? "atelier")}-atelier-proposal.pdf`,
    };
  } finally {
    host.remove();
  }
}

/** @deprecated use buildAtelierProposalPdf + share/download helpers */
export async function downloadAtelierProposalPdf(options: {
  root: HTMLElement;
  customerName?: string;
  onProgress?: (p: AtelierPdfProgress) => void;
}): Promise<AtelierPdfFile> {
  const file = await buildAtelierProposalPdf(options);
  if (!isAppleTouchDevice()) {
    downloadPdfFile(file);
  }
  return file;
}
