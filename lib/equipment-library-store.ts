import {
  BUILT_IN_EQUIPMENT_LIBRARY,
  equipmentLibrarySchema,
  type EquipmentLibrary,
} from "@/lib/equipment-library";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const GLOBAL_SCOPE = "global";

type LibraryRow = {
  scope_key: string;
  catalog: unknown;
  updated_at: string;
};

export async function getEquipmentLibrary(): Promise<EquipmentLibrary> {
  const client = createSupabaseAdmin();
  if (!client) return BUILT_IN_EQUIPMENT_LIBRARY;
  const { data, error } = await client
    .from("equipment_engineering_libraries")
    .select("scope_key, catalog, updated_at")
    .eq("scope_key", GLOBAL_SCOPE)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn("[equipment-library] fetch failed:", error.message);
    return BUILT_IN_EQUIPMENT_LIBRARY;
  }
  const parsed = equipmentLibrarySchema.safeParse((data as LibraryRow).catalog);
  return parsed.success ? parsed.data : BUILT_IN_EQUIPMENT_LIBRARY;
}

export async function saveEquipmentLibrary(library: EquipmentLibrary): Promise<boolean> {
  const client = createSupabaseAdmin();
  if (!client) return false;
  const catalog = equipmentLibrarySchema.parse(library);
  const { error } = await client.from("equipment_engineering_libraries").upsert(
    {
      scope_key: GLOBAL_SCOPE,
      catalog,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "scope_key" }
  );
  if (error) {
    console.warn("[equipment-library] save failed:", error.message);
    return false;
  }
  return true;
}
