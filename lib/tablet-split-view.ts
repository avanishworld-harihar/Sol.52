/** iPad / tablet range where list + detail split is preferred (768px–1279px). */
export const TABLET_SPLIT_MIN_PX = 768;
export const TABLET_SPLIT_MAX_PX = 1279;

export const TABLET_SPLIT_MEDIA_QUERY = `(min-width: ${TABLET_SPLIT_MIN_PX}px) and (max-width: ${TABLET_SPLIT_MAX_PX}px)`;

export function isTabletSplitViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(TABLET_SPLIT_MEDIA_QUERY).matches;
}
