import type { LeadSourceKey } from "@/lib/lead-source";
import type { LeadStatusKey } from "@/lib/lead-status";

export const CUSTOMER_INSIGHTS_SWR_KEY = "/api/customers/insights";

export type CustomerInsights = {
  generatedAt: string;
  summary: {
    total: number;
    openLeads: number;
    won: number;
    newThisWeek: number;
    conversionRate: number;
    followupCoverage: number;
    healthScore: number;
    averageMonthlyBill: number;
  };
  attention: {
    overdue: number;
    dueToday: number;
    noNextAction: number;
    dormant: number;
  };
  stages: Array<{ stage: LeadStatusKey; count: number }>;
  sources: Array<{
    source: LeadSourceKey;
    label: string;
    total: number;
    won: number;
    conversionRate: number;
  }>;
  priorityLeads: Array<{
    id: string;
    name: string;
    city: string | null;
    phone: string | null;
    status: LeadStatusKey;
    score: number;
    temperature: "hot" | "warm" | "nurture";
    reason: string;
    nextAction: string;
    dueAt: string | null;
  }>;
  quality: {
    missingPhone: number;
    missingBill: number;
    staleProposals: number;
    untouchedNew: number;
    highValueNoAction: number;
  };
};

export async function fetchCustomerInsights(path: string): Promise<CustomerInsights> {
  const response = await fetch(path, { cache: "no-store" });
  const json = (await response.json()) as { ok?: boolean; data?: CustomerInsights; error?: string };
  if (!response.ok || !json.ok || !json.data) throw new Error(json.error || "Could not load CRM insights.");
  return json.data;
}
