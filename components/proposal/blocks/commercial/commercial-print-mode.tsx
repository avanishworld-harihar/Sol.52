"use client";

/**
 * Commercial proposal print preparation — snap motion/visibility before window.print().
 */

const SNAP_CLASS = "commercial-print-snap";

type SnapListener = (active: boolean) => void;
const snapListeners = new Set<SnapListener>();

function notifySnap(active: boolean): void {
  for (const fn of snapListeners) fn(active);
}

export function subscribeCommercialPrintSnap(listener: SnapListener): () => void {
  snapListeners.add(listener);
  return () => snapListeners.delete(listener);
}

/** Scroll full document so intersection-gated content can render, then open print dialog. */
export async function prepareCommercialPrint(): Promise<void> {
  if (typeof window === "undefined") return;

  document.documentElement.classList.add(SNAP_CLASS);
  notifySnap(true);

  const step = Math.max(400, window.innerHeight * 0.85);
  const max = document.documentElement.scrollHeight;
  for (let y = 0; y <= max; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => window.setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => window.setTimeout(r, 150));
}

export function clearCommercialPrintSnap(): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove(SNAP_CLASS);
  }
  notifySnap(false);
}

export function installCommercialPrintListeners(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onBefore = () => {
    document.documentElement.classList.add(SNAP_CLASS);
    notifySnap(true);
  };
  const onAfter = () => clearCommercialPrintSnap();

  window.addEventListener("beforeprint", onBefore);
  window.addEventListener("afterprint", onAfter);

  const mq = window.matchMedia("print");
  const onMq = () => {
    if (mq.matches) onBefore();
    else onAfter();
  };
  mq.addEventListener("change", onMq);
  if (mq.matches) onBefore();

  return () => {
    window.removeEventListener("beforeprint", onBefore);
    window.removeEventListener("afterprint", onAfter);
    mq.removeEventListener("change", onMq);
    clearCommercialPrintSnap();
  };
}
