import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export async function countOrgMembers(organizationId: string): Promise<number> {
  const client = db();
  if (!client || !organizationId) return 0;

  const { count, error } = await client
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    if (!/relation.*does not exist|Could not find the table/i.test(error.message)) {
      console.warn("[billing] countOrgMembers:", error.message);
    }
    return 0;
  }

  return count ?? 0;
}
