"use client";

/**
 * Horizon template — Golden (Executive Premium) content with Horizon journey styling.
 * Data from transformToEditorialModel; visuals use proposal-journey + proposal-premium CSS.
 */

import { Shield, Sun, TreePine } from "lucide-react";
import type { BlockRenderContext } from "@/lib/proposal-block-context";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";
import { fmtInr, fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import {
  ProposalJourneySection,
  ProposalPanel,
  ProposalSectionHeader,
} from "@/components/proposal/proposal-journey";

function modelFromCtx(ctx: BlockRenderContext): ExecutivePremiumEditorialModel {
  return (
    ctx.horizonGoldenModel ?? transformToEditorialModel(ctx.pptInput, ctx.summary)
  );
}

export function HorizonGoldenCover({ ctx }: { ctx: BlockRenderContext }) {
  const m = modelFromCtx(ctx);
  const logoUrl = ctx.installerLogoUrl?.trim() || m.brand_logo_url?.trim();

  return (
    <ProposalJourneySection id="cover" className="proposal-cover-stage">
      <div className="proposal-panel proposal-panel--surface overflow-hidden p-6 sm:p-10">
        {logoUrl || m.brand_display ? (
          <div className="mb-8">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={m.brand_display || "Company logo"} className="h-10 w-auto object-contain" />
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{m.brand_display}</p>
            )}
          </div>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">{EP_COPY.cover.kicker}</p>
        <h1 className="proposal-journey-title mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Personalized Energy
          <br />
          Masterplan.
        </h1>
        <div className="my-6 h-px w-16 bg-teal-500/60" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prepared Exclusively For</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{m.customer_name}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Estate Location</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{m.location_line}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Asset Profile</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{m.asset_profile_line}</p>
          </div>
        </div>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenBill({ ctx }: { ctx: BlockRenderContext }) {
  const { bill } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="bill-audit">
      <ProposalSectionHeader
        step={1}
        kicker="01 / Electrical Audit"
        title="Your Energy Audit."
        subtitle="A clear breakdown of what you paid for electricity last year based on your MP Smart Billing usage."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <ProposalPanel emphasis="highlight">
          <p className="proposal-hero-ribbon-label">The Summer Bill</p>
          <p className="proposal-hero-ribbon-value text-amber-600">{bill.summer_trap_pct}%</p>
          <p className="proposal-hero-ribbon-hint">Paid in 4 months (Apr–Jul)</p>
        </ProposalPanel>
        <ProposalPanel>
          <p className="proposal-hero-ribbon-label">Fixed Liability</p>
          <p className="proposal-hero-ribbon-value">₹{bill.fixed_charges_display}</p>
          <p className="proposal-hero-ribbon-hint">Mandatory baseline cost</p>
        </ProposalPanel>
        <ProposalPanel>
          <p className="proposal-hero-ribbon-label">Solar Savings</p>
          <p className="proposal-hero-ribbon-value text-emerald-600">{bill.solar_savings_pct}%</p>
          <p className="proposal-hero-ribbon-hint">Estimated bill reduction</p>
        </ProposalPanel>
      </div>
      <div className="mb-6 flex h-36 items-end gap-1 rounded-2xl border border-slate-200 bg-white p-4">
        {bill.months.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full max-w-[28px] rounded-t ${m.is_summer_peak ? "bg-amber-500" : "bg-slate-300"}`}
              style={{ height: `${m.bar_height_pct}%` }}
            />
            <span className="text-[9px] font-medium text-slate-500">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3">Energy (₹)</th>
              <th className="px-4 py-3">Fixed (₹)</th>
              <th className="px-4 py-3">Duty (₹)</th>
              <th className="px-4 py-3">Net Bill (₹)</th>
            </tr>
          </thead>
          <tbody>
            {bill.months.map((m) => (
              <tr key={m.label} className="border-b border-slate-100">
                <td className="px-4 py-2.5 font-medium">{m.label}</td>
                <td className="px-4 py-2.5 tabular-nums">{m.units}</td>
                <td className="px-4 py-2.5 tabular-nums">{fmtInr(m.energy_inr)}</td>
                <td className="px-4 py-2.5 tabular-nums">{fmtInr(m.fixed_inr)}</td>
                <td className="px-4 py-2.5 tabular-nums">{fmtInr(m.duty_inr)}</td>
                <td className={`px-4 py-2.5 tabular-nums font-semibold ${m.highlight_net ? "text-amber-700" : ""}`}>
                  {fmtInr(m.net_inr)}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 tabular-nums">{bill.totals.units}</td>
              <td className="px-4 py-3 tabular-nums">{fmtInr(bill.totals.energy_inr)}</td>
              <td className="px-4 py-3 tabular-nums">{fmtInr(bill.totals.fixed_inr)}</td>
              <td className="px-4 py-3 tabular-nums">{fmtInr(bill.totals.duty_inr)}</td>
              <td className="px-4 py-3 tabular-nums text-amber-700">{fmtInr(bill.totals.net_inr)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenRequirement({ ctx }: { ctx: BlockRenderContext }) {
  const m = modelFromCtx(ctx);
  const coverage = ctx.summary.coverage;

  return (
    <ProposalJourneySection id="system-requirement">
      <ProposalSectionHeader
        step={1}
        kicker="01 / System Design"
        title={EP_COPY.requirement.pageTitle}
        subtitle={EP_COPY.requirement.heroSub}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProposalPanel emphasis="highlight">
          <p className="proposal-hero-ribbon-label">{EP_COPY.requirement.heroLabel}</p>
          <p className="proposal-hero-ribbon-value">{coverage}%</p>
        </ProposalPanel>
        <ProposalPanel>
          <p className="proposal-hero-ribbon-label">Proposed system</p>
          <p className="proposal-hero-ribbon-value">{ctx.summary.systemKw} kW</p>
          <p className="proposal-hero-ribbon-hint">{m.asset_profile_line}</p>
        </ProposalPanel>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenEconomics({ ctx }: { ctx: BlockRenderContext }) {
  const { economics } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="economics">
      <ProposalSectionHeader
        step={2}
        kicker="02 / Capital Allocation"
        title="Your Investment."
        subtitle="How the government subsidy makes this a highly profitable asset for your home."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProposalPanel>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Total System Cost</p>
              <p className="text-xl font-bold tabular-nums">{fmtInrSpaced(economics.gross_cost_inr)}</p>
              <p className="mt-1 text-xs text-slate-500">Includes premium panels, inverter, and full installation.</p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-600">PM Surya Ghar Subsidy</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600">- {fmtInrSpaced(economics.subsidy_inr)}</p>
              <p className="mt-1 text-xs text-slate-500">Government discount applied directly to your project.</p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-amber-700">Final Amount You Pay</p>
              <p className="text-2xl font-bold tabular-nums">{fmtInrSpaced(economics.net_cost_inr)}</p>
              <p className="mt-1 text-xs text-slate-500">Your total out-of-pocket cost.</p>
            </div>
          </div>
        </ProposalPanel>
        <div className="space-y-4">
          <ProposalPanel emphasis="highlight">
            <p className="proposal-hero-ribbon-label">Payback Period</p>
            <p className="proposal-hero-ribbon-value">
              {economics.payback_years} <span className="text-lg">Yrs</span>
            </p>
            <p className="proposal-hero-ribbon-hint">
              The time it takes for the solar system to pay for itself completely through bill savings.
            </p>
          </ProposalPanel>
          <ProposalPanel variant="nested">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Financing Options</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="pb-2 font-semibold">Plan</th>
                  <th className="pb-2 font-semibold">Interest</th>
                  <th className="pb-2 font-semibold">EMI</th>
                </tr>
              </thead>
              <tbody>
                {economics.emi_rows.map((row) => (
                  <tr key={row.tenure_label} className="border-b border-slate-100">
                    <td className="py-2.5">{row.tenure_label}</td>
                    <td className="py-2.5 tabular-nums">{fmtInrSpaced(row.interest_paid_inr)}</td>
                    <td className="py-2.5 tabular-nums font-semibold">{fmtInrSpaced(row.monthly_emi_inr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ProposalPanel>
        </div>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenImpact({ ctx }: { ctx: BlockRenderContext }) {
  const { impact } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="environment">
      <ProposalSectionHeader
        step={3}
        kicker="03 / Ecological Retention"
        title="Your Green Legacy."
        subtitle="What your rooftop gives back to the planet over 25 years by generating 100% clean, emission-free power."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProposalPanel emphasis="highlight">
          <TreePine className="mb-3 h-8 w-8 text-emerald-600" />
          <p className="text-3xl font-bold tabular-nums">{impact.co2_tons.toLocaleString("en-IN")} Tons</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Of CO₂ Eliminated</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            By producing your own solar power, you actively prevent coal power plants from burning fossil fuels on your
            behalf.
          </p>
        </ProposalPanel>
        <ProposalPanel>
          <Sun className="mb-3 h-8 w-8 text-amber-500" />
          <p className="text-3xl font-bold tabular-nums">{impact.trees.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Trees Equivalent Planted</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            To naturally absorb {impact.co2_tons.toLocaleString("en-IN")} Tons of carbon dioxide from the atmosphere,
            you would need to plant a small forest. Your roof achieves the exact same ecological milestone.
          </p>
        </ProposalPanel>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenEngineering({ ctx }: { ctx: BlockRenderContext }) {
  const { engineering } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="technical-bom">
      <ProposalSectionHeader
        step={4}
        kicker="05 / Engineering Design"
        title="Design & Performance."
        subtitle="Engineering parameters for your rooftop system — site latitude, tilt angle, and Indian standards compliance."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {engineering.metrics_rows.map((row) => (
          <ProposalPanel key={row.label} variant={row.highlight ? "surface" : "nested"} emphasis={row.highlight ? "highlight" : "default"}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{row.value}</p>
          </ProposalPanel>
        ))}
      </div>
      <ProposalPanel className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Panel tilt — {engineering.city_label}</p>
        <p className="mt-2 text-4xl font-bold tabular-nums">{engineering.tilt_deg}°</p>
        <p className="mt-2 text-sm text-slate-600">{engineering.tilt_note}</p>
        {engineering.cable_note ? <p className="mt-1 text-xs text-slate-500">{engineering.cable_note}</p> : null}
      </ProposalPanel>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Standards compliance</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {engineering.standards.map((s) => (
          <span key={s} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            {s}
          </span>
        ))}
      </div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Installation process</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {engineering.install_phases.map((p) => (
          <ProposalPanel key={p.num} variant="nested">
            <span className="text-xs font-bold text-teal-600">{p.num}</span>
            <p className="mt-2 text-sm font-bold text-slate-900">{p.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{p.detail}</p>
          </ProposalPanel>
        ))}
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenBom({ ctx }: { ctx: BlockRenderContext }) {
  const { architecture } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="bom">
      <ProposalSectionHeader
        step={5}
        kicker="06 / Hardware Intelligence"
        title="System Parts."
        subtitle="Tier-1 components with full engineering specification — make, standards, and warranty as quoted for your system."
      />
      <div className="space-y-4">
        {architecture.bom_rows.map((row) => (
          <ProposalPanel key={row.name} variant="nested">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-base font-bold text-slate-900">{row.name}</p>
                <p className="mt-1 text-sm font-medium text-teal-700">{row.brand}</p>
                <p className="mt-1 text-xs text-slate-500">{row.warranty}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{row.spec}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {row.technical_points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {row.description ? <p className="mt-2 text-xs text-slate-500">{row.description}</p> : null}
              </div>
            </div>
          </ProposalPanel>
        ))}
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenWarranty({ ctx }: { ctx: BlockRenderContext }) {
  const { warranty } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="amc">
      <ProposalSectionHeader
        step={6}
        kicker="07 / Warranty & Assurance"
        title="Warranty Matrix."
        subtitle={warranty.intro}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {warranty.highlights.map((h) => (
          <ProposalPanel key={h.label} emphasis="highlight">
            <Shield className="mb-2 h-6 w-6 text-teal-600" />
            <p className="text-2xl font-bold tabular-nums">
              {h.value}
              <span className="ml-1 text-sm font-semibold">{h.unit}</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">{h.label}</p>
          </ProposalPanel>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">By</th>
              <th className="px-4 py-3">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {warranty.rows.map((row) => (
              <tr key={row.item} className="border-b border-slate-100">
                <td className="px-4 py-2.5 font-medium">{row.item}</td>
                <td className="px-4 py-2.5">{row.duration}</td>
                <td className="px-4 py-2.5">{row.by}</td>
                <td className="px-4 py-2.5 text-slate-600">{row.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          <strong>Claims:</strong> Contact our service desk for manufacturer defects. Physical damage, vandalism, or
          misuse is excluded.
        </p>
        <p>
          <strong>Your care:</strong> Routine panel cleaning, safe roof access, and internet for remote monitoring
          where applicable.
        </p>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenExecution({ ctx }: { ctx: BlockRenderContext }) {
  const { execution } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="commercial">
      <ProposalSectionHeader
        step={7}
        kicker="08 / Execution & Settlement"
        title="Installation Process."
        subtitle="We handle all the paperwork and hard work so you can simply enjoy free electricity."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {execution.steps.map((step) => (
            <ProposalPanel key={step.num} variant="nested">
              <span className="text-xs font-bold text-teal-600">{step.num}</span>
              <p className="mt-1 text-sm font-bold text-slate-900">{step.title}</p>
              <p className="mt-1 text-sm text-slate-600">{step.description}</p>
            </ProposalPanel>
          ))}
        </div>
        <ProposalPanel>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Payment Schedule</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {execution.payments.map((p) => (
                <tr key={p.label} className={p.is_total ? "border-t-2 border-slate-300 font-bold" : "border-b border-slate-100"}>
                  <td className="py-2.5">
                    {p.label} <span className="text-slate-500">({p.pct_label})</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{fmtInrSpaced(p.amount_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Secure Routing Details</p>
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-500">Beneficiary</p>
              <p className="font-semibold">{execution.company}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Account No.</p>
              <p className="font-mono text-sm">{execution.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">IFSC Code</p>
              <p className="font-mono text-sm">{execution.ifsc}</p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
              <p className="text-xs font-semibold text-teal-800">Express UPI Payment</p>
              <p className="mt-1 font-mono text-sm text-teal-900">{execution.upi_id}</p>
            </div>
          </div>
        </ProposalPanel>
      </div>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenTerms({ ctx }: { ctx: BlockRenderContext }) {
  const { terms } = modelFromCtx(ctx);

  return (
    <ProposalJourneySection id="terms">
      <ProposalSectionHeader
        kicker="09 / Terms & Compliance"
        title="Terms & Conditions"
        subtitle="General terms, documents, and maintenance scope for your installation."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProposalPanel variant="nested">
          <p className="text-sm font-bold text-slate-900">General Terms</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
            {terms.terms_conditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProposalPanel>
        <ProposalPanel variant="nested">
          <p className="text-sm font-bold text-slate-900">Documents Required</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
            {terms.documents_required.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProposalPanel>
        <ProposalPanel variant="nested">
          <p className="text-sm font-bold text-slate-900">Annual Maintenance — Scope</p>
          <p className="mt-2 text-sm text-slate-600">{terms.amc_objective}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
            {terms.amc_scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProposalPanel>
        <ProposalPanel variant="nested">
          <p className="text-sm font-bold text-slate-900">Client&apos;s Scope</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
            {terms.client_scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProposalPanel>
      </div>
      <ProposalPanel className="mt-4">
        <p className="text-sm font-bold text-slate-900">Cost of Maintenance</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{terms.amc_cost_paragraph}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
          {terms.amc_terms.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ProposalPanel>
      <p className="mt-6 text-sm text-slate-600">
        Regards, <span className="font-semibold text-slate-900">{terms.installer_name}</span>
      </p>
    </ProposalJourneySection>
  );
}

export function HorizonGoldenClosing({ ctx }: { ctx: BlockRenderContext }) {
  const { closing } = modelFromCtx(ctx);
  const units = Math.round(closing.annual_units).toLocaleString("en-IN");

  return (
    <ProposalJourneySection id="closing">
      <ProposalPanel emphasis="highlight" className="overflow-hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
          Congratulations{closing.customer_name ? `, ${closing.customer_name}` : ""}
        </p>
        <h2 className="proposal-journey-title mt-3 text-2xl font-bold sm:text-3xl">
          Your roof is ready to start generating.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/20 bg-white/10 p-4">
            <p className="text-3xl font-bold tabular-nums">{units}</p>
            <p className="text-sm font-semibold">Units / Year</p>
            <p className="mt-1 text-xs opacity-80">Clean energy your home produces</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-4">
            <p className="text-3xl font-bold tabular-nums">₹{fmtInr(closing.annual_savings_inr)}</p>
            <p className="text-sm font-semibold">Estimated Savings / Year</p>
            <p className="mt-1 text-xs opacity-80">Money back in your pocket</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Reserve Your Installation</p>
            <p className="mt-2 text-lg font-bold">{closing.installer_name}</p>
            <p className="mt-1 text-sm">{closing.contact_line}</p>
          </div>
          {closing.qr_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={closing.qr_url} alt="Contact / payment QR" className="h-24 w-24 rounded-lg bg-white p-1" />
          ) : null}
        </div>
        <div className="mt-8 grid gap-6 border-t border-white/20 pt-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 h-px w-full bg-current opacity-30" />
            <p className="text-sm font-semibold">Sales Representative</p>
            <p className="text-xs opacity-70">Name & Signature</p>
          </div>
          <div>
            <div className="mb-2 h-px w-full bg-current opacity-30" />
            <p className="text-sm font-semibold">Customer Acceptance</p>
            <p className="text-xs opacity-70">{closing.customer_name || "Signature"} & Date</p>
          </div>
        </div>
      </ProposalPanel>
    </ProposalJourneySection>
  );
}
