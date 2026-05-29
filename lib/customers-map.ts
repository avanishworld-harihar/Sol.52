import { normalizeLeadStatus } from "@/lib/lead-status";
import type { CustomerLead } from "@/lib/types";

/** Map a Supabase `leads` row to `CustomerLead` (shared by GET + PATCH). */
export function mapCustomerRow(row: Record<string, unknown>): CustomerLead {
  const phoneRaw = row.phone;
  const phone =
    phoneRaw != null && String(phoneRaw).trim() ? String(phoneRaw).trim() : null;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    consumer_name:
      row.consumer_name != null && String(row.consumer_name).trim()
        ? String(row.consumer_name).trim()
        : null,
    city: String(row.city ?? ""),
    discom: String(row.discom ?? ""),
    monthly_bill: Number(row.monthly_bill ?? row.monthlyBill ?? 0) || 0,
    status: normalizeLeadStatus(String(row.status ?? "new")),
    phone,
    source: row.source != null ? String(row.source) : null,
    last_touched_at: row.last_touched_at != null ? String(row.last_touched_at) : null,
    state: row.state != null ? String(row.state) : null,
    email: row.email != null ? String(row.email) : null,
    consumer_id:
      row.consumer_id != null && String(row.consumer_id).trim()
        ? String(row.consumer_id).trim()
        : null,
    survey_status:
      row.survey_status != null && String(row.survey_status).trim()
        ? String(row.survey_status).trim().toLowerCase()
        : null,
    area: row.area != null && String(row.area).trim() ? String(row.area).trim().toLowerCase() : null,
    location:
      row.location != null && String(row.location).trim() ? String(row.location).trim() : null,
    connection_type:
      row.connection_type != null && String(row.connection_type).trim()
        ? String(row.connection_type).trim().toLowerCase()
        : null,
    /* Phase 2 CRM summary fields — populated only by /api/customers list */
    next_followup_at:
      row.next_followup_at != null ? String(row.next_followup_at) : null,
    next_followup_title:
      row.next_followup_title != null ? String(row.next_followup_title) : null,
    last_activity_at:
      row.last_activity_at != null ? String(row.last_activity_at) : null,
    last_activity_type:
      row.last_activity_type != null ? String(row.last_activity_type) : null,
  };
}
