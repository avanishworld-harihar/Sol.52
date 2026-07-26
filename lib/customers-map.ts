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
    created_at: row.created_at != null ? String(row.created_at) : null,
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
    household_id:
      row.household_id != null && String(row.household_id).trim()
        ? String(row.household_id).trim()
        : null,
    is_whatsapp_contact: row.is_whatsapp_contact === true,
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

/** Most recent engagement time — calls, proposal status, edits, or create. */
export function customerRecencyMs(c: Pick<
  CustomerLead,
  "last_activity_at" | "last_touched_at" | "created_at"
>): number {
  let max = 0;
  for (const raw of [c.last_activity_at, c.last_touched_at, c.created_at]) {
    if (!raw) continue;
    const t = Date.parse(raw);
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max;
}

/** Newest / most recently worked customers first (calls, proposals, Won). */
export function sortCustomersByRecency<T extends Pick<
  CustomerLead,
  "id" | "status" | "last_activity_at" | "last_touched_at" | "created_at"
>>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const d = customerRecencyMs(b) - customerRecencyMs(a);
    if (d !== 0) return d;
    /** Same timestamp → Won (active install) above untouched new leads. */
    const aw = normalizeLeadStatus(String(a.status ?? "")) === "won" ? 1 : 0;
    const bw = normalizeLeadStatus(String(b.status ?? "")) === "won" ? 1 : 0;
    if (bw !== aw) return bw - aw;
    return String(a.id).localeCompare(String(b.id));
  });
}
