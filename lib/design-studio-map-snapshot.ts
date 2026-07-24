/**
 * Design Studio Phase 5 — Google Static Maps snapshot URL builder.
 * Installer Design pack / Hub thumbnail only — not customer proposal.
 */

import type { RoofGeometry } from "@/lib/site-layout";

const STATIC_MAP_MAX_URL = 7800;
const MAX_PANEL_MARKERS = 40;
const MAX_RING_POINTS = 90;

export type SnapshotPanelPoint = { lat: number; lng: number };

function sampleRing(ring: number[][], maxPoints: number): number[][] {
  if (ring.length <= maxPoints) return ring;
  const step = Math.ceil(ring.length / maxPoints);
  const sampled: number[][] = [];
  for (let i = 0; i < ring.length - 1; i += step) {
    const pt = ring[i];
    if (pt) sampled.push(pt);
  }
  const first = ring[0];
  const last = sampled[sampled.length - 1];
  if (first && (!last || last[0] !== first[0] || last[1] !== first[1])) {
    sampled.push([...first]);
  }
  return sampled;
}

function firstRoofRing(roof: RoofGeometry): number[][] | null {
  if (roof.type === "Polygon") {
    return roof.coordinates[0] ?? null;
  }
  return roof.coordinates[0]?.[0] ?? null;
}

function pathParam(ring: number[][]): string {
  const sampled = sampleRing(ring, MAX_RING_POINTS);
  const coords = sampled
    .map(([lng, lat]) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`)
    .join("|");
  // Cyan outline + teal fill for roof footprint
  return `color:0x22d3eeff|weight:2|fillcolor:0x0f766e66|${coords}`;
}

/**
 * Build a Google Static Maps hybrid URL for the current design geometry.
 */
export function buildDesignStudioStaticMapUrl(opts: {
  centerLat: number;
  centerLng: number;
  zoom?: number;
  roof: RoofGeometry | null;
  panelPoints?: SnapshotPanelPoint[];
  size?: `${number}x${number}`;
  apiKey: string;
}): string | null {
  const key = opts.apiKey.trim();
  if (!key) return null;
  if (!Number.isFinite(opts.centerLat) || !Number.isFinite(opts.centerLng)) return null;

  const zoom = Math.min(21, Math.max(14, Math.round(opts.zoom ?? 19)));
  const size = opts.size ?? "640x400";
  const params = new URLSearchParams({
    center: `${opts.centerLat.toFixed(6)},${opts.centerLng.toFixed(6)}`,
    zoom: String(zoom),
    size,
    scale: "2",
    maptype: "hybrid",
    key,
  });

  if (opts.roof) {
    const ring = firstRoofRing(opts.roof);
    if (ring && ring.length >= 4) {
      params.append("path", pathParam(ring));
    }
  }

  const points = (opts.panelPoints ?? []).slice(0, MAX_PANEL_MARKERS);
  for (const point of points) {
    params.append(
      "markers",
      `size:tiny|color:0x38bdf8|${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
    );
  }

  let url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  // Drop panel markers if URL too long (Static Maps hard limit ~8192).
  if (url.length > STATIC_MAP_MAX_URL && points.length > 0) {
    const slim = new URLSearchParams({
      center: `${opts.centerLat.toFixed(6)},${opts.centerLng.toFixed(6)}`,
      zoom: String(zoom),
      size,
      scale: "2",
      maptype: "hybrid",
      key,
    });
    if (opts.roof) {
      const ring = firstRoofRing(opts.roof);
      if (ring && ring.length >= 4) slim.append("path", pathParam(ring));
    }
    url = `https://maps.googleapis.com/maps/api/staticmap?${slim.toString()}`;
  }
  if (url.length > STATIC_MAP_MAX_URL) return null;
  return url;
}
