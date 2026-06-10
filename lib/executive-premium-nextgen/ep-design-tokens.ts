/**
 * Executive Premium NextGen — isolated design tokens (Design Bible Phase A).
 * Not shared with Sales Premium PP_* tokens.
 */

export const EP_INK = "#141414";
export const EP_MUTED = "#6b6b6b";
export const EP_BORDER = "rgba(20, 20, 20, 0.12)";
export const EP_SURFACE = "#ffffff";
export const EP_CANVAS = "#f7f7f5";

/** 8px base unit — all spacing is a multiple of 8. */
export const EP_SPACE = {
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  6: 48,
  10: 80,
  12: 96,
  15: 120,
} as const;

export const EP_LAYOUT = {
  contentMaxPx: 1200,
  marginDesktopPx: 120,
  marginTabletPx: 48,
  marginMobilePx: 24,
  gutterPx: 32,
} as const;

/** Design Bible type scale */
export const EP_TYPE = {
  display: { sizePx: 72, lineHeightPx: 80, weight: 300 },
  h1: { sizePx: 48, lineHeightPx: 56, weight: 400 },
  h2: { sizePx: 32, lineHeightPx: 40, weight: 400 },
  title: { sizePx: 20, lineHeightPx: 28, weight: 500 },
  body: { sizePx: 16, lineHeightPx: 26, weight: 400 },
  caption: { sizePx: 12, lineHeightPx: 18, weight: 400 },
  label: { sizePx: 11, lineHeightPx: 16, weight: 500, letterSpacingEm: 0.08 },
} as const;

export const EP_BEAT = {
  primaryToSupportingPx: EP_SPACE[12],
  supportingToGroundingPx: EP_SPACE[10],
} as const;
