/**
 * Sol.52 — Phase 3A Project API Client.
 *
 * Typed client-side fetch wrappers for all Phase 3 project API routes.
 * Import in React components and hooks — safe for client components.
 * Uses the same response envelope: { ok: boolean; data?: T; error?: string }
 *
 * SWR keys are exported as constants to ensure cache consistency across components.
 */

import type { ProjectHealth } from "@/lib/project-health";

// ---------------------------------------------------------------------------
// SWR cache keys
// ---------------------------------------------------------------------------

export const PROJECT_DASHBOARD_STATS_KEY = "/api/projects/dashboard-stats";

export function projectListKey(opts?: { stage?: string; view?: string }): string {
  const params = new URLSearchParams();
  if (opts?.stage) params.set("stage", opts.stage);
  if (opts?.view) params.set("view", opts.view);
  const qs = params.toString();
  return qs ? `/api/projects/list?${qs}` : "/api/projects/list";
}

export function projectDetailKey(id: string) {
  return `/api/projects/${id}`;
}

export function projectSurveyKey(id: string) {
  return `/api/projects/${id}/survey`;
}

export function projectDesignsKey(id: string) {
  return `/api/projects/${id}/designs`;
}

export function projectTasksKey(id: string, stage?: string) {
  return stage ? `/api/projects/${id}/tasks?stage=${stage}` : `/api/projects/${id}/tasks`;
}

export function projectActivityKey(id: string) {
  return `/api/projects/${id}/activity`;
}

export function projectCommentsKey(id: string) {
  return `/api/projects/${id}/comments`;
}

export const NOTIFICATIONS_UNREAD_KEY = "/api/notifications/unread-count";

// ---------------------------------------------------------------------------
// Response envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network_error" };
  }
}

// ---------------------------------------------------------------------------
// Shared types (mirrors server ProjectDetailRow)
// ---------------------------------------------------------------------------

export interface ProjectListItem {
  id: string;
  lead_id: string | null;
  organization_id: string | null;
  official_name: string | null;
  current_stage: string;
  stage_status: string;
  nm_substatus: string;
  project_code: string | null;
  start_date: string | null;
  target_completion: string | null;
  actual_completion: string | null;
  assigned_manager_id: string | null;
  assigned_tech_id: string | null;
  site_address: string | null;
  roof_type: string | null;
  system_type: string | null;
  panel_brand: string | null;
  inverter_brand: string | null;
  panel_count: number | null;
  structure_type: string | null;
  contract_amount_inr: number | null;
  amount_received_inr: number;
  has_subsidy: boolean;
  // Joined fields
  lead_name: string | null;
  lead_phone: string | null;
  lead_city: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  tech_name: string | null;
  tech_phone: string | null;
  // Computed
  health: ProjectHealth;
  // Legacy
  status: string | null;
  install_progress: number;
  detail: string | null;
  capacity_kw: string | null;
  next_action: string | null;
  dashboard_visible: boolean;
  archived_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface ProjectDashboardStats {
  total_projects: number;
  stage_counts: Record<string, number>;
  health_counts: Record<string, number>;
  total_pipeline_value_inr: number;
  total_received_inr: number;
  total_pending_inr: number;
  today_installations: number;
  nm_pending: number;
  approval_pending: number;
}

export interface ProjectSurvey {
  id: string;
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

export interface ProjectDesign {
  id: string;
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

export interface ProjectTask {
  id: string;
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

export interface ProjectActivityEvent {
  id: string;
  project_id: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  metadata_json: Record<string, unknown>;
  created_by_id: string | null;
  created_at: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  comment: string;
  parent_comment_id: string | null;
  is_pinned: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsUnreadCount {
  count: number;
}

// ---------------------------------------------------------------------------
// API fetch functions (used as SWR fetchers or called directly)
// ---------------------------------------------------------------------------

export async function fetchProjectDashboardStats(): Promise<ProjectDashboardStats | null> {
  const res = await apiRequest<ProjectDashboardStats>(PROJECT_DASHBOARD_STATS_KEY);
  return res.ok ? (res.data ?? null) : null;
}

export async function fetchProjectList(
  url: string
): Promise<ProjectListItem[]> {
  const res = await apiRequest<ProjectListItem[]>(url);
  return res.ok ? (res.data ?? []) : [];
}

export async function fetchProjectDetail(url: string): Promise<ProjectListItem | null> {
  const res = await apiRequest<ProjectListItem>(url);
  return res.ok ? (res.data ?? null) : null;
}

export async function fetchProjectSurvey(url: string): Promise<ProjectSurvey | null> {
  const res = await apiRequest<ProjectSurvey | null>(url);
  return res.ok ? (res.data ?? null) : null;
}

export async function fetchProjectDesigns(url: string): Promise<ProjectDesign[]> {
  const res = await apiRequest<ProjectDesign[]>(url);
  return res.ok ? (res.data ?? []) : [];
}

export async function fetchProjectTasks(url: string): Promise<ProjectTask[]> {
  const res = await apiRequest<ProjectTask[]>(url);
  return res.ok ? (res.data ?? []) : [];
}

export async function fetchProjectActivity(url: string): Promise<ProjectActivityEvent[]> {
  const res = await apiRequest<ProjectActivityEvent[]>(url);
  return res.ok ? (res.data ?? []) : [];
}

export async function fetchProjectComments(url: string): Promise<ProjectComment[]> {
  const res = await apiRequest<ProjectComment[]>(url);
  return res.ok ? (res.data ?? []) : [];
}

export async function fetchNotificationsUnreadCount(): Promise<number> {
  const res = await apiRequest<NotificationsUnreadCount>(NOTIFICATIONS_UNREAD_KEY);
  return res.ok ? (res.data?.count ?? 0) : 0;
}

// ---------------------------------------------------------------------------
// Mutation helpers (called from event handlers, not SWR fetchers)
// ---------------------------------------------------------------------------

export async function advanceProjectStage(
  projectId: string,
  payload: { createdById?: string | null }
): Promise<ApiResponse<ProjectListItem>> {
  return apiRequest<ProjectListItem>(`/api/projects/${projectId}/advance-stage`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchProject(
  projectId: string,
  patch: Partial<Pick<
    ProjectListItem,
    | "current_stage"
    | "stage_status"
    | "nm_substatus"
    | "project_code"
    | "start_date"
    | "target_completion"
    | "assigned_manager_id"
    | "assigned_tech_id"
    | "contract_amount_inr"
    | "amount_received_inr"
    | "has_subsidy"
    | "dashboard_visible"
  > & { archived_at?: string | null | true }>
): Promise<ApiResponse<ProjectListItem>> {
  return apiRequest<ProjectListItem>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function saveSurvey(
  projectId: string,
  data: Partial<Omit<ProjectSurvey, "id" | "project_id" | "created_at" | "updated_at">>,
  isCreate: boolean
): Promise<ApiResponse<ProjectSurvey>> {
  return apiRequest<ProjectSurvey>(`/api/projects/${projectId}/survey`, {
    method: isCreate ? "POST" : "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createDesignVersion(
  projectId: string,
  data: Partial<Omit<ProjectDesign, "id" | "project_id" | "version_number" | "is_current" | "created_at">>
): Promise<ApiResponse<ProjectDesign>> {
  return apiRequest<ProjectDesign>(`/api/projects/${projectId}/designs`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function patchProjectTask(
  projectId: string,
  taskId: string,
  patch: Partial<Pick<ProjectTask, "status" | "assigned_to_id" | "due_date">>
): Promise<ApiResponse<ProjectTask>> {
  return apiRequest<ProjectTask>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function addProjectComment(
  projectId: string,
  data: { comment: string; parent_comment_id?: string | null }
): Promise<ApiResponse<ProjectComment>> {
  return apiRequest<ProjectComment>(`/api/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function toggleCommentPin(
  projectId: string,
  commentId: string,
  isPinned: boolean
): Promise<ApiResponse<ProjectComment>> {
  return apiRequest<ProjectComment>(
    `/api/projects/${projectId}/comments/${commentId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_pinned: isPinned }),
    }
  );
}
