/**
 * Sol.52 — Phase 3A Project Health Calculation.
 *
 * Health is computed at read-time — no DB column required.
 * Rules (evaluated in priority order):
 *   1. Blocked         → stage_status = 'blocked'
 *   2. On Track        → current_stage = 'completed' OR actual_completion set
 *   3. Delayed         → target_completion < today AND project not completed
 *   4. Attention Needed → target_completion within 7 days
 *   5. On Track        → default
 */

export type ProjectHealth = "on_track" | "attention_needed" | "delayed" | "blocked";

export const HEALTH_LABELS: Record<ProjectHealth, string> = {
  on_track: "On Track",
  attention_needed: "Attention Needed",
  delayed: "Delayed",
  blocked: "Blocked",
};

/** Tailwind text color tokens */
export const HEALTH_COLOR_CLASS: Record<ProjectHealth, string> = {
  on_track: "text-emerald-600 dark:text-emerald-400",
  attention_needed: "text-amber-600 dark:text-amber-400",
  delayed: "text-orange-600 dark:text-orange-400",
  blocked: "text-red-600 dark:text-red-400",
};

/** Tailwind background dot tokens */
export const HEALTH_DOT_CLASS: Record<ProjectHealth, string> = {
  on_track: "bg-emerald-500",
  attention_needed: "bg-amber-500",
  delayed: "bg-orange-500",
  blocked: "bg-red-500",
};

export interface HealthInput {
  stage_status: string;
  current_stage: string;
  target_completion: string | null;
  actual_completion: string | null;
}

export function calculateProjectHealth(project: HealthInput): ProjectHealth {
  if (project.stage_status === "blocked") return "blocked";

  if (project.current_stage === "completed" || project.actual_completion != null) {
    return "on_track";
  }

  if (!project.target_completion) return "on_track";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(project.target_completion);
  target.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.floor((target.getTime() - today.getTime()) / msPerDay);

  if (daysUntilDue < 0) return "delayed";
  if (daysUntilDue <= 7) return "attention_needed";
  return "on_track";
}

/** Batch health calculation for a list of projects */
export function enrichWithHealth<T extends HealthInput>(projects: T[]): (T & { health: ProjectHealth })[] {
  return projects.map((p) => ({ ...p, health: calculateProjectHealth(p) }));
}
