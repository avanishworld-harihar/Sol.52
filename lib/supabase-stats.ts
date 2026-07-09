import { supabase } from "@/lib/supabase";
import { formatPipelineDisplayName, listCustomers, listPipelineProjects } from "@/lib/supabase";

/**
 * When a project has `current_stage` set (Phase 3A model) but `next_action` /
 * `install_progress` are stale (e.g. project was advanced before the sync fix),
 * derive them from the stage so the dashboard card is always accurate.
 */
const STAGE_NEXT_ACTION: Record<string, string> = {
  survey: "Site survey pending",
  design: "Design in progress",
  approval: "Approval pending",
  installation: "Installation in progress",
  net_metering: "Net metering pending",
  completed: "Installation complete",
};
const STAGE_MIN_PROGRESS: Record<string, number> = {
  survey: 5,
  design: 20,
  approval: 38,
  installation: 60,
  net_metering: 82,
  completed: 100,
};

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

type CountResult = { table: string | null; count: number };

async function countTable(table: string): Promise<CountResult> {
  if (!supabase) return { table: null, count: 0 };
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  if (error) return { table: null, count: 0 };
  return { table, count: count ?? 0 };
}

async function countWithFallback(candidates: string[]): Promise<CountResult> {
  let firstReadable: CountResult | null = null;
  for (const table of candidates) {
    const result = await countTable(table);
    if (!result.table) continue;
    if (!firstReadable) firstReadable = result;
    if (result.count > 0) return result;
  }
  return firstReadable ?? { table: null, count: 0 };
}

const KW_COLS = ["installed_kw", "system_kw", "solar_kw", "kw"] as const;
const REV_COLS = ["revenue", "amount", "total_amount", "net_cost", "price"] as const;
const PEND_COLS = ["pending_payment", "pending_amount", "balance_due", "due_amount"] as const;

async function aggregateFromProjects(): Promise<{
  installedKw: number;
  revenue: number;
  pendingPayments: number;
}> {
  if (!supabase) return { installedKw: 0, revenue: 0, pendingPayments: 0 };

  const selectList = [...KW_COLS, ...REV_COLS, ...PEND_COLS].join(",");
  const { data, error } = await supabase.from("projects").select(selectList).limit(250);
  if (error || !data?.length) return { installedKw: 0, revenue: 0, pendingPayments: 0 };

  let installedKw = 0;
  let revenue = 0;
  let pendingPayments = 0;

  for (const raw of data as unknown as Record<string, unknown>[]) {
    for (const c of KW_COLS) {
      if (isNum(raw[c])) {
        installedKw += raw[c];
        break;
      }
    }
    for (const c of REV_COLS) {
      if (isNum(raw[c])) {
        revenue += raw[c];
        break;
      }
    }
    for (const c of PEND_COLS) {
      if (isNum(raw[c])) {
        pendingPayments += raw[c];
        break;
      }
    }
  }

  return { installedKw, revenue, pendingPayments };
}

export type DashboardRecentProject = {
  id: string;
  name: string;
  detail: string;
  capacityKw: string;
  status: "active" | "pending" | "done";
  installProgress: number;
  nextAction?: string | null;
  updatedAt?: string | null;
};

function normalizeProjectStatus(status: string): DashboardRecentProject["status"] {
  const s = status.trim().toLowerCase();
  if (s === "done" || s === "completed" || s === "installed" || s === "closed") return "done";
  if (s === "active" || s === "in_progress" || s === "running") return "active";
  return "pending";
}

function formatCapacity(capacityRaw: string | null): string {
  const capacity = capacityRaw?.trim();
  if (!capacity) return "—";
  if (/kw/i.test(capacity)) return capacity;
  return `${capacity} kW`;
}

async function getRecentActiveProjects(): Promise<DashboardRecentProject[]> {
  const rows = await listPipelineProjects();
  if (!rows.length) return [];

  return rows
    /* In-flight = anything not completed. Matches the Projects "Active" tab so a live
       project (e.g. at "approval" stage with legacy status still "pending") isn't dropped. */
    .filter((row) => normalizeProjectStatus(row.status) !== "done")
    /* Sol.52 CRM v2 — operator can hide a project from the dashboard or soft-archive it. */
    .filter((row) => row.dashboard_visible !== false && !row.archived_at)
    .sort((a, b) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? ""))
    .slice(0, 3)
    .map((row) => {
      const stage = row.current_stage?.trim() ?? "";
      // When current_stage is present, ensure install_progress and next_action
      // reflect the real pipeline position even if the fields weren't updated
      // (pre-fix projects or manual edits that left them stale).
      const stageMinProgress = stage ? (STAGE_MIN_PROGRESS[stage] ?? 0) : 0;
      const rawProgress = Number.isFinite(row.install_progress) ? row.install_progress : 0;
      const inferredProgress = Math.max(rawProgress, stageMinProgress);

      // Override next_action only when it's still the proposal-creation default
      // ("Site survey pending") but the project has moved past survey stage.
      const SURVEY_DEFAULT = "Site survey pending";
      const rawNextAction = row.next_action?.trim() ?? null;
      const nextActionIsStale =
        (!rawNextAction || rawNextAction === SURVEY_DEFAULT) &&
        stage &&
        stage !== "survey";
      const inferredNextAction = nextActionIsStale
        ? (STAGE_NEXT_ACTION[stage] ?? rawNextAction)
        : rawNextAction;

      return {
        id: row.id,
        name: formatPipelineDisplayName(row.official_name, row.lead_name),
        detail: row.detail?.trim() || "Active project",
        capacityKw: formatCapacity(row.capacity_kw),
        status: normalizeProjectStatus(row.status),
        installProgress: inferredProgress,
        nextAction: inferredNextAction,
        updatedAt: row.updated_at,
      };
    });
}

export interface DashboardStatsResult {
  totalLeads: number;
  proposalsSent: number;
  orders: number;
  installedKw: number;
  revenue: number;
  pendingPayments: number;
  recentProjects: DashboardRecentProject[];
  sources: {
    leadsTable: string | null;
    proposalsTable: string | null;
    ordersTable: string | null;
  };
}

export async function getDashboardStatsFast(): Promise<DashboardStatsResult> {
  if (!supabase) {
    return {
      totalLeads: 0,
      proposalsSent: 0,
      orders: 0,
      installedKw: 0,
      revenue: 0,
      pendingPayments: 0,
      recentProjects: [],
      sources: { leadsTable: null, proposalsTable: null, ordersTable: null }
    };
  }

  const [leadsRows, proposalsInfo, ordersInfo, aggregates, recentProjects] = await Promise.all([
    listCustomers(),
    countWithFallback(["proposals"]),
    countWithFallback(["projects"]),
    aggregateFromProjects(),
    getRecentActiveProjects()
  ]);

  return {
    totalLeads: leadsRows.length,
    proposalsSent: proposalsInfo.count,
    orders: ordersInfo.count,
    installedKw: aggregates.installedKw,
    revenue: aggregates.revenue,
    pendingPayments: aggregates.pendingPayments,
    recentProjects,
    sources: {
      leadsTable: leadsRows.length > 0 ? "leads" : null,
      proposalsTable: proposalsInfo.table,
      ordersTable: ordersInfo.table
    }
  };
}
