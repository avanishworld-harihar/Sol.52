import { z } from "zod";
import { residentialBrandCatalogSchema } from "@/lib/residential-requirements-schema";

export const commercialPanelRateOverrideSchema = z.object({
  id: z.string().min(1).max(80),
  ratePerWpInr: z.number().min(0).max(500),
});

export const installerRateCardSchema = z.object({
  scopeKey: z.string().max(40).default("default"),
  residentialCatalog: residentialBrandCatalogSchema.optional(),
  commercialPanelRates: z.array(commercialPanelRateOverrideSchema).max(64).optional(),
  updatedAt: z.string().optional(),
});

export type CommercialPanelRateOverride = z.infer<typeof commercialPanelRateOverrideSchema>;
export type InstallerRateCard = z.infer<typeof installerRateCardSchema>;

export const INSTALLER_RATE_CARD_SCOPE = "default";
