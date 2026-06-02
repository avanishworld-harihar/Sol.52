/**
 * Phase 3A-5 app-layer permissions (service-role API era).
 * Phase 5 will replace with JWT-scoped RLS.
 */

import type { ProjectRow } from "@/lib/project-store";

export type InstallerPermissionRole = "owner" | "admin" | "manager" | "technician";

export type ProjectDocumentAction =
  | "list"
  | "download"
  | "upload"
  | "update_meta"
  | "delete";

export type PermissionContext = {
  actorRole?: InstallerPermissionRole | null;
  actorProfileId?: string | null;
  project: Pick<ProjectRow, "assigned_manager_id" | "assigned_tech_id">;
};

function roleRank(role: InstallerPermissionRole): number {
  switch (role) {
    case "owner":
      return 4;
    case "admin":
      return 3;
    case "manager":
      return 2;
    case "technician":
      return 1;
    default:
      return 0;
  }
}

function isAssignedToProject(ctx: PermissionContext): boolean {
  const id = ctx.actorProfileId?.trim();
  if (!id) return false;
  return (
    ctx.project.assigned_manager_id === id ||
    ctx.project.assigned_tech_id === id
  );
}

/**
 * When actor_role is omitted (legacy anon APIs), allow the action.
 */
export function assertProjectDocumentPermission(
  action: ProjectDocumentAction,
  ctx: PermissionContext
): { ok: true } | { ok: false; error: string } {
  const role = ctx.actorRole;
  if (!role) return { ok: true };

  const rank = roleRank(role);

  switch (action) {
    case "list":
    case "download":
      if (rank >= 1) return { ok: true };
      return { ok: false, error: "forbidden" };

    case "upload":
      if (rank >= 2) return { ok: true };
      if (role === "technician") {
        // Until Team module: technicians may upload org-wide; prefer assignment when set.
        if (!ctx.actorProfileId || isAssignedToProject(ctx) || !ctx.project.assigned_tech_id) {
          return { ok: true };
        }
        return { ok: false, error: "forbidden_not_assigned" };
      }
      return { ok: false, error: "forbidden" };

    case "update_meta":
    case "delete":
      if (rank >= 2) return { ok: true };
      return { ok: false, error: "forbidden" };

    default:
      return { ok: false, error: "forbidden" };
  }
}

export function parseInstallerPermissionRole(
  value: string | null | undefined
): InstallerPermissionRole | null {
  if (
    value === "owner" ||
    value === "admin" ||
    value === "manager" ||
    value === "technician"
  ) {
    return value;
  }
  return null;
}
