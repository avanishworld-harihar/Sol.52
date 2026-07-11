"use client";

/**
 * Premium Luxe — warm cream / champagne residential masterplan.
 * ProposalData-native · Tailwind utility layout.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";

export type PremiumLuxeRendererProps = {
  data: ProposalData;
};

function bomByHint(data: ProposalData, hints: RegExp[]) {
  return data.bom.find((b) => hints.some((h) => h.test(`${b.name} ${b.spec} ${b.brand}`)));
}

export function PremiumLuxeRenderer({ data }: PremiumLuxeRendererProps) {
  if (!data) {
    return (
      <div className="bg-[#F8F5F0] p-16 text-[#1F2A36]">Loading Proposal...</div>
    );
  }

  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const clientName = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "Madhya Pradesh";
  const systemSize =
    data.meta.systemKw > 0 ? `${data.meta.systemKw} kW` : "—";
  const systemType =
    data.meta.assetProfileLine?.trim() || "Premium Grid-Architecture";
  const annualGeneration =
    data.closing.annualUnits > 0 ? data.closing.annualUnits : 0;
  const totalCost = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const finalAmount = data.economics.netInr;
  const paybackYears = data.economics.paybackYears;
  const co2Saved = Math.round(data.impact.co2Tons || 0);
  const treesEquivalent = data.impact.treesEquivalent || 0;
  const estimatedSavings =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : data.economics.monthlySavingsInr * 12;

  const panels =
    bomByHint(data, [/panel/i, /module/i, /waaree/i]) || data.bom[0];
  const inverter =
    bomByHint(data, [/inverter/i, /havells/i, /polycab/i]) || data.bom[1];
  const structure =
    bomByHint(data, [/mount/i, /structure/i, /jsw/i]) || data.bom[2];
  const protection =
    bomByHint(data, [/protect/i, /acdb/i, /dcdb/i, /meter/i, /safety/i]) ||
    data.bom[3];

  const hardware = [
    {
      title: "Solar Panels",
      value: panels
        ? [panels.brand, panels.spec].filter(Boolean).join(" · ") || panels.name
        : "Tier-1 DCR modules",
      warranty: panels?.warranty || "25 Years Performance",
      mark: "P",
    },
    {
      title: "String Inverter",
      value: inverter
        ? [inverter.brand, inverter.spec].filter(Boolean).join(" · ") ||
          inverter.name
        : "Grid-tie string inverter",
      warranty: inverter?.warranty || "10 Years",
      mark: "I",
    },
    {
      title: "Mounting Structure",
      value: structure
        ? [structure.brand, structure.spec].filter(Boolean).join(" · ") ||
          structure.name
        : "Hot-dip galvanized structure",
      warranty: structure?.warranty || "10 Years",
      mark: "M",
    },
    {
      title: "Protection & Safety",
      value: protection
        ? [protection.brand, protection.spec].filter(Boolean).join(" · ") ||
          protection.name
        : "DCDB + ACDB with SPD + Copper Earthing",
      warranty: protection?.warranty || "5 Years",
      mark: "S",
    },
  ];

  const warrantyCards =
    data.warranty.highlights.length > 0
      ? data.warranty.highlights.map((h) => ({
          years: h.value,
          label: h.label,
          sub: h.unit,
        }))
      : [
          { years: "30", label: "Years Panel Performance", sub: "≥80% output at year 30" },
          { years: "15", label: "Years Product Warranty", sub: "Manufacturing defects" },
          { years: "10", label: "Years Mounting Structure", sub: "Corrosion & integrity" },
          { years: "1", label: "Year Free AMC", sub: "Full service & support" },
        ];

  const journey =
    data.execution.steps.length > 0
      ? data.execution.steps.slice(0, 4).map((s) => ({
          step: s.num,
          title: s.title,
          desc: s.description,
        }))
      : [
          {
            step: "01",
            title: "Get Started",
            desc: "We handle DISCOM permission & PM Surya Ghar subsidy paperwork",
          },
          {
            step: "02",
            title: "Material Delivery",
            desc: "Tier-1 panels, inverter & structure delivered safely to your home",
          },
          {
            step: "03",
            title: "Rooftop Installation",
            desc: "Expert team completes fitting, wiring, earthing & testing",
          },
          {
            step: "04",
            title: "Go Live",
            desc: "Net meter installation, grid sync & full system handover",
          },
        ];

  const payments =
    data.execution.payments.length > 0
      ? data.execution.payments
      : [
          { label: "Booking (25%)", pctLabel: "25%", amountInr: Math.round(finalAmount * 0.25) },
          { label: "Material (50%)", pctLabel: "50%", amountInr: Math.round(finalAmount * 0.5) },
          { label: "Installation (20%)", pctLabel: "20%", amountInr: Math.round(finalAmount * 0.2) },
          {
            label: "Go Live (5%)",
            pctLabel: "5%",
            amountInr: Math.round(finalAmount * 0.05),
            isTotal: true,
          },
        ];

  const contact =
    data.closing.contactLine?.trim() ||
    "Contact your installer for site survey scheduling.";

  return (
    <div className="bg-[#F8F5F0] text-[#1F2A36] font-sans antialiased print:bg-[#F8F5F0]">
      {/* Hero */}
      <div className="mx-auto max-w-5xl px-8 pb-20 pt-16">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-8 bg-[#B8975E]" />
              <span className="text-sm font-medium tracking-[3px] text-[#B8975E]">
                {brand.toUpperCase()}
              </span>
            </div>
            <h1 className="mb-4 text-5xl font-semibold leading-none tracking-tighter sm:text-6xl lg:text-7xl">
              Your Personalized
              <br />
              Energy Masterplan
            </h1>
            <p className="max-w-lg text-xl text-[#4A5568] sm:text-2xl">
              A premium solar solution designed exclusively for your home
              {location ? ` in ${location.split(",")[0]?.trim()}` : ""}.
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-sm text-[#4A5568]">PREPARED FOR</div>
            <div className="text-3xl font-semibold tracking-tight">{clientName}</div>
            <div className="mt-1 text-[#B8975E]">{location}</div>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-8">
            <div className="mb-2 text-sm tracking-widest text-[#B8975E]">
              ANNUAL CLEAN ENERGY
            </div>
            <div className="text-5xl font-semibold tracking-tighter sm:text-6xl">
              {annualGeneration > 0 ? annualGeneration.toLocaleString("en-IN") : "—"}
            </div>
            <div className="text-xl text-[#4A5568]">units per year</div>
          </div>
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-8">
            <div className="mb-2 text-sm tracking-widest text-[#B8975E]">YOUR SYSTEM</div>
            <div className="text-5xl font-semibold tracking-tighter sm:text-6xl">
              {systemSize}
            </div>
            <div className="text-xl text-[#4A5568]">{systemType}</div>
          </div>
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-8">
            <div className="mb-2 text-sm tracking-widest text-[#B8975E]">
              ESTIMATED SAVINGS / YEAR
            </div>
            <div className="text-5xl font-semibold tracking-tighter sm:text-6xl">
              {estimatedSavings > 0 ? formatInr(estimatedSavings) : "—"}
            </div>
            <div className="text-xl text-[#4A5568]">Directly in your pocket</div>
          </div>
        </div>
      </div>

      {/* Investment */}
      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="mb-10">
          <span className="text-sm tracking-[2px] text-[#B8975E]">02 — THE INVESTMENT</span>
          <h2 className="mt-2 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Smart Capital Allocation
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-10 lg:col-span-3">
            <div className="space-y-8">
              <div className="flex flex-col justify-between gap-4 border-b border-[#EDE6D9] pb-6 sm:flex-row sm:items-end">
                <div>
                  <div className="text-sm text-[#4A5568]">TOTAL SYSTEM COST</div>
                  <div className="text-4xl font-semibold tracking-tighter sm:text-5xl">
                    {totalCost > 0 ? formatInr(totalCost) : "—"}
                  </div>
                </div>
                <div className="text-sm text-[#4A5568] sm:text-right">
                  Premium panels + Inverter
                  <br />
                  + Full installation
                </div>
              </div>

              <div className="flex items-center justify-between text-xl">
                <div>PM Surya Ghar Subsidy</div>
                <div className="font-medium text-emerald-600">
                  {subsidy > 0 ? `− ${formatInr(subsidy)}` : "—"}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#EDE6D9] pt-6">
                <div className="text-xl">Final Amount You Pay</div>
                <div className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {finalAmount > 0 ? formatInr(finalAmount) : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-3xl bg-[#1F2A36] p-10 text-white lg:col-span-2">
            <div>
              <div className="text-sm tracking-widest text-[#B8975E]">PAYBACK PERIOD</div>
              <div className="mt-2 text-[64px] font-semibold leading-none tracking-[-0.04em] sm:text-[72px]">
                {paybackYears > 0 ? paybackYears.toFixed(1) : "—"}{" "}
                <span className="align-super text-4xl">yrs</span>
              </div>
            </div>
            <div className="mt-auto pt-8 text-sm opacity-80">
              Your solar system pays for itself completely through electricity bill
              savings
              {paybackYears > 0 ? ` in just ${paybackYears.toFixed(1)} years` : ""}.
            </div>
          </div>
        </div>
      </div>

      {/* Green legacy */}
      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="mb-10">
          <span className="text-sm tracking-[2px] text-[#B8975E]">03 — YOUR GREEN LEGACY</span>
          <h2 className="mt-2 text-4xl font-semibold tracking-tighter sm:text-5xl">
            What Your Roof Gives Back
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-10 text-center">
            <div className="text-6xl font-semibold tracking-tighter text-[#B8975E] sm:text-7xl">
              {co2Saved > 0 ? co2Saved : "—"}
            </div>
            <div className="mt-2 text-2xl">Tons of CO₂ Eliminated</div>
            <p className="mt-4 text-[#4A5568]">
              Over 25 years by generating 100% clean energy
            </p>
          </div>
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-10 text-center">
            <div className="text-6xl font-semibold tracking-tighter text-[#B8975E] sm:text-7xl">
              {treesEquivalent > 0 ? treesEquivalent.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-2 text-2xl">Trees Equivalent Planted</div>
            <p className="mt-4 text-[#4A5568]">
              The ecological impact of your rooftop over 25 years
            </p>
          </div>
        </div>
      </div>

      {/* Hardware */}
      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="mb-10">
          <span className="text-sm tracking-[2px] text-[#B8975E]">04 — PREMIUM HARDWARE</span>
          <h2 className="mt-2 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Tier-1 Components
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {hardware.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#EDE6D9] bg-white p-8 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F5F0] text-sm font-semibold tracking-wider text-[#B8975E]">
                {item.mark}
              </div>
              <div className="mb-1 text-xl font-semibold">{item.title}</div>
              <div className="mb-4 text-[#4A5568]">{item.value}</div>
              <div className="inline-block rounded-full bg-[#F8F5F0] px-4 py-1 text-sm text-[#B8975E]">
                {item.warranty}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty */}
      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="mb-10">
          <span className="text-sm tracking-[2px] text-[#B8975E]">
            05 — WARRANTY & ASSURANCE
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Complete Peace of Mind
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {warrantyCards.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#EDE6D9] bg-white p-8 text-center"
            >
              <div className="text-5xl font-semibold tracking-tighter text-[#B8975E] sm:text-6xl">
                {item.years}
              </div>
              <div className="mt-3 font-medium">{item.label}</div>
              <div className="mt-1 text-sm text-[#4A5568]">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey */}
      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="mb-10">
          <span className="text-sm tracking-[2px] text-[#B8975E]">06 — YOUR JOURNEY</span>
          <h2 className="mt-2 text-4xl font-semibold tracking-tighter sm:text-5xl">
            From Paperwork to Power
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {journey.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-[#EDE6D9] bg-white p-8"
            >
              <div className="mb-4 text-sm tracking-widest text-[#B8975E]">{item.step}</div>
              <div className="mb-3 text-2xl font-semibold">{item.title}</div>
              <p className="text-[#4A5568]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment & CTA */}
      <div className="mx-auto max-w-5xl px-8 pb-24">
        <div className="rounded-3xl border border-[#EDE6D9] bg-white p-10">
          <div className="grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 text-sm tracking-[2px] text-[#B8975E]">
                PAYMENT SCHEDULE
              </div>
              <div className="space-y-4 text-lg">
                {payments.map((p, i) => (
                  <div
                    key={p.label}
                    className={`flex justify-between gap-4 ${
                      i === payments.length - 1 ? "border-t border-[#EDE6D9] pt-4" : ""
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="font-medium">{formatInr(p.amountInr)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[#EDE6D9] lg:border-l lg:pl-10">
              <div className="mb-3 text-sm tracking-[2px] text-[#B8975E]">NEXT STEP</div>
              <div className="mb-6 text-2xl font-semibold tracking-tight">
                Ready to begin your energy independence journey?
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="rounded-2xl bg-[#1F2A36] px-10 py-4 text-lg font-medium text-white transition-colors hover:bg-black print:hidden"
              >
                Reserve Your Installation Slot
              </button>
              <p className="mt-4 text-sm text-[#4A5568]">
                Our team will contact you within 24 hours to schedule site survey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#EDE6D9] py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-8 text-sm md:flex-row">
          <div>
            <div className="font-medium">{brand}</div>
            <div className="text-[#4A5568]">{contact}</div>
          </div>
          <div className="text-center text-[#4A5568] md:text-right">
            This proposal is valid for 15 days from the date of issue.
            <br />
            We look forward to powering your future.
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumLuxeRenderer;
