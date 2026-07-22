import {
  DESIGN_PANEL_CATALOG_SCOPE,
  designPanelOrgModulesSchema,
  type DesignPanelCatalogRecord,
} from "@/lib/design-panel-catalog-schema";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

type DbRow = {
  scope_key: string;
  org_modules: unknown;
  updated_at: string;
};

function rowToRecord(row: DbRow): DesignPanelCatalogRecord {
  const parsed = designPanelOrgModulesSchema.safeParse(row.org_modules);
  return {
    scopeKey: row.scope_key,
    orgModules: parsed.success ? parsed.data : [],
    updatedAt: row.updated_at,
  };
}

export async function getDesignPanelCatalog(
  scopeKey = DESIGN_PANEL_CATALOG_SCOPE
): Promise<DesignPanelCatalogRecord | null> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return null;

  const { data, error } = await client
    .from("design_panel_module_catalogs")
    .select("scope_key, org_modules, updated_at")
    .eq("scope_key", scopeKey)
    .maybeSingle();

  if (error) {
    console.warn("[design-panel-catalog] fetch failed:", error.message);
    return null;
  }
  if (!data) {
    return {
      scopeKey,
      orgModules: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return rowToRecord(data as DbRow);
}

export async function upsertDesignPanelCatalog(
  orgModules: DesignPanelCatalogRecord["orgModules"],
  scopeKey = DESIGN_PANEL_CATALOG_SCOPE
): Promise<DesignPanelCatalogRecord | null> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return null;

  const cleaned = designPanelOrgModulesSchema.parse(orgModules);
  const updatedAt = new Date().toISOString();

  const { data, error } = await client
    .from("design_panel_module_catalogs")
    .upsert(
      {
        scope_key: scopeKey,
        org_modules: cleaned,
        updated_at: updatedAt,
      },
      { onConflict: "scope_key" }
    )
    .select("scope_key, org_modules, updated_at")
    .single();

  if (error || !data) {
    console.warn("[design-panel-catalog] upsert failed:", error?.message);
    return null;
  }
  return rowToRecord(data as DbRow);
}
