"use client";

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";

export type QuickRequirementCreateResult = {
  ok: boolean;
  id?: string;
  customerName?: string;
  shareUrl?: string;
  systemKw?: number;
  netCostInr?: number;
  subsidyInr?: number;
  plantGrossInr?: number;
  error?: string;
  code?: string;
};

export async function createQuickRequirementProposal(input: {
  kw: number;
  customerName?: string;
  presetId?: ProposalPresetId;
  leadId?: string | null;
  connectionPhase?: "single_phase" | "three_phase";
}): Promise<QuickRequirementCreateResult> {
  try {
    const body: Record<string, unknown> = { kw: input.kw };
    if (input.customerName?.trim()) body.customerName = input.customerName.trim();
    if (input.presetId) body.presetId = input.presetId;
    if (input.leadId?.trim()) body.leadId = input.leadId.trim();
    if (input.connectionPhase) body.connectionPhase = input.connectionPhase;

    const res = await fetch("/api/proposals/quick-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as QuickRequirementCreateResult & {
      ok?: boolean;
    };
    if (!res.ok || !json.ok || !json.id) {
      return {
        ok: false,
        error: json.error || "quick_requirement_failed",
        code: json.code,
      };
    }
    return {
      ok: true,
      id: json.id,
      customerName: json.customerName,
      shareUrl: json.shareUrl,
      systemKw: json.systemKw,
      netCostInr: json.netCostInr,
      subsidyInr: json.subsidyInr,
      plantGrossInr: json.plantGrossInr,
    };
  } catch {
    return { ok: false, error: "quick_requirement_failed" };
  }
}
