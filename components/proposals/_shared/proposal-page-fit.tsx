"use client";

/**
 * ProposalPageFit — one A4 layout for every preset, on every device.
 *
 * Wraps whatever `ProposalRenderer` resolves, so presets added later inherit
 * this without changing their own CSS. See `proposal-page-fit.css` for why the
 * sheet is scaled instead of reflowed.
 *
 * Measuring is deliberately split into two phases. A zoomed element reports
 * post-zoom geometry, so measuring while zoomed reads back "the sheet is fine
 * now" and cancels the very correction that made it fine. The base measurement
 * therefore always runs unzoomed, and later passes may only tighten the scale.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./proposal-page-fit.css";

/** A4 width in CSS px (210mm at 96dpi). */
export const PROPOSAL_SHEET_WIDTH_PX = 794;

/** Presets stack into their own readable phone layout at or below this width. */
export const PROPOSAL_PHONE_BREAKPOINT_PX = 640;

/**
 * A sheet only counts as a fixed A4 page when it is about as tall as one
 * (297mm ≈ 1123px). Presets that deliberately flow (Zenith) are left alone.
 */
const MIN_SHEET_HEIGHT_PX = 900;

/** Below this the sheet is unreadable; the preset's own phone layout is better. */
const MIN_SCALE = 0.7;

/** Gutter fallback when no sheet can be measured yet. */
const FALLBACK_GUTTER_PX = 96;

/** Treat the sheet as full width within this tolerance. */
const WIDTH_TOLERANCE_PX = 2;

const MAX_REFINEMENTS = 2;

function clampScale(value: number): number {
  if (!Number.isFinite(value) || value >= 1) return 1;
  return Math.max(MIN_SCALE, Math.floor(value * 1000) / 1000);
}

/**
 * The widest page-like child. Presets render one `<section>` per sheet; taking
 * the widest of the first few avoids picking a nested or decorative section.
 */
function findSheet(root: HTMLElement): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestWidth = 0;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("section")).slice(0, 6)) {
    const width = el.getBoundingClientRect().width;
    if (width > bestWidth) {
      bestWidth = width;
      best = el;
    }
  }
  return best;
}

type FitState = {
  scale: number;
  /** True while rendering unzoomed so the next measurement is in CSS px. */
  measuring: boolean;
};

export function ProposalPageFit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<FitState>({ scale: 1, measuring: true });
  const refinementsRef = useRef(0);

  const remeasure = useCallback(() => {
    refinementsRef.current = 0;
    setState({ scale: 1, measuring: true });
  }, []);

  /** Base pass: runs unzoomed, so every rect is already in CSS px. */
  const measureBase = useCallback((): number => {
    const root = ref.current;
    if (!root) return 1;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    if (!viewportWidth || viewportWidth <= PROPOSAL_PHONE_BREAKPOINT_PX) return 1;

    const available = root.getBoundingClientRect().width || viewportWidth;
    const sheet = findSheet(root);
    if (!sheet) {
      /* Preset has not painted yet — assume a typical gutter, refine later. */
      return clampScale(available / (PROPOSAL_SHEET_WIDTH_PX + FALLBACK_GUTTER_PX));
    }

    const rect = sheet.getBoundingClientRect();
    if (rect.height < MIN_SHEET_HEIGHT_PX) return 1;
    if (rect.width >= PROPOSAL_SHEET_WIDTH_PX - WIDTH_TOLERANCE_PX) return 1;

    /* Whatever the preset spends on stage padding, margins and scrollbars. */
    const gutter = Math.max(0, available - rect.width);
    return clampScale(available / (PROPOSAL_SHEET_WIDTH_PX + gutter));
  }, []);

  /**
   * Refinement pass: the scale is applied, so rects are post-zoom. Only ever
   * tightens, which is what keeps this from oscillating with `measureBase`.
   */
  const refine = useCallback((current: number): number => {
    const root = ref.current;
    if (!root || current >= 1) return current;
    const sheet = findSheet(root);
    if (!sheet) return current;
    const rect = sheet.getBoundingClientRect();
    const cssWidth = rect.width / current;
    if (cssWidth >= PROPOSAL_SHEET_WIDTH_PX - WIDTH_TOLERANCE_PX) return current;
    return clampScale(current * (cssWidth / PROPOSAL_SHEET_WIDTH_PX));
  }, []);

  useEffect(() => {
    if (!state.measuring) return;
    const raf = requestAnimationFrame(() => {
      setState({ scale: measureBase(), measuring: false });
    });
    return () => cancelAnimationFrame(raf);
  }, [state.measuring, measureBase]);

  useEffect(() => {
    if (state.measuring || state.scale >= 1) return;
    if (refinementsRef.current >= MAX_REFINEMENTS) return;
    const raf = requestAnimationFrame(() => {
      const next = refine(state.scale);
      if (next < state.scale - 0.001) {
        refinementsRef.current += 1;
        setState({ scale: next, measuring: false });
      } else {
        refinementsRef.current = MAX_REFINEMENTS;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [state, refine]);

  useEffect(() => {
    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);
    /* Fonts and photos settle after first paint and can change the gutter. */
    const settle = window.setTimeout(remeasure, 500);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("orientationchange", remeasure);
      window.clearTimeout(settle);
    };
  }, [remeasure]);

  return (
    <div
      ref={ref}
      data-proposal-fit={state.scale < 1 ? "on" : "off"}
      style={{ "--proposal-page-scale": state.scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export default ProposalPageFit;
