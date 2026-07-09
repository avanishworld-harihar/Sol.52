"use client";

/**
 * Ember template — Golden content with Ember dark savings layout.
 * Spacing is driven by `.ember-golden-*` classes in proposal-premium.css.
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
  const accentClass =
    accent === "emerald"
      ? "ember-golden-panel--emerald"
      : accent === "amber"
        ? "ember-golden-panel--amber"
        : "";
  return <div className={`ember-golden-panel ${accentClass} ${className}`.trim()}>{children}</div>;
}

function EmberStack({
  children,
  loose,
}: {
  children: ReactNode;
  loose?: boolean;
}) {
  return <div className={loose ? "ember-golden-stack ember-golden-stack--loose" : "ember-golden-stack"}>{children}</div>;
}

export function EmberGoldenCover({ ctx }: { ctx: BlockRenderContext }) {
  const m = modelFromCtx(ctx);
  const logoUrl = ctx.installerLogoUrl?.trim() || m.brand_logo_url?.trim();

  return (
    <ProposalJourneySection id="cover" noPad className="ember-golden-section proposal-cover-stage">
      <EmberPanel accent="emerald">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={m.brand_display || "Logo"}
                className="mb-5 h-9 w-auto object-contain brightness-110"
              />
            ) : m.brand_display ? (
              <p className="ember-golden-label mb-5">{m.brand_display}</p>
            ) : null}
            <p className="ember-golden-label text-emerald-400">{EP_COPY.cover.kicker}</p>
            <h1 className="ember-golden-cover-title">Personalized Energy Masterplan.</h1>
            <p className="ember-golden-label mt-5">Prepared for</p>
            <p className="mt-1 text-xl font-bold text-white">{m.customer_name}</p>
            <div className="ember-golden-cover-meta">
              <div>
                <p className="ember-golden-label">Estate location</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{m.location_line}</p>
              </div>
              <div>
                <p className="ember-golden-label">Asset profile</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-emerald-300/90">{m.asset_profile_line}</p>
              </div>
            </div>
          </div>
          <Flame className="mt-1 h-9 w-9 shrink-0 text-orange-400/75" aria-hidden />
        </div>
      </EmberPanel>
    </ProposalJourneySection>
  );
}

export function EmberGoldenBill({ ctx }: { ctx: BlockRenderContext }) {
  const { bill } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="bill-audit" noPad className="ember-golden-section">
      <ProposalSectionHeader
        step={1}
        kicker="01 / Electrical Audit"
        title="Your Energy Audit."
        subtitle="What you paid for electricity last year — and where solar saves the most."
      />
      <EmberStack loose>
        <div className="ember-golden-grid-3">
          <EmberPanel accent="amber">
            <p className="ember-golden-label">Summer bill</p>
            <p className="ember-golden-value text-amber-400">{bill.summer_trap_pct}%</p>
            <p className="ember-golden-hint">Paid in Apr–Jul</p>
          </EmberPanel>
          <EmberPanel>
            <p className="ember-golden-label">Fixed liability</p>
            <p className="ember-golden-value">₹{bill.fixed_charges_display}</p>
          </EmberPanel>
          <EmberPanel accent="emerald">
            <p className="ember-golden-label">Solar savings</p>
            <p className="ember-golden-value text-emerald-400">{bill.solar_savings_pct}%</p>
          </EmberPanel>
        </div>

        <div className="ember-golden-chart">
          {bill.months.map((m) => (
            <div key={m.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full max-w-[1.35rem] rounded-t-sm ${m.is_summer_peak ? "bg-amber-500" : "bg-slate-600"}`}
                style={{ height: `${Math.max(m.bar_height_pct, 8)}%` }}
              />
              <span className="text-[0.625rem] font-medium text-slate-500">{m.label}</span>
            </div>
          ))}
        </div>

        <EmberPanel className="!p-0">
          <div className="ember-golden-table-wrap px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
            <table className="ember-golden-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Units</th>
                  <th>Net (₹)</th>
                </tr>
              </thead>
              <tbody>
                {bill.months.map((m) => (
                  <tr key={m.label}>
                    <td className="font-medium text-slate-200">{m.label}</td>
                    <td className="tabular-nums">{m.units}</td>
                    <td className={`tabular-nums font-semibold ${m.highlight_net ? "text-amber-400" : ""}`}>
                      {fmtInr(m.net_inr)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Total</td>
                  <td className="tabular-nums">{bill.totals.units}</td>
                  <td className="tabular-nums text-amber-400">{fmtInr(bill.totals.net_inr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </EmberPanel>
      </EmberStack>
    </ProposalJourneySection>
  );
}

export function EmberGoldenRequirement({ ctx }: { ctx: BlockRenderContext }) {
  const m = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="system-requirement" noPad className="ember-golden-section">
      <ProposalSectionHeader
        step={1}
        kicker="01 / System Design"
        title={EP_COPY.requirement.pageTitle}
        subtitle={EP_COPY.requirement.heroSub}
      />
      <div className="ember-golden-grid-2">
        <EmberPanel accent="emerald">
          <p className="ember-golden-label">{EP_COPY.requirement.heroLabel}</p>
          <p className="ember-golden-value text-emerald-400">{ctx.summary.coverage}%</p>
        </EmberPanel>
        <EmberPanel>
          <p className="ember-golden-label">Proposed system</p>
          <p className="ember-golden-value">{ctx.summary.systemKw} kW</p>
          <p className="ember-golden-hint">{m.asset_profile_line}</p>
        </EmberPanel>
      </div>
    </ProposalJourneySection>
  );
}

export function EmberGoldenEconomics({ ctx }: { ctx: BlockRenderContext }) {
  const { economics } = modelFromCtx(ctx);
  const annualSaving = ctx.summary.annualSaving;

  return (
    <ProposalJourneySection id="economics" noPad className="ember-golden-section">
      <ProposalSectionHeader
        step={2}
        kicker="02 / Capital Allocation"
        title="Your Investment."
        subtitle="Subsidy, payback, and financing — the numbers that matter."
      />
      <EmberStack loose>
        <EmberPanel accent="emerald">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-[12rem] flex-1">
              <p className="ember-golden-label text-emerald-400/90">Estimated annual saving</p>
              <p className="ember-golden-value ember-golden-value--hero">{fmtInrSpaced(annualSaving)}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="ember-golden-label">Payback</p>
              <p className="ember-golden-value">{economics.payback_years} yrs</p>
            </div>
          </div>
        </EmberPanel>

        <div className="ember-golden-grid-2">
          <EmberPanel>
            <div className="space-y-0 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-slate-400">Total system cost</span>
                <span className="font-semibold tabular-nums text-white">{fmtInrSpaced(economics.gross_cost_inr)}</span>
              </div>
              <div className="ember-golden-divider" />
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="flex items-center gap-2 text-slate-400">
                  <TrendingDown className="h-4 w-4 shrink-0 text-emerald-500" />
                  PM Surya Ghar subsidy
                </span>
                <span className="font-semibold tabular-nums text-emerald-400">- {fmtInrSpaced(economics.subsidy_inr)}</span>
              </div>
              <div className="ember-golden-divider" />
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="font-semibold text-amber-300/90">You pay</span>
                <span className="text-lg font-bold tabular-nums text-white">{fmtInrSpaced(economics.net_cost_inr)}</span>
              </div>
            </div>
          </EmberPanel>

          <EmberPanel>
            <p className="ember-golden-label mb-4">Financing options</p>
            <table className="ember-golden-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Interest</th>
                  <th>EMI</th>
                </tr>
              </thead>
              <tbody>
                {economics.emi_rows.map((row) => (
                  <tr key={row.tenure_label}>
                    <td className="text-slate-200">{row.tenure_label}</td>
                    <td className="tabular-nums">{fmtInrSpaced(row.interest_paid_inr)}</td>
                    <td className="tabular-nums font-semibold text-emerald-400">
                      {fmtInrSpaced(row.monthly_emi_inr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EmberPanel>
        </div>
      </EmberStack>
    </ProposalJourneySection>
  );
}

export function EmberGoldenExecution({ ctx }: { ctx: BlockRenderContext }) {
  const { execution } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="commercial" noPad className="ember-golden-section">
      <ProposalSectionHeader
        step={3}
        kicker="03 / Execution & Settlement"
        title="Installation Process."
        subtitle="Payment schedule and secure routing — we handle the paperwork."
      />
      <div className="ember-golden-grid-2">
        <div className="ember-golden-step-list">
          {execution.steps.map((step) => (
            <EmberPanel key={step.num}>
              <div className="ember-golden-step">
                <span className="ember-golden-step-num">{step.num}</span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{step.description}</p>
                </div>
              </div>
            </EmberPanel>
          ))}
        </div>

        <EmberPanel accent="emerald">
          <p className="ember-golden-label mb-4">Payment schedule</p>
          <table className="ember-golden-table">
            <tbody>
              {execution.payments.map((p) => (
                <tr key={p.label}>
                  <td className={p.is_total ? "font-bold text-white" : "text-slate-300"}>
                    {p.label} <span className="text-slate-500">({p.pct_label})</span>
                  </td>
                  <td className={`text-right tabular-nums ${p.is_total ? "font-bold text-white" : ""}`}>
                    {fmtInrSpaced(p.amount_inr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ember-golden-divider mt-5" />
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span className="ember-golden-label !text-slate-400">Bank details</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              <span className="text-slate-500">Beneficiary:</span> {execution.company}
            </p>
            <p className="font-mono leading-relaxed text-slate-200">
              A/C {execution.account_number} · IFSC {execution.ifsc}
            </p>
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2.5 font-mono text-emerald-300">
              UPI: {execution.upi_id}
            </p>
          </div>
        </EmberPanel>
      </div>
    </ProposalJourneySection>
  );
}
