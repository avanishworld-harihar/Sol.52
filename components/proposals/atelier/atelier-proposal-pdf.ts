/**
 * Atelier PDF export via per-page capture (html2canvas + jsPDF).
 *
 * Why not window.print() on iPad:
 * iOS Safari's print engine breaks fixed A4 sheet layouts (shrink, blank pages).
 *
 * Strategy:
 * - Temporarily mark <html> with atelier-pdf-capture (desktop A4 geometry CSS)
 * - Capture each live <section> page to JPEG
 * - Build portrait A4 PDF
 * - On iOS: navigator.share({ files }) when available, else open blob URL
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

function forceA4Box(el: HTMLElement): void {
  el.style.setProperty("width", `${A4_W_PX}px`, "important");
  el.style.setProperty("max-width", `${A4_W_PX}px`, "important");
  el.style.setProperty("height", `${A4_H_PX}px`, "important");
  el.style.setProperty("min-height", `${A4_H_PX}px`, "important");
  el.style.setProperty("max-height", `${A4_H_PX}px`, "important");
  el.style.setProperty("margin", "0", "important");
  el.style.setProperty("box-shadow", "none", "important");
  el.style.setProperty("border-radius", "0", "important");
  el.style.setProperty("overflow", "hidden", "important");
  el.style.setProperty("position", "relative", "important");
  el.style.setProperty("box-sizing", "border-box", "important");
  el.style.setProperty("left", "auto", "important");
  el.style.setProperty("right", "auto", "important");
  el.style.setProperty("transform", "none", "important");
}

async function deliverPdfBlob(blob: Blob, fileName: string): Promise<void> {
  const ios = isAppleTouchDevice();
  const file = new File([blob], fileName, { type: "application/pdf" });

  // Best iPad path: native share sheet → Save to Files / Print
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
      // User cancel should not fall through as failure noise
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);

  if (ios) {
    const opened = window.open(url, "_blank");
    if (!opened) {
      // Same-tab fallback — user can share from Safari PDF viewer
      window.location.assign(url);
    }
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
  const scale = ios ? 1.35 : 2;
  const jpegQuality = ios ? 0.8 : 0.9;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const prevHtmlClass = document.documentElement.className;
  const prevBodyOverflow = document.body.style.overflow;
  const styleSnapshots = sections.map((s) => s.getAttribute("style"));

  document.documentElement.classList.add(CAPTURE_CLASS);
  document.body.style.overflow = "hidden";
  options.root.setAttribute("data-atelier-capturing", "1");

  try {
    await waitForImages(options.root);
    window.scrollTo(0, 0);
    await new Promise((r) => window.setTimeout(r, 120));

    for (let i = 0; i < sections.length; i += 1) {
      options.onProgress?.({ current: i + 1, total: sections.length });
      const section = sections[i];

      forceA4Box(section);
      section.scrollIntoView({ block: "start", inline: "nearest" });
      await waitForImages(section);
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(undefined)))
      );
      // Extra settle time for iOS layout / web fonts
      await new Promise((r) => window.setTimeout(r, ios ? 80 : 30));

      const canvas = await html2canvas(section, {
        scale,
        width: A4_W_PX,
        height: A4_H_PX,
        windowWidth: Math.max(window.innerWidth, A4_W_PX),
        windowHeight: Math.max(window.innerHeight, A4_H_PX),
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        imageTimeout: 10000,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc, clonedEl) => {
          clonedDoc.documentElement.classList.add(CAPTURE_CLASS);
          forceA4Box(clonedEl as HTMLElement);
          const bar = clonedDoc.querySelector("[data-atelier-print-bar]");
          if (bar instanceof HTMLElement) bar.style.display = "none";
        },
      });

      const image = canvas.toDataURL("image/jpeg", jpegQuality);
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

      canvas.width = 0;
      canvas.height = 0;

      // Restore this section's inline style before next page
      const snap = styleSnapshots[i];
      if (snap == null) section.removeAttribute("style");
      else section.setAttribute("style", snap);
    }

    const fileName = `${safeFileName(options.customerName ?? "atelier")}-atelier-proposal.pdf`;
    await deliverPdfBlob(pdf.output("blob"), fileName);
  } finally {
    document.documentElement.className = prevHtmlClass;
    document.body.style.overflow = prevBodyOverflow;
    options.root.removeAttribute("data-atelier-capturing");
    sections.forEach((section, i) => {
      const snap = styleSnapshots[i];
      if (snap == null) section.removeAttribute("style");
      else section.setAttribute("style", snap);
    });
    window.scrollTo(0, 0);
  }
}
