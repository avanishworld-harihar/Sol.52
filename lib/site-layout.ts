import { z } from "zod";

export const positionSchema = z
  .array(z.number())
  .min(2)
  .max(3)
  .refine(
    (position) =>
      position[0] >= -180 &&
      position[0] <= 180 &&
      position[1] >= -90 &&
      position[1] <= 90,
    "Invalid longitude/latitude"
  );

export const roofPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z
    .array(z.array(positionSchema).min(4))
    .min(1)
    .refine(
      (rings) =>
        rings.every((ring) => {
          const first = ring[0];
          const last = ring[ring.length - 1];
          return first?.[0] === last?.[0] && first?.[1] === last?.[1];
        }),
      "Polygon rings must be closed"
    ),
});

export const roofMultiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z
    .array(roofPolygonSchema.shape.coordinates)
    .min(1)
    .max(50),
});

export const roofGeometrySchema = z.union([
  roofPolygonSchema,
  roofMultiPolygonSchema,
]);

export const siteObstructionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(["water_tank", "tree", "chimney", "parapet", "other"]),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  height_ft: z.number().nonnegative().max(500).default(0),
  /**
   * How `height_ft` is measured for shadow on the plant roof:
   * - above_roof: object sits on/near the array roof (tank, chimney, parapet)
   * - agl: object height above ground (tree, neighbour). Effective cast =
   *   max(0, height_agl − plant_roof_height_agl).
   */
  height_datum: z.enum(["above_roof", "agl"]).optional().nullable(),
  radius_ft: z.number().nonnegative().max(500).nullish(),
  label: z.string().max(120).optional().nullable(),
});

export const saveSiteLayoutSchema = z.object({
  design_id: z.string().uuid().optional().nullable(),
  center_lat: z.number().min(-90).max(90).optional().nullable(),
  center_lng: z.number().min(-180).max(180).optional().nullable(),
  roof_geojson: roofGeometrySchema,
  roof_azimuth_deg: z.number().min(0).max(360).optional().nullable(),
  obstructions_geojson: z.array(siteObstructionSchema).max(250).default([]),
  roof_area_sqft: z.number().nonnegative().max(100_000_000),
  map_snapshot_path: z.string().max(1000).optional().nullable(),
  created_by_id: z.string().uuid().optional().nullable(),
});

export type RoofPolygon = z.infer<typeof roofPolygonSchema>;
export type RoofMultiPolygon = z.infer<typeof roofMultiPolygonSchema>;
export type RoofGeometry = z.infer<typeof roofGeometrySchema>;
export type SiteObstruction = z.infer<typeof siteObstructionSchema>;
export type SaveSiteLayoutInput = z.infer<typeof saveSiteLayoutSchema>;

export type ProjectSiteLayout = SaveSiteLayoutInput & {
  id: string;
  organization_id: string;
  project_id: string;
  version_number: number;
  is_current: boolean;
  created_at: string;
  /** Public Design pack token — /design/[token]. */
  share_token?: string | null;
  /** Signed URL for Hub thumbnail — API-only, not stored. */
  map_snapshot_url?: string | null;
};
