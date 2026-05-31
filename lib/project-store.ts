/**
 * Sol.52 — Phase 3A Project Store.
 *
 * SERVER-ONLY database helpers for all Phase 3 project tables.
 * Pattern mirrors lib/supabase.ts and lib/followup-store.ts.
 * All functions use createSupabaseAdmin() for service-role access (RLS bypass).
 *
 * Organization resolution:
 *   resolveDefaultOrgId() returns the first active org — supports single-tenant
 *   Phase 3 deployments without requiring auth headers. Replace with JWT-scoped
 *   resolution in Phase 5.
 *
 * NEVER import in client components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { calculateProjectHealth } from "@/lib/project-health";
import type { ProjectHealth } from "@/lib/project-health";
import type { ProjectStageId, ProjectStageStatus, NmSubstatus } from "@/lib/project-stages";
import { logProjectCreated } from "@/lib/project-activity-logger";
import { getTaskTemplatesForStage } from "@/lib/project-task-templates";
import { normalizeLeadStatus } from "@/lib/lead-status";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

// ---------------------------------------------------------------------------
// Organization resolution (single-tenant Phase 3 helper)
// ---------------------------------------------------------------------------

/** PostgREST / Postgres: column not present on this deploy (migrations not run). */
export function missingColumnFromPgError(message: string): string | null {
  const m = /Could not find the '([^']+)' column/i.exec(message);
  return m?.[1] ?? null;
}

/**
 * Insert into `projects` — drop any key PostgREST rejects so create works on
 * DBs that have Phase 3 columns but missed legacy pipeline columns (004/005).
 */
export async function insertProjectAdaptive(
  client: SupabaseClient,
  payload: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  let attempt = { ...payload };
  for (let guard = 0; guard < 40 && Object.keys(attempt).length > 0; guard++) {
    const { data, error } = await client.from("projects").insert(attempt).select("*").single();
    if (!error && data) {
      return { data: data as Record<string, unknown>, error: null };
    }
    const msg = error?.message ?? "";
    const miss = missingColumnFromPgError(msg);
    if (miss && miss in attempt) {
      delete attempt[miss];
      continue;
    }
    return { data: null, error: msg || "Project insert failed" };
  }
  return { data: null, error: "Project insert exhausted retries" };
}

/** Returns the first active organization id, or null if none exists. */
export async function resolveDefaultOrgId(): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client
    .from("organizations")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

const SITE_SURVEY_NEXT_ACTION = "Site survey pending";

export interface WonLeadProjectInput {
  name?: string | null;
  consumer_name?: string | null;
  city?: string | null;
}

/**
 * When a CRM lead is marked `won`, ensure a Phase 3 project row exists and is
 * visible on /projects (organization_id + dashboard_visible + not archived).
 */
export async function ensureProjectForWonLead(
  leadId: string,
  lead?: WonLeadProjectInput
): Promise<Record<string, unknown> | null> {
  const client = db();
  if (!client || !leadId.trim()) return null;

  const orgId = await resolveDefaultOrgId();
  const displayName =
    lead?.consumer_name?.trim() ||
    lead?.name?.trim() ||
    "Unnamed Project";
  const now = new Date().toISOString();

  const { data: existing } = await client
    .from("projects")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = { updated_at: now };
    if (orgId && !existing.organization_id) patch.organization_id = orgId;
    if (!existing.official_name) patch.official_name = displayName;
    if (!existing.customer_name) patch.customer_name = displayName;
    if (existing.dashboard_visible === false) patch.dashboard_visible = true;
    if (existing.archived_at != null) patch.archived_at = null;
    if (!existing.current_stage) patch.current_stage = "survey";
    if (!existing.stage_status) patch.stage_status = "in_progress";

    if (Object.keys(patch).length <= 1) {
      return existing as Record<string, unknown>;
    }

    const { data, error } = await client
      .from("projects")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) return existing as Record<string, unknown>;
    return data as Record<string, unknown>;
  }

  const insertPayload: Record<string, unknown> = {
    lead_id: leadId,
    official_name: displayName,
    customer_name: displayName,
    current_stage: "survey",
    stage_status: "in_progress",
    nm_substatus: "not_started",
    has_subsidy: false,
    amount_received_inr: 0,
    dashboard_visible: true,
    status: "pending",
    install_progress: 0,
    next_action: SITE_SURVEY_NEXT_ACTION,
    detail: lead?.city?.trim() ? `Site: ${lead.city.trim()}` : null,
    updated_at: now,
  };
  if (orgId) insertPayload.organization_id = orgId;

  const { data, error } = await insertProjectAdaptive(client, insertPayload);
  if (error || !data) {
    console.warn("[ensureProjectForWonLead] insert failed:", error);
    return null;
  }

  const projectId = String(data.id);

  if (orgId) {
    const templates = getTaskTemplatesForStage("survey");
    if (templates.length > 0) {
      const taskRows = templates.map((t) => ({
        organization_id: orgId,
        project_id: projectId,
        stage: "survey",
        title: t.title,
        description: t.description,
        is_blocking: t.is_blocking,
        sort_order: t.sort_order,
        status: "pending",
        is_template: true,
      }));
      await client.from("project_tasks").insert(taskRows);
    }

    await logProjectCreated({
      organizationId: orgId,
      projectId,
      customerName: displayName,
    });
  }

  return data;
}

/**
 * Repair pass: won CRM leads must have a visible Phase 3 project row.
 * Covers leads marked won before auto-create shipped (e.g. Bharti Gupta).
 */
export async function syncWonLeadProjects(): Promise<void> {
  const client = db();
  if (!client) return;

  const { resolveLeadsTable } = await import("@/lib/supabase");
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return;

  const { data: wonLeads, error: leadsErr } = await client
    .from(leadsTable)
    .select("id, name, consumer_name, city, status")
    .eq("status", "won")
    .limit(100);
  if (leadsErr || !wonLeads?.length) return;

  const leadIds = wonLeads.map((l) => String(l.id));
  const { data: linkedProjects } = await client
    .from("projects")
    .select("lead_id, organization_id")
    .in("lead_id", leadIds);

  const orgId = await resolveDefaultOrgId();
  const linked = new Map<string, { organization_id: string | null }>();
  for (const p of linkedProjects ?? []) {
    if (p.lead_id) linked.set(String(p.lead_id), { organization_id: p.organization_id as string | null });
  }

  for (const lead of wonLeads) {
    const id = String(lead.id);
    const row = linked.get(id);
    const needsCreate = !row;
    const needsOrgRepair = Boolean(orgId && row && !row.organization_id);
    if (!needsCreate && !needsOrgRepair) continue;
    await ensureProjectForWonLead(id, {
      name: String(lead.name ?? ""),
      consumer_name:
        lead.consumer_name != null ? String(lead.consumer_name) : null,
      city: String(lead.city ?? ""),
    });
  }
}

/** Returns true when lead status is CRM-won (install handoff). */
export function isWonLeadStatus(status: string | null | undefined): boolean {
  return normalizeLeadStatus(String(status ?? "")) === "won";
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  lead_id: string | null;
  organization_id: string | null;
  official_name: string | null;
  // Phase 3 stage fields
  current_stage: ProjectStageId;
  stage_status: ProjectStageStatus;
  nm_substatus: NmSubstatus;
  project_code: string | null;
  start_date: string | null;
  target_completion: string | null;
  actual_completion: string | null;
  // Team
  assigned_manager_id: string | null;
  assigned_tech_id: string | null;
  // Site
  site_address: string | null;
  site_lat: number | null;
  site_lng: number | null;
  roof_type: string | null;
  // System
  system_type: string | null;
  panel_brand: string | null;
  inverter_brand: string | null;
  panel_count: number | null;
  structure_type: string | null;
  // Financial
  contract_amount_inr: number | null;
  amount_received_inr: number;
  // Net metering
  discom_application_no: string | null;
  nm_application_date: string | null;
  meter_serial_no: string | null;
  nm_activation_date: string | null;
  // Subsidy
  has_subsidy: boolean;
  // Legacy (kept for backward compat)
  status: string | null;
  install_progress: number;
  detail: string | null;
  capacity_kw: string | null;
  next_action: string | null;
  dashboard_visible: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetailRow extends ProjectRow {
  lead_name: string | null;
  lead_phone: string | null;
  lead_city: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  tech_name: string | null;
  tech_phone: string | null;
  health: ProjectHealth;
}

export interface InstallerProfileRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  display_name: string;
  role: string;
  job_function: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Project queries
// ---------------------------------------------------------------------------

/** Full project detail with lead + team joins. */
export async function getProjectDetail(projectId: string): Promise<ProjectDetailRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("projects")
    .select(`
      *,
      leads!projects_lead_id_fkey (
        name,
        phone,
        city
      ),
      manager:installer_profiles!projects_assigned_manager_id_fkey (
        display_name,
        phone
      ),
      tech:installer_profiles!projects_assigned_tech_id_fkey (
        display_name,
        phone
      )
    `)
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const leads = row.leads as Record<string, unknown> | null;
  const manager = row.manager as Record<string, unknown> | null;
  const tech = row.tech as Record<string, unknown> | null;

  const base = { ...row } as Record<string, unknown>;
  delete base.leads;
  delete base.manager;
  delete base.tech;

  const project = base as unknown as ProjectRow;

  return {
    ...project,
    lead_name: leads ? String(leads.name ?? "") : null,
    lead_phone: leads ? String(leads.phone ?? "") : null,
    lead_city: leads ? String(leads.city ?? "") : null,
    manager_name: manager ? String(manager.display_name ?? "") : null,
    manager_phone: manager ? String(manager.phone ?? "") : null,
    tech_name: tech ? String(tech.display_name ?? "") : null,
    tech_phone: tech ? String(tech.phone ?? "") : null,
    health: calculateProjectHealth(project),
  };
}

/** List projects with optional filters. Returns rows with computed health. */
export async function listProjects(opts: {
  organizationId?: string | null;
  stage?: string | null;
  view?: "active" | "hidden" | "archived";
  limit?: number;
  offset?: number;
}): Promise<ProjectDetailRow[]> {
  const client = db();
  if (!client) return [];

  let query = client.from("projects").select(`
    *,
    leads!projects_lead_id_fkey (
      name,
      phone,
      city
    ),
    manager:installer_profiles!projects_assigned_manager_id_fkey (
      display_name,
      phone
    ),
    tech:installer_profiles!projects_assigned_tech_id_fkey (
      display_name,
      phone
    )
  `);

  if (opts.organizationId) {
    query = query.eq("organization_id", opts.organizationId);
  }

  if (opts.stage) {
    query = query.eq("current_stage", opts.stage);
  }

  const view = opts.view ?? "active";
  if (view === "active") {
    query = query.eq("dashboard_visible", true).is("archived_at", null);
  } else if (view === "hidden") {
    query = query.eq("dashboard_visible", false).is("archived_at", null);
  } else if (view === "archived") {
    query = query.not("archived_at", "is", null);
  }

  query = query
    .order("updated_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 100) - 1);

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const leads = row.leads as Record<string, unknown> | null;
    const manager = row.manager as Record<string, unknown> | null;
    const tech = row.tech as Record<string, unknown> | null;

    const base = { ...row };
    delete base.leads;
    delete base.manager;
    delete base.tech;

    const project = base as unknown as ProjectRow;
    return {
      ...project,
      lead_name: leads ? String(leads.name ?? "") : null,
      lead_phone: leads ? String(leads.phone ?? "") : null,
      lead_city: leads ? String(leads.city ?? "") : null,
      manager_name: manager ? String(manager.display_name ?? "") : null,
      manager_phone: manager ? String(manager.phone ?? "") : null,
      tech_name: tech ? String(tech.display_name ?? "") : null,
      tech_phone: tech ? String(tech.phone ?? "") : null,
      health: calculateProjectHealth(project),
    };
  });
}

/** Dashboard stats aggregate for Phase 3 Operations Dashboard. */
export async function getProjectDashboardStats(organizationId?: string | null) {
  const client = db();
  if (!client) return null;

  let query = client
    .from("projects")
    .select(
      "id, current_stage, stage_status, target_completion, actual_completion, contract_amount_inr, amount_received_inr, archived_at, dashboard_visible"
    )
    .is("archived_at", null);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return null;

  const rows = data as Pick<
    ProjectRow,
    | "id"
    | "current_stage"
    | "stage_status"
    | "target_completion"
    | "actual_completion"
    | "contract_amount_inr"
    | "amount_received_inr"
    | "archived_at"
    | "dashboard_visible"
  >[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stageCounts: Record<string, number> = {};
  const healthCounts: Record<string, number> = {
    on_track: 0,
    attention_needed: 0,
    delayed: 0,
    blocked: 0,
  };
  let totalPipelineValue = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let todaysInstallations = 0;
  let nmPending = 0;
  let approvalPending = 0;

  for (const row of rows) {
    // Stage counts
    stageCounts[row.current_stage] = (stageCounts[row.current_stage] ?? 0) + 1;

    // Health counts
    const health = calculateProjectHealth(row);
    healthCounts[health] = (healthCounts[health] ?? 0) + 1;

    // Financial
    const contractVal = Number(row.contract_amount_inr ?? 0);
    const receivedVal = Number(row.amount_received_inr ?? 0);
    totalPipelineValue += contractVal;
    totalReceived += receivedVal;
    totalPending += Math.max(0, contractVal - receivedVal);

    // Operational counts
    if (row.current_stage === "installation" && row.stage_status === "in_progress") {
      todaysInstallations++;
    }
    if (row.current_stage === "net_metering") nmPending++;
    if (row.current_stage === "approval") approvalPending++;
  }

  return {
    total_projects: rows.length,
    stage_counts: stageCounts,
    health_counts: healthCounts,
    total_pipeline_value_inr: totalPipelineValue,
    total_received_inr: totalReceived,
    total_pending_inr: totalPending,
    today_installations: todaysInstallations,
    nm_pending: nmPending,
    approval_pending: approvalPending,
  };
}

// ---------------------------------------------------------------------------
// Installer profiles
// ---------------------------------------------------------------------------

export async function listInstallerProfiles(opts: {
  organizationId: string;
  activeOnly?: boolean;
}): Promise<InstallerProfileRow[]> {
  const client = db();
  if (!client) return [];
  let query = client
    .from("installer_profiles")
    .select("*")
    .eq("organization_id", opts.organizationId);
  if (opts.activeOnly !== false) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query.order("display_name");
  if (error || !Array.isArray(data)) return [];
  return data as InstallerProfileRow[];
}

// ---------------------------------------------------------------------------
// Survey
// ---------------------------------------------------------------------------

export interface ProjectSurveyRow {
  id: string;
  organization_id: string;
  project_id: string;
  surveyed_by_id: string | null;
  survey_date: string | null;
  site_address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  roof_type: string | null;
  roof_area_sqft: number | null;
  shadow_free_sqft: number | null;
  roof_height_ft: number | null;
  roof_condition: string | null;
  roof_orientation: string | null;
  consumer_number: string | null;
  sanction_load_kw: number | null;
  connected_load_kw: number | null;
  meter_type: string | null;
  transformer_distance_m: number | null;
  meter_location: string | null;
  db_location: string | null;
  existing_earthing: boolean;
  available_area_sqft: number | null;
  proposed_capacity_kw: number | null;
  shadow_analysis_note: string | null;
  annual_irradiation: number | null;
  has_dg: boolean;
  dg_kva: number | null;
  battery_required: boolean;
  battery_capacity_kwh: number | null;
  existing_inverter: boolean;
  existing_inverter_kw: number | null;
  project_category: string;
  structure_floor: number | null;
  special_notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProjectSurvey(projectId: string): Promise<ProjectSurveyRow | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("project_site_surveys")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) return null;
  return data as ProjectSurveyRow | null;
}

// ---------------------------------------------------------------------------
// Designs
// ---------------------------------------------------------------------------

export interface ProjectDesignRow {
  id: string;
  organization_id: string;
  project_id: string;
  version_number: number;
  version_label: string | null;
  is_current: boolean;
  created_by_id: string | null;
  revision_notes: string | null;
  system_kw: number | null;
  panel_count: number | null;
  panel_watt: number | null;
  panel_model: string | null;
  inverter_kw: number | null;
  inverter_model: string | null;
  structure_type: string | null;
  string_count: number | null;
  modules_per_string: number | null;
  annual_yield_kwh: number | null;
  performance_ratio: number | null;
  created_at: string;
}

export async function listProjectDesigns(projectId: string): Promise<ProjectDesignRow[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from("project_designs")
    .select("*")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data as ProjectDesignRow[];
}

export async function getNextDesignVersion(projectId: string): Promise<number> {
  const client = db();
  if (!client) return 1;
  const { data } = await client
    .from("project_designs")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? (data as { version_number: number }).version_number + 1 : 1;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface ProjectTaskRow {
  id: string;
  organization_id: string;
  project_id: string;
  stage: string;
  title: string;
  description: string | null;
  is_blocking: boolean;
  status: string;
  assigned_to_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by_id: string | null;
  sort_order: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export async function listProjectTasks(
  projectId: string,
  stageFilter?: string | null
): Promise<ProjectTaskRow[]> {
  const client = db();
  if (!client) return [];
  let query = client
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId);
  if (stageFilter) {
    query = query.eq("stage", stageFilter);
  }
  const { data, error } = await query
    .order("stage")
    .order("sort_order")
    .order("created_at");
  if (error || !Array.isArray(data)) return [];
  return data as ProjectTaskRow[];
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export interface ActivityLogRow {
  id: string;
  organization_id: string;
  project_id: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  metadata_json: Record<string, unknown>;
  created_by_id: string | null;
  created_at: string;
}

export async function listProjectActivity(
  projectId: string,
  opts: { limit?: number; before?: string | null }
): Promise<ActivityLogRow[]> {
  const client = db();
  if (!client) return [];
  let query = client
    .from("project_activity_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(Math.min(100, opts.limit ?? 50));
  if (opts.before) {
    query = query.lt("created_at", opts.before);
  }
  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];
  return data as ActivityLogRow[];
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export interface ProjectCommentRow {
  id: string;
  organization_id: string;
  project_id: string;
  comment: string;
  parent_comment_id: string | null;
  is_pinned: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function listProjectComments(projectId: string): Promise<ProjectCommentRow[]> {
  const client = db();
  if (!client) return [];
  // Pinned first, then by created_at DESC
  const { data, error } = await client
    .from("project_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data as ProjectCommentRow[];
}
