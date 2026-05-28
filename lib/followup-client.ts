import type { ActivityEvent, FollowupReminder, LeadNote, LeadVisit } from "@/lib/followup-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "request_failed");
  return json.data as T;
}

export function fetchLeadTimeline(leadId: string) {
  return fetchJson<ActivityEvent[]>(`/api/customers/${encodeURIComponent(leadId)}/timeline?limit=50`);
}

export function fetchLeadReminders(leadId: string) {
  return fetchJson<FollowupReminder[]>(`/api/customers/${encodeURIComponent(leadId)}/reminders?limit=50`);
}

export function fetchLeadNotes(leadId: string) {
  return fetchJson<LeadNote[]>(`/api/customers/${encodeURIComponent(leadId)}/notes?limit=50`);
}

export function fetchLeadVisits(leadId: string) {
  return fetchJson<LeadVisit[]>(`/api/customers/${encodeURIComponent(leadId)}/visits?limit=50`);
}

export function fetchLeadProposals(leadId: string) {
  return fetchJson<Record<string, unknown>[]>(`/api/customers/${encodeURIComponent(leadId)}/proposals?limit=50`);
}

export async function createReminder(
  leadId: string,
  payload: Partial<FollowupReminder> & { title: string; due_at: string }
) {
  const res = await fetch(`/api/customers/${encodeURIComponent(leadId)}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { ok?: boolean; data?: FollowupReminder; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "request_failed");
  return json.data as FollowupReminder;
}

export async function patchReminder(reminderId: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/reminders/${encodeURIComponent(reminderId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const json = (await res.json()) as { ok?: boolean; data?: FollowupReminder; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "request_failed");
  return json.data as FollowupReminder;
}

export async function createLeadNote(leadId: string, payload: { body_text: string }) {
  const res = await fetch(`/api/customers/${encodeURIComponent(leadId)}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body_text: payload.body_text, attachments_json: [] }),
  });
  const json = (await res.json()) as { ok?: boolean; data?: LeadNote; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "request_failed");
  return json.data as LeadNote;
}

export async function createLeadVisit(
  leadId: string,
  payload: { scheduled_at: string; summary?: string; location?: string; visit_status?: LeadVisit["visit_status"] }
) {
  const res = await fetch(`/api/customers/${encodeURIComponent(leadId)}/visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { ok?: boolean; data?: LeadVisit; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "request_failed");
  return json.data as LeadVisit;
}

export async function logCustomerContact(leadId: string, channel: "call" | "whatsapp") {
  await fetch(`/api/customers/${encodeURIComponent(leadId)}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  });
}
