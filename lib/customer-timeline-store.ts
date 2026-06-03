/**
 * Customer timeline — CRM activity_events + major project milestones (Phase 1).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { listActivityTimeline } from "@/lib/followup-store";
import type { ActivityEvent } from "@/lib/followup-types";
import type { FollowupPagination } from "@/lib/followup-types";

export const PROJECT_MILESTONE_EVENT_TYPES = [
  "project_created",
  "stage_changed",
  "project_completed",
  "project_archived",
] as const;

export type CustomerTimelineItem =
  | (ActivityEvent & { kind: "crm" })
  | {
      kind: "project_milestone";
      id: string;
      lead_id: string;
      occurred_at: string;
      event_type: string;
      event_title: string;
      event_description: string | null;
      project_id: string;
      project_label: string | null;
      meta_json: Record<string, unknown>;
    };

function db() {
  return createSupabaseAdmin();
}

export async function listCustomerTimelineMerged(
  customerId: string,
  page?: FollowupPagination
): Promise<CustomerTimelineItem[]> {
  const limit = Math.min(100, Math.max(1, (page?.limit ?? 30) * 2));
  const crm = await listActivityTimeline(customerId, { limit, offset: page?.offset ?? 0 });
  const crmItems: CustomerTimelineItem[] = crm.map((e) => ({ ...e, kind: "crm" as const }));

  const milestones = await fetchProjectMilestones(customerId, limit);
  const merged = [...crmItems, ...milestones];
  merged.sort(
    (a, b) =>
      new Date(getOccurredAt(b)).getTime() - new Date(getOccurredAt(a)).getTime()
  );

  const cap = page?.limit ?? 30;
  return merged.slice(0, cap);
}

function getOccurredAt(item: CustomerTimelineItem): string {
  return item.kind === "crm" ? item.occurred_at : item.occurred_at;
}

async function fetchProjectMilestones(
  customerId: string,
  limit: number
): Promise<CustomerTimelineItem[]> {
  const client = db();
  if (!client) return [];

  const { data: projects, error: pErr } = await client
    .from("projects")
    .select("id, official_name, customer_name")
    .eq("lead_id", customerId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (pErr || !projects?.length) return [];

  const projectMeta = new Map(
    projects.map((p) => [
      String(p.id),
      String(p.official_name ?? p.customer_name ?? "Project").trim() || "Project",
    ])
  );
  const ids = [...projectMeta.keys()];

  const { data: logs, error } = await client
    .from("project_activity_log")
    .select("id, project_id, event_type, event_title, event_description, metadata_json, created_at")
    .in("project_id", ids)
    .in("event_type", [...PROJECT_MILESTONE_EVENT_TYPES])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01") return [];
    console.warn("[customer-timeline] project_activity_log:", error.message);
    return [];
  }

  return (logs ?? []).map((row) => ({
    kind: "project_milestone" as const,
    id: `pm-${row.id}`,
    lead_id: customerId,
    occurred_at: String(row.created_at),
    event_type: String(row.event_type),
    event_title: String(row.event_title ?? row.event_type),
    event_description:
      row.event_description != null ? String(row.event_description) : null,
    project_id: String(row.project_id),
    project_label: projectMeta.get(String(row.project_id)) ?? null,
    meta_json:
      row.metadata_json && typeof row.metadata_json === "object"
        ? (row.metadata_json as Record<string, unknown>)
        : {},
  }));
}
