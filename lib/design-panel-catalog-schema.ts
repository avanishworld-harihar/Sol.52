import { z } from "zod";
import { panelSpecSchema } from "@/lib/panel-layout";

export const DESIGN_PANEL_CATALOG_SCOPE = "default";

/** Org-owned extras only (built-in catalog stays in code). */
export const designPanelOrgModulesSchema = z.array(panelSpecSchema).max(200);

export const designPanelCatalogPatchSchema = z.object({
  orgModules: designPanelOrgModulesSchema,
});

export type DesignPanelCatalogRecord = {
  scopeKey: string;
  orgModules: z.infer<typeof designPanelOrgModulesSchema>;
  updatedAt: string;
};
