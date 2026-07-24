"use client";

import { useSyncExternalStore } from "react";

/**
 * Phone = Design Studio view-only (inspect + shadow time checks).
 * iPad / desktop keep full edit. Landscape phones still view-only via UA.
 */
function computeMobileViewOnly(): boolean {
  if (typeof window === "undefined") return false;

  // iPadOS often reports as Macintosh + touch — keep editable.
  const isIpad =
    /iPad/i.test(navigator.userAgent) ||
    ( /Macintosh/i.test(navigator.userAgent) && (navigator.maxTouchPoints ?? 0) > 1 );
  if (isIpad) return false;

  const phoneUa =
    /iPhone|iPod|Windows Phone|webOS|BlackBerry|Android.*Mobile/i.test(
      navigator.userAgent
    );
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  return phoneUa || narrow;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia("(max-width: 767px)");
  const onChange = () => onStoreChange();
  mq.addEventListener?.("change", onChange);
  window.addEventListener("resize", onChange, { passive: true });
  return () => {
    mq.removeEventListener?.("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

export function useDesignStudioMobileViewOnly(): boolean {
  return useSyncExternalStore(subscribe, computeMobileViewOnly, () => false);
}
