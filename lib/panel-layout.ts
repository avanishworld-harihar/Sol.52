import { z } from "zod";
import { roofPolygonSchema } from "@/lib/site-layout";

export const panelOrientationSchema = z.enum([
  "portrait",
  "landscape",
  "east_west",
]);

export const panelMountingTypeSchema = z.enum([
  "flush",
  "elevated",
  "ground_mount",
]);

export const panelSpecSchema = z.object({
  catalog_id: z.string().min(1).max(120).optional().nullable(),
  manufacturer: z.string().max(120).optional().nullable(),
  model: z.string().min(1).max(160),
  wattage: z.number().int().min(1).max(2_000),
  width_mm: z.number().int().min(100).max(5_000),
  height_mm: z.number().int().min(100).max(5_000),
});

export const placedPanelSchema = z.object({
  id: z.string().min(1).max(100),
  footprint_geojson: roofPolygonSchema,
  section_index: z.number().int().min(0).max(49),
  row_index: z.number().int().min(0).max(100_000),
  col_index: z.number().int().min(0).max(100_000),
  rotation_deg: z.number().min(-360).max(360).default(0),
  is_locked: z.boolean().default(false),
  is_manually_placed: z.boolean().default(false),
});

export const savePanelLayoutSchema = z
  .object({
    site_layout_id: z.string().uuid(),
    design_id: z.string().uuid().optional().nullable(),
    panel_spec: panelSpecSchema,
    orientation: panelOrientationSchema,
    tilt_deg: z.number().min(0).max(90).default(0),
    mounting_type: panelMountingTypeSchema.default("flush"),
    setback_ft: z.number().min(0).max(100).default(1.5),
    walkway_ft: z.number().min(0).max(100).default(0),
    panel_gap_mm: z.number().min(0).max(2_000).default(20),
    panels_geojson: z.array(placedPanelSchema).max(10_000),
    panel_count: z.number().int().min(0).max(10_000),
    dc_capacity_kw: z.number().min(0).max(100_000),
    remaining_area_sqft: z.number().min(0).max(100_000_000),
    coverage_pct: z.number().min(0).max(100),
    created_by_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((layout, ctx) => {
    if (layout.panel_count !== layout.panels_geojson.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["panel_count"],
        message: "Panel count must match panels_geojson length",
      });
    }

    const expectedKw = (layout.panel_count * layout.panel_spec.wattage) / 1_000;
    if (Math.abs(layout.dc_capacity_kw - expectedKw) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dc_capacity_kw"],
        message: "DC capacity must match panel count × panel wattage",
      });
    }
  });

export type PanelOrientation = z.infer<typeof panelOrientationSchema>;
export type PanelMountingType = z.infer<typeof panelMountingTypeSchema>;
export type PanelSpec = z.infer<typeof panelSpecSchema>;
export type PlacedPanel = z.infer<typeof placedPanelSchema>;
export type SavePanelLayoutInput = z.infer<typeof savePanelLayoutSchema>;

export type ProjectPanelLayout = SavePanelLayoutInput & {
  id: string;
  organization_id: string;
  project_id: string;
  version_number: number;
  is_current: boolean;
  generated_at: string;
  edited_at: string;
};
