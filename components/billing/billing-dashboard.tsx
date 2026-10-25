"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

export type BillingUsagePayload = {
  available: boolean;
  planName: string;
  planCode: string | null;
  status: string | null;
  statusLabel: string;
  daysLeft: number | null;
  trialDaysRemainingLabel: string | null;
  proposalsUsed: number;
  proposalsLimit: number | null;
  proposalsDisplay: string;
  proposalsLimitLabel: string;
  isUnlimited: boolean;
  showDaysLeft: boolean;
  showUpgrade: boolean;
  isComplimentary: boolean;
  complimentaryExpiresAt: string | null;
  complimentaryGrantedBy: string | null;
  complimentaryReason: string | null;
  billingInterval: "monthly" | "yearly" | null;
  currentPeriodEnd: string | null;
  upgradePlans: Array<{
    code: string;
    name: string;
    price_inr_monthly: number;
    price_inr_yearly: number | null;
    tagline: string;
    monthlyCheckoutEnabled: boolean;
    yearlyCheckoutEnabled: boolean;
  }>;
};

async function fetchUsage(url: string): Promise<BillingUsagePayload | null> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: BillingUsagePayload | null };
  if (!res.ok || !json.ok) return null;
  return json.data ?? null;
}

type Props = {
  /** Compact card for More page; full layout for Billing page. */
  variant?: "card" | "page";
};

export function BillingDashboard({ variant = "page" }: Props) {
  const [upgradeOpen, setUpgradeOpen] = useState(variant === "page");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<BillingUsagePayload | null>(
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

  const isPage = variant === "page";

  async function startCheckout(planCode: string) {
    setCheckoutPlan(planCode);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, interval }),
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { checkoutUrl?: string };
      };
      if (!response.ok || !json.ok || !json.data?.checkoutUrl) {
        throw new Error(json.error || "Could not start secure checkout.");
      }
      window.location.assign(json.data.checkoutUrl);
    } catch (checkoutFailure) {
      setCheckoutError(
        checkoutFailure instanceof Error ? checkoutFailure.message : "Could not start secure checkout."
      );
      setCheckoutPlan(null);
    }
  }

  return (
    <div className={cn("space-y-4", isPage && "space-y-6")}>
      <div
        className={cn(
          "rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.02]",
          isPage ? "p-6 sm:p-8" : "p-4"
        )}
      >
        <div className={cn("flex flex-wrap items-start justify-between gap-4", isPage && "gap-6")}>
          <div className={cn("grid gap-4", isPage ? "sm:grid-cols-2 lg:grid-cols-4 sm:gap-6" : "space-y-3")}>
            <MetricBlock label="Current Plan" value={data.planName} large={isPage} />
            <MetricBlock label="Subscription Status" value={data.statusLabel} large={isPage} />
            {data.billingInterval ? (
              <MetricBlock
                label="Billing Cycle"
                value={data.billingInterval === "yearly" ? "Annual" : "Monthly"}
                sub={data.currentPeriodEnd ? `Current period ends ${new Date(data.currentPeriodEnd).toLocaleDateString("en-IN")}` : undefined}
                large={isPage}
              />
            ) : null}
            {data.showDaysLeft ? (
              <MetricBlock
                label="Trial Days Remaining"
                value={String(data.daysLeft ?? 0)}
                sub={data.trialDaysRemainingLabel ?? undefined}
                large={isPage}
                accent
              />
            ) : null}
            <MetricBlock
              label="Proposal Usage"
              value={data.proposalsDisplay}
              sub={
                data.isUnlimited
                  ? "Unlimited proposals"
                  : `${data.proposalsUsed} of ${data.proposalsLimitLabel} used`
              }
              large={isPage}
            />
            {!data.isUnlimited ? (
              <MetricBlock label="Proposal Limit" value={data.proposalsLimitLabel} large={isPage} />
            ) : null}
          </div>

          {data.showUpgrade ? (
            <button
              type="button"
              onClick={() => setUpgradeOpen((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
          <div className={cn("mt-4", isPage && "mt-6")}>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct >= 100 ? "bg-red-500" : pct >= 90 ? "bg-amber-500" : pct >= 70 ? "bg-blue-500" : "bg-emerald-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">
              {data.proposalsDisplay}
              {data.showDaysLeft && data.trialDaysRemainingLabel
                ? ` · ${data.trialDaysRemainingLabel}`
                : ""}
              {pct >= 100 ? " — limit reached" : pct >= 90 ? " — limit almost reached" : ""}
            </p>
          </div>
        ) : null}
      </div>

      {data.isComplimentary ? (
        <div className="rounded-xl border border-violet-200/80 bg-violet-50/60 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-950/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            Complimentary access
          </p>
              <p className="mt-1 text-[11px] text-violet-700/80 dark:text-violet-300/80">
                {data.trialDaysRemainingLabel ?? (data.complimentaryExpiresAt ? `Ends ${new Date(data.complimentaryExpiresAt).toLocaleDateString("en-IN")}` : "Active")}
              </p>
        </div>
      ) : null}

      {data.status === "past_due" ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-950/30">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Payment needs attention</p>
          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
            Razorpay could not renew this subscription. Access remains available during the grace period; contact SOL.52 support to update the mandate.
          </p>
        </div>
      ) : null}

      {upgradeOpen && data.upgradePlans.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
              {(["monthly", "yearly"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInterval(value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                    interval === value
                      ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white"
                      : "text-slate-500"
                  )}
                >
                  {value === "yearly" ? "Annual" : "Monthly"}
                </button>
              ))}
            </div>
            {interval === "yearly" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Two months free
              </span>
            ) : null}
          </div>

          {checkoutError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-300">
              {checkoutError}
            </div>
          ) : null}

          <div className={cn("grid gap-3", isPage ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3")}>
            {data.upgradePlans.map((plan) => {
              const annual = interval === "yearly" && plan.price_inr_yearly != null;
              const price = annual ? plan.price_inr_yearly! : plan.price_inr_monthly;
              const checkoutEnabled = interval === "yearly"
                ? plan.yearlyCheckoutEnabled
                : plan.monthlyCheckoutEnabled;
              const effectiveMonthly = annual ? Math.round(price / 12) : price;
              const busy = checkoutPlan === plan.code;
              return (
                <div
                  key={plan.code}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{plan.name}</p>
                  <p className="mt-0.5 text-lg font-bold text-blue-600">
                    ₹{effectiveMonthly.toLocaleString("en-IN")}
                    <span className="text-xs font-medium text-slate-500">/mo</span>
                  </p>
                  {annual ? (
                    <p className="text-[10px] font-medium text-slate-500">
                      ₹{price.toLocaleString("en-IN")} billed annually
                    </p>
                  ) : null}
                  {plan.tagline ? (
                    <p className="mt-2 text-[11px] leading-snug text-slate-500">{plan.tagline}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={!checkoutEnabled || checkoutPlan !== null}
                    onClick={() => void startCheckout(plan.code)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {busy ? "Opening checkout…" : checkoutEnabled ? "Choose plan" : "Online checkout unavailable"}
                  </button>
                </div>
              );
            })}
          </div>
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

function MetricBlock({
  label,
  value,
  sub,
  large,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  large?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          "font-bold tabular-nums",
          large ? "mt-1 text-2xl sm:text-3xl" : "text-lg",
          accent ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-slate-100"
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] font-medium text-slate-500">{sub}</p> : null}
    </div>
  );
}
