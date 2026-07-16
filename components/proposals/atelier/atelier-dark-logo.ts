/**
 * Detect whether a logo is mostly dark (needs a light plate on dark pages).
 * Opaque pixels only; CORS/canvas failures → false (no plate).
 */

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export async function isDarkLogoUrl(url: string): Promise<boolean> {
  const src = url?.trim();
  if (!src) return false;

  return new Promise((resolve) => {
    const img = new Image();
    // data:/blob: never need CORS; remote logos may — try anonymous so canvas can read.
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }

    const fail = () => resolve(false);

    img.onload = () => {
      try {
        const w = Math.max(1, Math.min(96, img.naturalWidth || img.width));
        const h = Math.max(1, Math.min(96, img.naturalHeight || img.height));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          fail();
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        let opaque = 0;
        let sumL = 0;
        let darkCount = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] ?? 0;
          if (a < 40) continue; // ignore near-transparent
          opaque += 1;
          const L = relativeLuminance(data[i]!, data[i + 1]!, data[i + 2]!);
          sumL += L;
          if (L < 0.38) darkCount += 1;
        }

        if (opaque < 8) {
          resolve(false);
          return;
        }

        const meanL = sumL / opaque;
        const darkFrac = darkCount / opaque;
        // Dark wordmarks / charcoal logos; bright icons alone should stay plate-free.
        resolve(meanL < 0.42 || darkFrac >= 0.52);
      } catch {
        fail();
      }
    };

    img.onerror = fail;
    img.src = src;
  });
}
