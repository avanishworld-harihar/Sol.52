/**
 * Atelier PDF export via per-page capture (html2canvas + jsPDF).
 *
 * Captures offscreen A4 clones under html.atelier-pdf-capture so iPad mobile
 * layout rules do not leak into the PDF (cover image gaps, cut footers, etc.).
 */

type JsPdfCtor = typeof import("jspdf").jsPDF;
type Html2CanvasFn = typeof import("html2canvas")["default"];

const A4_W_PX = 794;
const A4_H_PX = 1123;
const CAPTURE_CLASS = "atelier-pdf-capture";

function isAppleTouchDevice(): boolean {
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

function createCaptureHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.id = "atelier-pdf-capture-host";
  host.setAttribute("aria-hidden", "true");
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

async function deliverPdfBlob(blob: Blob, fileName: string): Promise<void> {
  const ios = isAppleTouchDevice();
  const file = new File([blob], fileName, { type: "application/pdf" });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };
  if (ios && typeof nav.share === "function") {
    try {
      const shareData: ShareData = { files: [file], title: fileName };
      if (!nav.canShare || nav.canShare(shareData)) {
        await nav.share(shareData);
        return;
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  if (ios) {
    const opened = window.open(url, "_blank");
    if (!opened) window.location.assign(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 180_000);
    return;
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export type AtelierPdfProgress = {
  current: number;
  total: number;
};

/**
 * Capture each Atelier A4 section under `[data-atelier-root]` into a portrait PDF.
 */
export async function downloadAtelierProposalPdf(options: {
  root: HTMLElement;
  customerName?: string;
  onProgress?: (p: AtelierPdfProgress) => void;
}): Promise<void> {
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
  // Higher scale = sharper type; keep iOS memory-safe.
  const scale = ios ? 1.75 : 2;
  const jpegQuality = ios ? 0.86 : 0.92;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const prevHtmlClass = document.documentElement.className;
  const host = createCaptureHost();
  document.documentElement.classList.add(CAPTURE_CLASS);

  try {
    await waitForImages(options.root);
    await new Promise((r) => window.setTimeout(r, 100));

    for (let i = 0; i < sections.length; i += 1) {
      options.onProgress?.({ current: i + 1, total: sections.length });

      host.replaceChildren();
      const clone = sections[i].cloneNode(true) as HTMLElement;
      applyCaptureBox(clone);
      host.appendChild(clone);

      // Re-point images that failed after clone (same src reload)
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
      await new Promise((r) => window.setTimeout(r, ios ? 120 : 40));

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
        // Capture the exact A4 box — avoid viewport crop on iPad
        width: A4_W_PX,
        height: A4_H_PX,
        windowWidth: A4_W_PX,
        windowHeight: A4_H_PX,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc, clonedEl) => {
          clonedDoc.documentElement.classList.add(CAPTURE_CLASS);
          applyCaptureBox(clonedEl as HTMLElement);
          const bar = clonedDoc.querySelector("[data-atelier-print-bar]");
          if (bar instanceof HTMLElement) bar.style.display = "none";

          // Force cover/closing photos to fill their frames (screen CSS sets img height:auto)
          for (const img of Array.from(
            clonedDoc.querySelectorAll<HTMLImageElement>(
              "img[class*='coverPhoto'], img[class*='closingPhoto'], img[class*='trustPhoto']"
            )
          )) {
            img.style.setProperty("width", "100%", "important");
            img.style.setProperty("height", "100%", "important");
            img.style.setProperty("object-fit", "cover", "important");
            img.style.setProperty("max-height", "none", "important");
            img.style.setProperty("position", "absolute", "important");
            img.style.setProperty("inset", "0", "important");
          }
          for (const frame of Array.from(
            clonedDoc.querySelectorAll<HTMLElement>(
              "[class*='coverPhotoFrame'], [class*='closingPhotoFrame'], [class*='trustPhotoFrame']"
            )
          )) {
            frame.style.setProperty("position", "relative", "important");
            frame.style.setProperty("overflow", "hidden", "important");
          }
        },
      });

      // Normalize to exact A4 pixel canvas (guards against sub-pixel crop)
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

    const fileName = `${safeFileName(options.customerName ?? "atelier")}-atelier-proposal.pdf`;
    await deliverPdfBlob(pdf.output("blob"), fileName);
  } finally {
    document.documentElement.className = prevHtmlClass;
    host.remove();
  }
}
