"use client";

/**
 * ProposalPageFit — one A4 layout for every preset, on every device.
 *
 * Wraps whatever `ProposalRenderer` resolves, so presets added later inherit
 * this without changing their own CSS. See `proposal-page-fit.css` for why the
 * sheet is scaled instead of reflowed.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import "./proposal-page-fit.css";

/** A4 width in CSS px (210mm at 96dpi) plus the gutter presets draw around a sheet. */
export const PROPOSAL_SHEET_WIDTH_PX = 794;
export const PROPOSAL_SHEET_GUTTER_PX = 36;
const REQUIRED_WIDTH_PX = PROPOSAL_SHEET_WIDTH_PX + PROPOSAL_SHEET_GUTTER_PX;

/** Presets stack into their own readable phone layout at or below this width. */
export const PROPOSAL_PHONE_BREAKPOINT_PX = 640;

/** Below this the sheet is too small to read, so the phone layout is better. */
const MIN_SCALE = 0.72;

function resolveScale(viewportWidth: number): number {
  if (viewportWidth <= PROPOSAL_PHONE_BREAKPOINT_PX) return 1;
  if (viewportWidth >= REQUIRED_WIDTH_PX) return 1;
  const scale = viewportWidth / REQUIRED_WIDTH_PX;
  return scale < MIN_SCALE ? MIN_SCALE : Math.round(scale * 1000) / 1000;
}

export function ProposalPageFit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const sync = () => {
      const width = window.innerWidth || document.documentElement.clientWidth;
      if (!width) return;
      setScale(resolveScale(width));
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-proposal-fit={scale < 1 ? "on" : "off"}
      style={{ "--proposal-page-scale": scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export default ProposalPageFit;
