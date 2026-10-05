import { NextRequest, NextResponse } from "next/server";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { listProjects } from "@/lib/project-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;
    const base = { organizationId: scope.organizationId, includeNullOrg: scope.includeUnscopedRows, limit: 5000 };
    const [active, completed] = await Promise.all([
      listProjects({ ...base, view: "active" }),
      listProjects({ ...base, view: "completed" }),
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = completed.filter((p) => p.actual_completion && new Date(p.actual_completion) >= monthStart);
    const cycleDays = completed.map((p) => {
      if (!p.start_date || !p.actual_completion) return null;
      return Math.max(0, Math.round((new Date(p.actual_completion).getTime() - new Date(p.start_date).getTime()) / 86400000));
    }).filter((n): n is number => n != null);
    const completedCapacityKw = completedThisMonth.reduce((sum, p) => sum + (Number.parseFloat(String(p.capacity_kw ?? "0")) || 0), 0);
    const stale = active.filter((p) => (now.getTime() - new Date(p.updated_at).getTime()) / 86400000 > 14).length;
    const managerCounts = new Map<string, number>();
    for (const p of active) managerCounts.set(p.manager_name?.trim() || "Unassigned", (managerCounts.get(p.manager_name?.trim() || "Unassigned") ?? 0) + 1);
    const workload = [...managerCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    return NextResponse.json({ ok: true, data: {
      completed_this_month: completedThisMonth.length,
      completed_capacity_kw: Math.round(completedCapacityKw * 10) / 10,
      average_cycle_days: cycleDays.length ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) : null,
      stale_projects: stale,
      manager_workload: workload,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "reports_failed" }, { status: 500 });
  }
}
