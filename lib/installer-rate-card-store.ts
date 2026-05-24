import {
  commercialPanelRateOverrideSchema,
  INSTALLER_RATE_CARD_SCOPE,
  type InstallerRateCard,
} from "@/lib/installer-rate-card-schema";
import { defaultBrandCatalog, syncCatalogKwStructure, syncKwTierCanonical } from "@/lib/residential-brand-catalog";
import { residentialBrandCatalogSchema } from "@/lib/residential-requirements-schema";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

type DbRow = {
  scope_key: string;
  residential_catalog: unknown;
  commercial_panel_rates: unknown;
  updated_at: string;
};

function parseCommercialOverrides(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => commercialPanelRateOverrideSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data!);
}

function rowToCard(row: DbRow): InstallerRateCard {
  const residentialParsed = residentialBrandCatalogSchema.safeParse(row.residential_catalog);
  const residentialCatalog =
    residentialParsed.success && residentialParsed.data.entries?.length
      ? residentialParsed.data
      : defaultBrandCatalog();

  return {
    scopeKey: row.scope_key,
    residentialCatalog,
    commercialPanelRates: parseCommercialOverrides(row.commercial_panel_rates),
    updatedAt: row.updated_at,
  };
}

export async function getInstallerRateCard(
  scopeKey = INSTALLER_RATE_CARD_SCOPE
): Promise<InstallerRateCard | null> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return null;

  const { data, error } = await client
    .from("installer_rate_cards")
    .select("scope_key, residential_catalog, commercial_panel_rates, updated_at")
    .eq("scope_key", scopeKey)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCard(data as DbRow);
}

export async function upsertInstallerRateCard(
  patch: Partial<Pick<InstallerRateCard, "residentialCatalog" | "commercialPanelRates">>,
  scopeKey = INSTALLER_RATE_CARD_SCOPE
): Promise<InstallerRateCard | null> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return null;

  const existing = await getInstallerRateCard(scopeKey);
  const rawCatalog =
    patch.residentialCatalog ?? existing?.residentialCatalog ?? defaultBrandCatalog();
  const residentialCatalog = rawCatalog?.entries?.length
    ? syncCatalogKwStructure({
        ...rawCatalog,
        entries: rawCatalog.entries.map((e) => ({
          ...e,
          kwTiers: (e.kwTiers ?? []).map(syncKwTierCanonical),
        })),
      })
    : rawCatalog;

  const merged: InstallerRateCard = {
    scopeKey,
    residentialCatalog,
    commercialPanelRates: patch.commercialPanelRates ?? existing?.commercialPanelRates ?? [],
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("installer_rate_cards")
    .upsert(
      {
        scope_key: scopeKey,
        residential_catalog: merged.residentialCatalog ?? {},
        commercial_panel_rates: merged.commercialPanelRates ?? [],
        updated_at: merged.updatedAt,
      },
      { onConflict: "scope_key" }
    )
    .select("scope_key, residential_catalog, commercial_panel_rates, updated_at")
    .single();

  if (error || !data) {
    console.warn("[installer-rate-card] upsert failed:", error?.message);
    return null;
  }
  return rowToCard(data as DbRow);
}
