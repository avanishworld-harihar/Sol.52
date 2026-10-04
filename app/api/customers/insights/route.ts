import { NextRequest, NextResponse } from "next/server";

import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { normalizeLeadStatus, type LeadStatusKey } from "@/lib/lead-status";
import { normalizeSource, SOURCE_META, type LeadSourceKey } from "@/lib/lead-source";
import { batchNextFollowups, listCustomerInsightRows } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const STAGES: LeadStatusKey[] = ["new", "contacted", "proposal-sent", "site-survey", "design", "won"];

function istDateKey(value: Date) {
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

type PendingFollowup = { due_at: string; title: string } | undefined;

function scoreLead(
  row: Awaited<ReturnType<typeof listCustomerInsightRows>>[number],
  status: LeadStatusKey,
  reminder: PendingFollowup,
  now: Date
) {
  const stagePoints: Record<LeadStatusKey, number> = {
    new: 20,
    contacted: 35,
    "proposal-sent": 60,
    "site-survey": 70,
    design: 80,
    won: 100,
  };
  let score = stagePoints[status];
  const bill = Number(row.monthly_bill ?? 0);
  if (bill >= 10_000) score += 18;
  else if (bill >= 5_000) score += 12;
  else if (bill >= 2_000) score += 6;
  if (row.phone?.trim()) score += 4;

  const lastTouch = Date.parse(row.last_touched_at ?? row.created_at ?? "");
  const ageMs = Number.isFinite(lastTouch) ? now.getTime() - lastTouch : Number.POSITIVE_INFINITY;
  if (ageMs <= 3 * 86_400_000) score += 10;
  else if (ageMs <= 7 * 86_400_000) score += 6;
  else if (ageMs > 30 * 86_400_000) score -= 10;

  let dueAt: string | null = null;
  let dueState: "overdue" | "today" | "future" | "none" = "none";
  if (reminder) {
    dueAt = reminder.due_at;
    const due = new Date(reminder.due_at);
    if (!Number.isNaN(due.getTime())) {
      const dueKey = istDateKey(due);
      if (dueKey === istDateKey(now)) {
        dueState = "today";
        score += 12;
      } else if (due.getTime() < now.getTime()) {
        dueState = "overdue";
        score += 15;
      } else {
        dueState = "future";
        score += 5;
      }
    }
  } else {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const temperature = score >= 72 ? "hot" : score >= 45 ? "warm" : "nurture";
  const reason = status === "design"
    ? "Design-stage opportunity"
    : status === "site-survey"
      ? "Survey-stage opportunity"
      : status === "proposal-sent"
        ? "Proposal decision pending"
        : bill >= 10_000
          ? "High monthly bill"
          : bill >= 5_000
            ? "Strong bill potential"
            : status === "contacted"
              ? "Contact established"
              : "New opportunity";
  const nextAction = dueState === "overdue"
    ? "Recover overdue callback"
    : dueState === "today"
      ? "Complete today’s callback"
      : !row.phone?.trim()
        ? "Add phone number"
        : dueState === "none" && status === "proposal-sent"
          ? "Schedule proposal decision call"
          : dueState === "none" && status === "new"
            ? "Make first contact"
            : dueState === "none"
              ? "Schedule the next action"
              : "Prepare for scheduled callback";

  return { score, temperature, reason, nextAction, dueAt, ageMs } as const;
}

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;

    const rows = await listCustomerInsightRows({
      organizationId: scope.organizationId,
      includeNullOrg: scope.includeUnscopedRows,
    });
    const leadIds = rows.map((row) => row.id).filter(Boolean);
    const leadChunks = Array.from({ length: Math.ceil(leadIds.length / 200) }, (_, index) =>
      leadIds.slice(index * 200, index * 200 + 200)
    );
    const followupMaps: Array<Awaited<ReturnType<typeof batchNextFollowups>>> = [];
    // Cap database concurrency; analytics must never starve interactive CRM reads.
    for (let index = 0; index < leadChunks.length; index += 5) {
      followupMaps.push(...await Promise.all(leadChunks.slice(index, index + 5).map(batchNextFollowups)));
    }
    const nextFollowups = Object.assign({}, ...followupMaps) as Awaited<ReturnType<typeof batchNextFollowups>>;

    const now = new Date();
    const todayKey = istDateKey(now);
    const sevenDaysAgo = now.getTime() - 7 * 86_400_000;
    const fourteenDaysAgo = now.getTime() - 14 * 86_400_000;
    const stages = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<LeadStatusKey, number>;
    const sources = new Map<LeadSourceKey, { total: number; won: number }>();
    let overdue = 0;
    let dueToday = 0;
    let noNextAction = 0;
    let dormant = 0;
    let newThisWeek = 0;
    let totalMonthlyBill = 0;
    let missingPhone = 0;
    let missingBill = 0;
    let staleProposals = 0;
    let untouchedNew = 0;
    let highValueNoAction = 0;
    const priorityLeads: Array<{
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
    }> = [];

    for (const row of rows) {
      const status = normalizeLeadStatus(row.status);
      stages[status] += 1;
      const source = normalizeSource(row.source);
      const sourceStats = sources.get(source) ?? { total: 0, won: 0 };
      sourceStats.total += 1;
      if (status === "won") sourceStats.won += 1;
      sources.set(source, sourceStats);

      const bill = Number(row.monthly_bill ?? 0);
      if (Number.isFinite(bill) && bill > 0) totalMonthlyBill += bill;
      const createdAt = Date.parse(row.created_at ?? "");
      if (Number.isFinite(createdAt) && createdAt >= sevenDaysAgo) newThisWeek += 1;

      const lastTouch = Date.parse(row.last_touched_at ?? row.created_at ?? "");
      if (status !== "won" && Number.isFinite(lastTouch) && lastTouch < fourteenDaysAgo) dormant += 1;

      if (status === "won") continue;

      const reminder = nextFollowups[row.id];
      const scored = scoreLead(row, status, reminder, now);
      priorityLeads.push({
        id: row.id,
        name: row.name,
        city: row.city,
        phone: row.phone,
        status,
        score: scored.score,
        temperature: scored.temperature,
        reason: scored.reason,
        nextAction: scored.nextAction,
        dueAt: scored.dueAt,
      });
      if (!row.phone?.trim()) missingPhone += 1;
      if (!(Number(row.monthly_bill ?? 0) > 0)) missingBill += 1;
      if (status === "proposal-sent" && scored.ageMs > 7 * 86_400_000) staleProposals += 1;
      if (status === "new" && scored.ageMs > 86_400_000 && !reminder) untouchedNew += 1;
      if (bill >= 5_000 && !reminder) highValueNoAction += 1;
      if (!reminder) {
        noNextAction += 1;
        continue;
      }
      const due = new Date(reminder.due_at);
      if (Number.isNaN(due.getTime())) continue;
      const dueKey = istDateKey(due);
      if (dueKey === todayKey) dueToday += 1;
      else if (due.getTime() < now.getTime()) overdue += 1;
    }

    const total = rows.length;
    const won = stages.won;
    const openLeads = Math.max(0, total - won);
    const scheduledOpen = Math.max(0, openLeads - noNextAction);
    const followupCoverage = openLeads > 0 ? Math.round((scheduledOpen / openLeads) * 100) : 100;
    const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;
    const overdueRate = openLeads > 0 ? overdue / openLeads : 0;
    const healthScore = Math.max(0, Math.min(100, Math.round(followupCoverage * 0.7 + (1 - overdueRate) * 30)));

    return NextResponse.json({
      ok: true,
      data: {
        generatedAt: now.toISOString(),
        summary: {
          total,
          openLeads,
          won,
          newThisWeek,
          conversionRate,
          followupCoverage,
          healthScore,
          averageMonthlyBill: total > 0 ? Math.round(totalMonthlyBill / total) : 0,
        },
        attention: { overdue, dueToday, noNextAction, dormant },
        stages: STAGES.map((stage) => ({ stage, count: stages[stage] })),
        sources: [...sources.entries()]
          .map(([source, stats]) => ({
            source,
            label: SOURCE_META[source].label,
            total: stats.total,
            won: stats.won,
            conversionRate: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total),
        priorityLeads: priorityLeads
          .sort((a, b) => b.score - a.score || String(a.dueAt ?? "").localeCompare(String(b.dueAt ?? "")))
          .slice(0, 8),
        quality: { missingPhone, missingBill, staleProposals, untouchedNew, highValueNoAction },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load CRM insights." },
      { status: 500 }
    );
  }
}
