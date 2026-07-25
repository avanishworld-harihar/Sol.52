import { personNamesLikelySame } from "@/lib/crm-household";
import { isSyntheticCrmCustomerName } from "@/lib/crm-synthetic-names";
import { processInboundLead } from "@/lib/inbound-leads";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { resolveLeadsTable, supabase } from "@/lib/supabase";
import { stripParentheticalPersonSuffix } from "@/lib/project-list-utils";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

/**
 * Active projects must always have a Customers tab lead.
 * Repairs orphan projects (missing / deleted lead_id) so won work stays visible in CRM.
 */
export async function syncLeadsFromActiveProjects(): Promise<{ linked: number; created: number }> {
  const client = db();
  if (!client) return { linked: 0, created: 0 };
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return { linked: 0, created: 0 };

  const { data: projects, error } = await client
    .from("projects")
    .select("id, lead_id, official_name, customer_name, detail")
    .is("archived_at", null)
    .eq("dashboard_visible", true)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !Array.isArray(projects)) return { linked: 0, created: 0 };

  let linked = 0;
  let created = 0;

  for (const row of projects) {
    const project = row as {
      id: string;
      lead_id?: string | null;
      official_name?: string | null;
      customer_name?: string | null;
      detail?: string | null;
    };
    const projectName = stripParentheticalPersonSuffix(
      project.official_name || project.customer_name || ""
    );
    if (projectName.length < 2) continue;
    if (isSyntheticCrmCustomerName(projectName)) continue;

    if (project.lead_id) {
      const { data: lead } = await client
        .from(leadsTable)
        .select("id, name")
        .eq("id", project.lead_id)
        .maybeSingle();
      if (lead?.id) continue;
      /** lead_id points at a deleted lead — clear and re-link below. */
    }

    const tokens = projectName
      .split(/\s+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((t) => t.length >= 2)
      .slice(-2);
    let nameHit: { id: string } | undefined;
    if (tokens.length > 0) {
      const { data: byName } = await client
        .from(leadsTable)
        .select("id, name")
        .ilike("name", `%${tokens.join("%")}%`)
        .limit(20);
      nameHit = Array.isArray(byName)
        ? (byName as { id: string; name?: string }[]).find((l) =>
            personNamesLikelySame(String(l.name ?? ""), projectName)
          )
        : undefined;
    }

    if (nameHit?.id) {
      await client
        .from("projects")
        .update({ lead_id: nameHit.id, updated_at: new Date().toISOString() })
        .eq("id", project.id);
      linked += 1;
      continue;
    }

    try {
      const cityFromDetail =
        typeof project.detail === "string" && project.detail.startsWith("Site: ")
          ? project.detail.slice(6).trim()
          : "";
      const result = await processInboundLead({
        name: projectName,
        phone: "",
        city: cityFromDetail || "Unknown",
        discom: "Unknown",
        monthly_bill: 0,
        source: "manual",
        forceNew: true,
        isWhatsappContact: true,
        source_meta: {
          synced_from_project: project.id,
          reason: "active_project_needs_crm_lead",
        },
      });
      const newId = String(result.data.id ?? "");
      if (!newId) continue;
      created += 1;
      await client
        .from("projects")
        .update({ lead_id: newId, updated_at: new Date().toISOString() })
        .eq("id", project.id);
      linked += 1;
    } catch (err) {
      console.warn("[syncLeadsFromActiveProjects]", project.id, err);
    }
  }

  return { linked, created };
}
