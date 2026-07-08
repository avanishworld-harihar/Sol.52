"use client";

import useSWR from "swr";
import type { CommandCenterPayload } from "@/lib/crm-command-center-types";
import type { ProjectDashboardStats } from "@/lib/project-api-client";

export type NavTabBadges = {
  /** Customers tab — overdue CRM follow-ups */
  customers: number;
  /** Projects tab — blocked + delayed (ops health) */
  projects: number;
};

const SWR_KEY = "nav-tab-badges";

async function fetchNavTabBadges(): Promise<NavTabBadges> {
  const [crmRes, projRes] = await Promise.all([
    fetch("/api/crm/command-center", { cache: "no-store" }),
    fetch("/api/projects/dashboard-stats", { cache: "no-store" }),
  ]);

  let customers = 0;
  let projects = 0;

  if (crmRes.ok) {
    const json = (await crmRes.json()) as { ok?: boolean; data?: CommandCenterPayload };
    if (json.ok && json.data?.kpis) {
      customers = Math.max(0, json.data.kpis.overdue_followups ?? 0);
    }
  }

  if (projRes.ok) {
    const json = (await projRes.json()) as { ok?: boolean; data?: ProjectDashboardStats };
    if (json.ok && json.data?.health_counts) {
      const hc = json.data.health_counts;
      projects =
        Math.max(0, Number(hc.blocked ?? 0) || 0) + Math.max(0, Number(hc.delayed ?? 0) || 0);
    }
  }

  return { customers, projects };
}

export function badgeCountForNavHref(href: string, badges: NavTabBadges): number {
  if (href === "/customers") return badges.customers;
  if (href === "/projects") return badges.projects;
  return 0;
}

export function useNavTabBadges(): NavTabBadges {
  const { data } = useSWR(SWR_KEY, fetchNavTabBadges, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
  return data ?? { customers: 0, projects: 0 };
}
