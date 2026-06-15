"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

type UsagePayload = {
  available: boolean;
  planName: string;
  planCode: string | null;
  status: string | null;
  daysLeft: number | null;
  proposalsUsed: number;
  proposalsLimit: number | null;
  proposalsDisplay: string;
  isUnlimited: boolean;
  showDaysLeft: boolean;
  showUpgrade: boolean;
  upgradePlans: Array<{
    code: string;
    name: string;
    price_inr_monthly: number;
    tagline: string;
  }>;
};

async function fetchUsage(url: string): Promise<UsagePayload | null> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: UsagePayload | null };
  if (!res.ok || !json.ok) return null;
  return json.data ?? null;
}

export function SubscriptionUsageCard() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<UsagePayload | null>(
    "/api/billing/usage",
    fetchUsage,
    { revalidateOnFocus: true, refreshInterval: 60_000 }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-full rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !data?.available) {
    return (
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Usage tracking activates after billing migration is applied.
      </p>
    );
  }

  const pct =
    data.proposalsLimit && data.proposalsLimit > 0
      ? Math.min(100, Math.round((data.proposalsUsed / data.proposalsLimit) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.02]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Plan</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.planName}</p>
            </div>

            {data.showDaysLeft ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Days Left</p>
                <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {data.daysLeft ?? 0}
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Proposals Used</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {data.isUnlimited ? data.proposalsDisplay : data.proposalsDisplay}
              </p>
            </div>
          </div>

          {data.showUpgrade ? (
            <button
              type="button"
              onClick={() => setUpgradeOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Upgrade Plan
              <ChevronDown
                className={cn("h-4 w-4 transition", upgradeOpen && "rotate-180")}
                aria-hidden
              />
            </button>
          ) : null}
        </div>

        {!data.isUnlimited && data.proposalsLimit ? (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct >= 90 ? "bg-amber-500" : pct >= 70 ? "bg-blue-500" : "bg-emerald-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-500">
              {data.proposalsUsed} of {data.proposalsLimit} proposals used
              {pct >= 90 ? " — limit almost reached" : ""}
            </p>
          </div>
        ) : null}
      </div>

      {upgradeOpen && data.upgradePlans.length > 0 ? (
        <div
          id="more-section-billing-plans"
          className="grid gap-2 sm:grid-cols-3"
        >
          {data.upgradePlans.map((plan) => (
            <div
              key={plan.code}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{plan.name}</p>
              <p className="mt-0.5 text-lg font-bold text-blue-600">
                ₹{plan.price_inr_monthly.toLocaleString("en-IN")}
                <span className="text-xs font-medium text-slate-500">/mo</span>
              </p>
              {plan.tagline ? (
                <p className="mt-1 text-[10px] leading-snug text-slate-500">{plan.tagline}</p>
              ) : null}
              <p className="mt-2 text-[10px] font-medium text-slate-400">Online checkout — Phase 2</p>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void mutate()}
        className="text-[10px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:hover:text-slate-300"
      >
        Refresh usage
      </button>
    </div>
  );
}
