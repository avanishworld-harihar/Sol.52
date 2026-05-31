/**
 * Sol.52 — Phase 3A Project Stage definitions.
 *
 * 6-stage model: Survey → Design → Approval → Installation → Net Metering → Completed
 * Single source of truth for stage order, labels, colors, and valid transitions.
 * Used by both server (API routes) and client (UI components).
 */

export const PROJECT_STAGE_ORDER = [
  "survey",
  "design",
  "approval",
  "installation",
  "net_metering",
  "completed",
] as const;

export type ProjectStageId = (typeof PROJECT_STAGE_ORDER)[number];

export type ProjectStageStatus = "not_started" | "in_progress" | "blocked" | "done";

export type NmSubstatus =
  | "not_started"
  | "application_filed"
  | "documents_submitted"
  | "inspection_pending"
  | "meter_installed"
  | "export_enabled";

export const NM_SUBSTATUS_ORDER: NmSubstatus[] = [
  "not_started",
  "application_filed",
  "documents_submitted",
  "inspection_pending",
  "meter_installed",
  "export_enabled",
];

export const STAGE_LABELS: Record<ProjectStageId, string> = {
  survey: "Survey",
  design: "Design",
  approval: "Approval",
  installation: "Installation",
  net_metering: "Net Metering",
  completed: "Completed",
};

export const STAGE_SHORT_LABELS: Record<ProjectStageId, string> = {
  survey: "Survey",
  design: "Design",
  approval: "Approval",
  installation: "Install",
  net_metering: "NM",
  completed: "Done",
};

/** Tailwind color tokens for stage badges */
export const STAGE_COLOR_CLASS: Record<ProjectStageId, string> = {
  survey: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  approval: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  installation: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  net_metering: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export const NM_SUBSTATUS_LABELS: Record<NmSubstatus, string> = {
  not_started: "Not Started",
  application_filed: "Application Filed",
  documents_submitted: "Documents Submitted",
  inspection_pending: "Inspection Pending",
  meter_installed: "Meter Installed",
  export_enabled: "Export Enabled",
};

/** Valid next stage for each current stage. null = terminal (completed). */
const STAGE_NEXT_MAP: Record<ProjectStageId, ProjectStageId | null> = {
  survey: "design",
  design: "approval",
  approval: "installation",
  installation: "net_metering",
  net_metering: "completed",
  completed: null,
};

export function getNextStage(current: ProjectStageId): ProjectStageId | null {
  return STAGE_NEXT_MAP[current] ?? null;
}

export function isValidStageTransition(from: ProjectStageId, to: ProjectStageId): boolean {
  return STAGE_NEXT_MAP[from] === to;
}

export function getStageIndex(stage: ProjectStageId): number {
  return PROJECT_STAGE_ORDER.indexOf(stage);
}

export function isProjectStageId(value: string): value is ProjectStageId {
  return (PROJECT_STAGE_ORDER as readonly string[]).includes(value);
}

export function isNmSubstatus(value: string): value is NmSubstatus {
  return (NM_SUBSTATUS_ORDER as readonly string[]).includes(value);
}

export function isProjectStageStatus(value: string): value is ProjectStageStatus {
  return ["not_started", "in_progress", "blocked", "done"].includes(value);
}
