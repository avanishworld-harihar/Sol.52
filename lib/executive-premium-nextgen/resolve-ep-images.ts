/** Stock install photo when proposal has no site images yet. */
export const EP_FALLBACK_PROPERTY_IMAGE = "/proposal-expertise/residential-rooftop-solar.jpg";

export function resolveEpPropertyImages(siteImages: string[]): {
  coverUrl: string;
  assetUrl: string;
} {
  const photos = siteImages.filter((u) => typeof u === "string" && u.length > 0);
  const fallback = EP_FALLBACK_PROPERTY_IMAGE;
  return {
    coverUrl: photos[0] ?? fallback,
    assetUrl: photos[1] ?? photos[0] ?? fallback,
  };
}
