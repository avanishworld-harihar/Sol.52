/**
 * Sol.52 — Phase 3A Operations Dashboard client helpers.
 * Derives urgent rows and payment-due lists from project list + stats API.
 */

import type { ProjectHealth } from "@/lib/project-health";
import { HEALTH_LABELS } from "@/lib/project-health";
import type { ProjectDashboardStats, ProjectListItem } from "@/lib/project-api-client";
import { PROJECT_STAGE_ORDER, STAGE_LABELS, type ProjectStageId } from "@/lib/project-stages";
import { projectDisplayName } from "@/lib/project-list-utils";

export type HealthSegment = {
  id: ProjectHealth;
  label: string;
  count: number;
  pct: number;
  colorClass: string;
};

export type StageSegment = {
  id: ProjectStageId;
  label: string;
  count: number;
  pct: number;
};

const HEALTH_COLORS: Record<ProjectHealth, string> = {
  on_track: "bg-emerald-500",
  attention_needed: "bg-amber-500",
  delayed: "bg-orange-500",
  blocked: "bg-red-500",
};

const HEALTH_RING_COLORS: Record<ProjectHealth, string> = {
  on_track: "#10b981",
  attention_needed: "#f59e0b",
  delayed: "#f97316",
  blocked: "#ef4444",
};

export function buildHealthSegments(
  stats: ProjectDashboardStats | null | undefined
): HealthSegment[] {
  const counts = stats?.health_counts ?? {};
  const total = Object.values(counts).reduce((s, n) => s + (Number(n) || 0), 0);
  const order: ProjectHealth[] = ["on_track", "attention_needed", "delayed", "blocked"];
  return order.map((id) => {
    const count = Number(counts[id] ?? 0);
    return {
      id,
      label: HEALTH_LABELS[id],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      colorClass: HEALTH_COLORS[id],
    };
  });
}

export function buildHealthRingGradient(segments: HealthSegment[]): string {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total <= 0) return "conic-gradient(#e2e8f0 0deg 360deg)";

  let cursor = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    if (seg.count <= 0) continue;
    const sweep = (seg.count / total) * 360;
    const start = cursor;
    const end = cursor + sweep;
    stops.push(`${HEALTH_RING_COLORS[seg.id]} ${start}deg ${end}deg`);
    cursor = end;
  }
  if (stops.length === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
  return `conic-gradient(${stops.join(", ")})`;
}

export function buildStageSegments(
  stats: ProjectDashboardStats | null | undefined
): StageSegment[] {
  const counts = stats?.stage_counts ?? {};
  const total = PROJECT_STAGE_ORDER.reduce(
    (s, stage) => s + (Number(counts[stage] ?? 0) || 0),
    0
  );
  return PROJECT_STAGE_ORDER.map((id) => {
    const count = Number(counts[id] ?? 0);
    return {
      id,
      label: STAGE_LABELS[id],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

export function projectPendingInr(p: ProjectListItem): number {
  const contract = Number(p.contract_amount_inr ?? 0);
  const received = Number(p.amount_received_inr ?? 0);
  return Math.max(0, contract - received);
}

export function pickUrgentProjects(
  projects: ProjectListItem[] | null | undefined,
  limit = 5
): ProjectListItem[] {
  if (!projects?.length) return [];
  const urgent = projects.filter(
    (p) => p.health === "blocked" || p.health === "delayed"
  );
  urgent.sort((a, b) => {
    const rank = (h: ProjectHealth) => (h === "blocked" ? 0 : 1);
    const d = rank(a.health) - rank(b.health);
    if (d !== 0) return d;
    return String(b.updated_at).localeCompare(String(a.updated_at));
  });
  return urgent.slice(0, limit);
}

export function pickPaymentsDue(
  projects: ProjectListItem[] | null | undefined,
  limit = 5
): Array<ProjectListItem & { pending_inr: number; days_until_due: number | null }> {
  if (!projects?.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = projects
    .filter((p) => {
      if (p.current_stage === "completed" || p.actual_completion) return false;
      const pending = projectPendingInr(p);
      if (pending <= 0) return false;
      return Boolean(p.target_completion);
    })
    .map((p) => {
      const target = p.target_completion ? new Date(p.target_completion) : null;
      if (target) target.setHours(0, 0, 0, 0);
      const daysUntilDue =
        target != null
          ? Math.floor((target.getTime() - today.getTime()) / (86400000))
          : null;
      return {
        ...p,
        pending_inr: projectPendingInr(p),
        days_until_due: daysUntilDue,
      };
    });

  rows.sort((a, b) => {
    const da = a.days_until_due ?? 9999;
    const db = b.days_until_due ?? 9999;
    return da - db;
  });

  return rows.slice(0, limit);
}

export function formatDueLabel(days: number | null): string {
  if (days == null) return "No date";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export function projectFilterHref(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `/projects?${qs}` : "/projects";
}

export function urgentProjectSubtitle(p: ProjectListItem): string {
  const name = projectDisplayName(p);
  const code = p.project_code ? ` · ${p.project_code}` : "";
  return `${name}${code}`;
}
