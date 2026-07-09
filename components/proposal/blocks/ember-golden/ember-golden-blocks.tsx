"use client";

/**
 * Ember template — Golden (Executive Premium) content with Ember dark savings styling.
 */

import type { ReactNode } from "react";
import { Flame, TrendingDown, Zap } from "lucide-react";
import type { BlockRenderContext } from "@/lib/proposal-block-context";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";
import { fmtInr, fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { ProposalJourneySection, ProposalSectionHeader } from "@/components/proposal/proposal-journey";

function modelFromCtx(ctx: BlockRenderContext): ExecutivePremiumEditorialModel {
  return ctx.horizonGoldenModel ?? transformToEditorialModel(ctx.pptInput, ctx.summary);
}

function EmberPanel({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: "emerald" | "amber" | "default";
}) {
  const accentBorder =
    accent === "emerald"
      ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
      : accent === "amber"
        ? "border-amber-500/40 ring-1 ring-amber-500/20"
        : "border-slate-700/80";
  return (
    <div
      className={`rounded-2xl border bg-slate-900/90 p-4 shadow-lg shadow-black/20 sm:p-5 ${accentBorder} ${className}`}
    >
      {children}
    </div>
  );
}

export function EmberGoldenCover({ ctx }: { ctx: BlockRenderContext }) {
  const m = modelFromCtx(ctx);
  const logoUrl = ctx.installerLogoUrl?.trim() || m.brand_logo_url?.trim();

  return (
    <ProposalJourneySection id="cover" className="proposal-cover-stage">
      <EmberPanel accent="emerald" className="overflow-hidden p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={m.brand_display || "Logo"} className="mb-6 h-9 w-auto object-contain brightness-110" />
            ) : m.brand_display ? (
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{m.brand_display}</p>
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{EP_COPY.cover.kicker}</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Personalized Energy Masterplan.
            </h1>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prepared for</p>
            <p className="mt-1 text-xl font-bold text-white">{m.customer_name}</p>
            <p className="mt-3 text-sm text-slate-400">{m.location_line}</p>
            <p className="mt-1 text-sm font-medium text-emerald-300/90">{m.asset_profile_line}</p>
          </div>
          <Flame className="h-10 w-10 shrink-0 text-orange-400/80" aria-hidden />
        </div>
      </EmberPanel>
    </ProposalJourneySection>
  );
}

export function EmberGoldenBill({ ctx }: { ctx: BlockRenderContext }) {
  const { bill } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="bill-audit">
      <ProposalSectionHeader
        step={1}
        kicker="01 / Electrical Audit"
        title="Your Energy Audit."
        subtitle="What you paid for electricity last year — and where solar saves the most."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <EmberPanel accent="amber">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summer bill</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-400">{bill.summer_trap_pct}%</p>
          <p className="mt-1 text-xs text-slate-500">Paid in Apr–Jul</p>
        </EmberPanel>
        <EmberPanel>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fixed liability</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">₹{bill.fixed_charges_display}</p>
        </EmberPanel>
        <EmberPanel accent="emerald">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Solar savings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">{bill.solar_savings_pct}%</p>
        </EmberPanel>
      </div>
      <div className="mb-4 flex h-28 items-end gap-1 rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
        {bill.months.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full max-w-[24px] rounded-t ${m.is_summer_peak ? "bg-amber-500" : "bg-slate-600"}`}
              style={{ height: `${m.bar_height_pct}%` }}
            />
            <span className="text-[8px] font-medium text-slate-500">{m.label}</span>
          </div>
        ))}
      </div>
      <EmberPanel className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-xs text-slate-300">
          <thead className="border-b border-slate-700 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 pr-3">Month</th>
              <th className="pb-2 pr-3">Units</th>
              <th className="pb-2 pr-3">Net (₹)</th>
            </tr>
          </thead>
          <tbody>
            {bill.months.map((m) => (
              <tr key={m.label} className="border-b border-slate-800/80">
                <td className="py-2 pr-3 font-medium text-slate-200">{m.label}</td>
                <td className="py-2 pr-3 tabular-nums">{m.units}</td>
                <td className={`py-2 tabular-nums font-semibold ${m.highlight_net ? "text-amber-400" : "text-slate-300"}`}>
                  {fmtInr(m.net_inr)}
                </td>
              </tr>
            ))}
            <tr className="font-bold text-white">
              <td className="pt-2">Total</td>
              <td className="pt-2 tabular-nums">{bill.totals.units}</td>
              <td className="pt-2 tabular-nums text-amber-400">{fmtInr(bill.totals.net_inr)}</td>
            </tr>
          </tbody>
        </table>
      </EmberPanel>
    </ProposalJourneySection>
  );
}

export function EmberGoldenRequirement({ ctx }: { ctx: BlockRenderContext }) {
  const m = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="system-requirement">
      <ProposalSectionHeader
        step={1}
        kicker="01 / System Design"
        title={EP_COPY.requirement.pageTitle}
        subtitle={EP_COPY.requirement.heroSub}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <EmberPanel accent="emerald">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{EP_COPY.requirement.heroLabel}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-400">{ctx.summary.coverage}%</p>
        </EmberPanel>
        <EmberPanel>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proposed system</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">{ctx.summary.systemKw} kW</p>
          <p className="mt-2 text-sm text-slate-400">{m.asset_profile_line}</p>
        </EmberPanel>
      </div>
    </ProposalJourneySection>
  );
}

export function EmberGoldenEconomics({ ctx }: { ctx: BlockRenderContext }) {
  const { economics } = modelFromCtx(ctx);
  const annualSaving = ctx.summary.annualSaving;

  return (
    <ProposalJourneySection id="economics">
      <ProposalSectionHeader
        step={2}
        kicker="02 / Capital Allocation"
        title="Your Investment."
        subtitle="Subsidy, payback, and financing — the numbers that matter."
      />
      <EmberPanel accent="emerald" className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Estimated annual saving</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-400 sm:text-5xl">
              {fmtInrSpaced(annualSaving)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payback</p>
            <p className="text-2xl font-bold tabular-nums text-white">{economics.payback_years} yrs</p>
          </div>
        </div>
      </EmberPanel>
      <div className="grid gap-4 lg:grid-cols-2">
        <EmberPanel>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <span className="text-slate-400">Total system cost</span>
              <span className="font-semibold tabular-nums text-white">{fmtInrSpaced(economics.gross_cost_inr)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2 text-slate-400">
                <TrendingDown className="h-4 w-4 text-emerald-500" />
                PM Surya Ghar subsidy
              </span>
              <span className="font-semibold tabular-nums text-emerald-400">- {fmtInrSpaced(economics.subsidy_inr)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="font-semibold text-amber-300/90">You pay</span>
              <span className="text-lg font-bold tabular-nums text-white">{fmtInrSpaced(economics.net_cost_inr)}</span>
            </div>
          </div>
        </EmberPanel>
        <EmberPanel>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Financing options</p>
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 text-left text-[10px] text-slate-500">
                <th className="pb-2 font-semibold">Plan</th>
                <th className="pb-2 font-semibold">Interest</th>
                <th className="pb-2 font-semibold">EMI</th>
              </tr>
            </thead>
            <tbody>
              {economics.emi_rows.map((row) => (
                <tr key={row.tenure_label} className="border-b border-slate-800/80">
                  <td className="py-2.5 text-slate-200">{row.tenure_label}</td>
                  <td className="py-2.5 tabular-nums">{fmtInrSpaced(row.interest_paid_inr)}</td>
                  <td className="py-2.5 tabular-nums font-semibold text-emerald-400">
                    {fmtInrSpaced(row.monthly_emi_inr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EmberPanel>
      </div>
    </ProposalJourneySection>
  );
}

export function EmberGoldenExecution({ ctx }: { ctx: BlockRenderContext }) {
  const { execution } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="commercial">
      <ProposalSectionHeader
        step={3}
        kicker="03 / Execution & Settlement"
        title="Installation Process."
        subtitle="Payment schedule and secure routing — we handle the paperwork."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {execution.steps.map((step) => (
            <EmberPanel key={step.num} className="!p-3">
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                  {step.num}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{step.description}</p>
                </div>
              </div>
            </EmberPanel>
          ))}
        </div>
        <EmberPanel accent="emerald">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment schedule</p>
          <table className="mt-3 w-full text-xs">
            <tbody>
              {execution.payments.map((p) => (
                <tr key={p.label} className={p.is_total ? "border-t border-slate-600 font-bold text-white" : "border-b border-slate-800 text-slate-300"}>
                  <td className="py-2">
                    {p.label} <span className="text-slate-500">({p.pct_label})</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{fmtInrSpaced(p.amount_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 space-y-2 border-t border-slate-700 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-semibold uppercase tracking-wider">Bank details</span>
            </div>
            <p className="text-slate-300">
              <span className="text-slate-500">Beneficiary:</span> {execution.company}
            </p>
            <p className="font-mono text-slate-200">
              A/C {execution.account_number} · IFSC {execution.ifsc}
            </p>
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 font-mono text-emerald-300">
              UPI: {execution.upi_id}
            </p>
          </div>
        </EmberPanel>
      </div>
    </ProposalJourneySection>
  );
}
