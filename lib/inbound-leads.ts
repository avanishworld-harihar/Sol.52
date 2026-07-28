/**
 * Sol.52 — single source of truth for "absorb a new lead".
 *
 * Manual CRM + proposal create: different people may share one WhatsApp number —
 * each gets their own lead row, linked via household_id.
 * Channel inbound (website / WA / Meta): merge only when names look like the same person.
 */

import { personNamesLikelyDifferent, personNamesLikelySame } from "@/lib/crm-household";
import { normalizeLeadPhoneForStorage } from "@/lib/lead-phone";
import {
  createCustomer,
  findLeadByPhone,
  findLeadsByPhone,
  refreshLeadFromInbound,
  resolveLeadsTable,
  type CustomerInput,
  type LeadSource
} from "@/lib/supabase";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

export type InboundLeadInput = {
  name: string;
  phone: string;
  city?: string;
  state?: string | null;
  discom?: string;
  monthly_bill?: number;
  email?: string | null;
  /** Optional DISCOM consumer number (bill). */
  consumer_id?: string | null;
  /** Site survey CRM step (`not_started` | `scheduled` | `complete`). */
  survey_status?: string | null;
  area?: string | null;
  location?: string | null;
  connection_type?: string | null;
  source: LeadSource;
  source_meta?: Record<string, unknown> | null;
  /**
   * Always create a new lead row (family member / proposal person).
   * Default true for `manual`; channel sources default false (merge when same person).
   */
  forceNew?: boolean;
  /** Mark this member as household WhatsApp / call contact. */
  isWhatsappContact?: boolean;
  /** Bill / account-holder name (CRM consumer_name). */
  consumerName?: string | null;
  /** Tenant — when set, phone dedupe stays inside this org (Sol.52 ≠ Harihar). */
  organizationId?: string | null;
};

export type InboundLeadResult = {
  deduped: boolean;
  data: Record<string, unknown>;
  householdLinked?: boolean;
};

function db() {
  return createSupabaseAdmin() ?? supabase;
}

async function ensureHouseholdLink(
  existingRows: Record<string, unknown>[],
  created: Record<string, unknown>,
  opts?: { newIsWhatsapp?: boolean }
): Promise<Record<string, unknown>> {
  const client = db();
  const leadsTable = await resolveLeadsTable();
  if (!client || !leadsTable || existingRows.length === 0) return created;

  let householdId =
    existingRows.map((r) => (r.household_id != null ? String(r.household_id) : "")).find((h) => h.length > 0) ||
    (created.household_id != null ? String(created.household_id) : "") ||
    crypto.randomUUID();

  const ids = [
    ...existingRows.map((r) => String(r.id ?? "")).filter(Boolean),
    String(created.id ?? ""),
  ].filter(Boolean);

  const hasWhatsapp = existingRows.some((r) => r.is_whatsapp_contact === true);
  const createdId = String(created.id ?? "");

  for (const id of ids) {
    const patch: Record<string, unknown> = { household_id: householdId };
    if (id === createdId) {
      patch.is_whatsapp_contact = opts?.newIsWhatsapp === true ? true : hasWhatsapp ? false : true;
    } else if (!hasWhatsapp) {
      /* Promote oldest existing as WhatsApp contact when forming a household. */
      const firstExisting = String(existingRows[0]?.id ?? "");
      if (id === firstExisting) patch.is_whatsapp_contact = true;
    }
    await client.from(leadsTable).update(patch).eq("id", id);
  }

  const { data } = await client.from(leadsTable).select("*").eq("id", createdId).maybeSingle();
  return (data as Record<string, unknown> | null) ?? { ...created, household_id: householdId };
}

export async function processInboundLead(input: InboundLeadInput): Promise<InboundLeadResult> {
  const phone = normalizeLeadPhoneForStorage(input.phone);
  const consumerTrim =
    input.consumer_id != null && String(input.consumer_id).trim().length > 0
      ? String(input.consumer_id).trim()
      : undefined;
  const surveyTrim =
    input.survey_status != null && String(input.survey_status).trim().length > 0
      ? String(input.survey_status).trim().toLowerCase()
      : undefined;

  const forceNew =
    input.forceNew === true || (input.forceNew !== false && input.source === "manual");

  const samePhoneLeads = phone
    ? await findLeadsByPhone(phone, { organizationId: input.organizationId ?? null })
    : [];
  const samePerson = samePhoneLeads.find((row) =>
    personNamesLikelySame(String(row.name ?? ""), input.name)
  );

  /** Channel inbound: merge only when the same person (or empty name on existing). */
  const shouldMerge =
    !forceNew &&
    Boolean(samePerson || (samePhoneLeads.length === 1 && !String(samePhoneLeads[0]?.name ?? "").trim()));

  if (shouldMerge) {
    const existing = samePerson ?? samePhoneLeads[0]!;
    const customerInput: CustomerInput = {
      name: input.name.trim(),
      city: (input.city ?? "").trim(),
      state: input.state ?? null,
      discom: (input.discom ?? "").trim(),
      email: input.email ?? null,
      monthly_bill:
        typeof input.monthly_bill === "number" && input.monthly_bill > 0 ? input.monthly_bill : 0,
      phone,
      status: "new",
      source: input.source,
      source_meta: input.source_meta ?? null,
      ...(consumerTrim ? { consumer_id: consumerTrim } : {}),
      ...(surveyTrim ? { survey_status: surveyTrim } : {}),
      ...(input.area?.trim() ? { area: input.area.trim().toLowerCase() } : {}),
      ...(input.location?.trim() ? { location: input.location.trim() } : {}),
      ...(input.connection_type?.trim()
        ? { connection_type: input.connection_type.trim().toLowerCase() }
        : {}),
      ...(input.organizationId ? { organization_id: input.organizationId } : {}),
    };
    const refreshed = await refreshLeadFromInbound(String(existing.id), customerInput);
    return { deduped: true, data: refreshed ?? existing };
  }

  /** Different name + same phone (or force new) → create sibling member. */
  const otherMembers = samePhoneLeads.filter(
    (row) => personNamesLikelyDifferent(String(row.name ?? ""), input.name) || forceNew
  );
  const householdPeers =
    samePhoneLeads.length > 0 && !samePerson
      ? samePhoneLeads
      : otherMembers.length > 0
        ? samePhoneLeads
        : [];

  let householdId: string | null =
    householdPeers
      .map((r) => (r.household_id != null ? String(r.household_id) : ""))
      .find((h) => h.length > 0) || null;
  if (!householdId && householdPeers.length > 0) {
    householdId = crypto.randomUUID();
  }

  const hasWhatsapp = householdPeers.some((r) => r.is_whatsapp_contact === true);
  const isWhatsapp =
    input.isWhatsappContact === true
      ? true
      : input.isWhatsappContact === false
        ? false
        : householdPeers.length === 0
          ? true
          : !hasWhatsapp;

  const customerInput: CustomerInput = {
    name: input.name.trim(),
    city: (input.city ?? "").trim() || "Unknown",
    state: input.state ?? null,
    discom: (input.discom ?? "").trim() || "Unknown",
    email: input.email ?? null,
    monthly_bill:
      typeof input.monthly_bill === "number" && input.monthly_bill > 0 ? input.monthly_bill : 0,
    phone,
    status: "new",
    source: input.source,
    source_meta: input.source_meta ?? null,
    household_id: householdId,
    is_whatsapp_contact: isWhatsapp,
    ...(input.consumerName?.trim() ? { consumer_name: input.consumerName.trim() } : {}),
    ...(consumerTrim ? { consumer_id: consumerTrim } : {}),
    ...(surveyTrim ? { survey_status: surveyTrim } : {}),
    ...(input.area?.trim() ? { area: input.area.trim().toLowerCase() } : {}),
    ...(input.location?.trim() ? { location: input.location.trim() } : {}),
    ...(input.connection_type?.trim()
      ? { connection_type: input.connection_type.trim().toLowerCase() }
      : {}),
    ...(input.organizationId ? { organization_id: input.organizationId } : {}),
  };

  try {
    let created = (await createCustomer(customerInput)) as Record<string, unknown>;
    let householdLinked = false;
    if (householdPeers.length > 0) {
      created = await ensureHouseholdLink(householdPeers, created, {
        newIsWhatsapp: isWhatsapp,
      });
      householdLinked = true;
    }
    return { deduped: false, data: created, householdLinked };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    /** Legacy unique index still present — fall back to merge for same phone. */
    if (/duplicate key|23505|leads_phone_unique/i.test(message) && phone) {
      const existing = await findLeadByPhone(phone, { organizationId: input.organizationId ?? null });
      if (existing) {
        if (personNamesLikelyDifferent(String(existing.name ?? ""), input.name)) {
          throw new Error(
            "Run migration 073_crm_household_shared_phone.sql in Supabase so family members can share one phone."
          );
        }
        return { deduped: true, data: existing };
      }
    }
    throw error;
  }
}
