"use client";

/**
 * Premium Luxe / Atelier — warm cream A4 masterplan (print-ready).
 * ProposalData-native · Tailwind layout.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import styles from "./premium-luxe.module.css";

export type PremiumLuxeRendererProps = {
  data: ProposalData;
};

function bomByHint(data: ProposalData, hints: RegExp[]) {
  return data.bom.find((b) => hints.some((h) => h.test(`${b.name} ${b.spec} ${b.brand}`)));
}

function bomLine(item: ProposalData["bom"][number] | undefined, fallback: string) {
  if (!item) return fallback;
  const parts = [item.brand, item.spec].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : item.name || fallback;
}

export function PremiumLuxeRenderer({ data }: PremiumLuxeRendererProps) {
  if (!data) {
    return (
      <div className="bg-[#FAF7F2] p-16 text-[#1C2526]">Loading Proposal...</div>
    );
  }

  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const clientName = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "Madhya Pradesh";
  const locationPill =
    location.split(",")[0]?.trim() || location || "Madhya Pradesh";
  const systemKw = data.meta.systemKw;
  const systemSize = systemKw > 0 ? `${systemKw} kW` : "—";
  const systemType =
    data.meta.assetProfileLine?.trim() || "Premium Grid Architecture";
  const annualGeneration =
    data.closing.annualUnits > 0 ? data.closing.annualUnits : 0;
  const totalCost = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const finalAmount = data.economics.netInr;
  const paybackYears = data.economics.paybackYears;
  const co2Tons = Math.round(data.impact.co2Tons || 0);
  const trees = data.impact.treesEquivalent || 0;
  const estimatedSavings =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : data.economics.monthlySavingsInr * 12;
  const tilt = data.engineering.tiltDeg ?? 20;
  const tiltLabel =
    data.engineering.tiltNote?.trim() ||
    (data.engineering.cityLabel
      ? `Panel Tilt (${data.engineering.cityLabel})`
      : `Panel Tilt (${locationPill})`);

  const panels = bomByHint(data, [/panel/i, /module/i, /waaree/i]) || data.bom[0];
  const inverter =
    bomByHint(data, [/inverter/i, /havells/i, /polycab/i]) || data.bom[1];
  const structure =
    bomByHint(data, [/mount/i, /structure/i, /jsw/i]) || data.bom[2];
  const protection =
    bomByHint(data, [/protect/i, /acdb/i, /dcdb/i, /meter/i, /safety/i]) ||
    data.bom[3];

  const engMetrics =
    data.engineering.metrics.length > 0
      ? data.engineering.metrics.slice(0, 8).map((m) => [m.label, m.value] as const)
      : ([
          ["DC Capacity", systemKw > 0 ? `${(systemKw * 1.04).toFixed(2)} kWp` : "—"],
          ["AC Capacity", systemSize],
          ["DC/AC Ratio", "1.04"],
          ["Peak Sun Hours", "5 hrs/day"],
          ["Performance Ratio", "75%"],
          ["Specific Yield", "1440 kWh/kWp/yr"],
          [
            "Annual Generation",
            annualGeneration > 0
              ? `${annualGeneration.toLocaleString("en-IN")} units`
              : "—",
          ],
          [tiltLabel, `${tilt}°`],
        ] as const);

  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards.join(" · ")
      : "IEC 61215 / IEC 61730 · BIS IS 14286 · MNRE ALMM · IEC 62109 · IS 3043 (Earthing) · IS/IEC 62446";

  const installJourney =
    data.engineering.phases.length > 0
      ? data.engineering.phases.map((p) => p.title)
      : [
          "Site Survey & Load Check",
          "Design & Single Line Diagram",
          "DISCOM & Subsidy Paperwork",
          "Material Delivery",
          "Rooftop Installation & Testing",
          "Net Metering & Handover",
        ];

  const hardware = [
    {
      mark: "P",
      title: "Solar Panels",
      desc: bomLine(panels, "Tier-1 DCR TOPCon modules"),
      warranty: panels?.warranty || "30 Years Performance Warranty",
    },
    {
      mark: "I",
      title: "String Inverter",
      desc: bomLine(inverter, "Grid-tie string inverter (Dual MPPT)"),
      warranty: inverter?.warranty || "10 Years Warranty",
    },
    {
      mark: "M",
      title: "Mounting Structure",
      desc: bomLine(structure, "Hot-dip galvanized GI structure"),
      warranty: structure?.warranty || "10 Years Structural Warranty",
    },
    {
      mark: "S",
      title: "Protection & Safety",
      desc: bomLine(
        protection,
        "DCDB + ACDB with SPD, MCB/MCCB & Copper Earthing"
      ),
      warranty: protection?.warranty || "5 Years",
    },
  ];

  const warrantyCards =
    data.warranty.highlights.length > 0
      ? data.warranty.highlights.slice(0, 4).map((h) => ({
          years: h.value,
          label: h.label,
        }))
      : [
          { years: "30", label: "Panel Performance" },
          { years: "15", label: "Product Warranty" },
          { years: "10", label: "Mounting Structure" },
          { years: "1", label: "Free AMC Included" },
        ];

  const journey =
    data.execution.steps.length > 0
      ? data.execution.steps.slice(0, 5).map((s) => ({
          num: s.num,
          title: s.title,
          desc: s.description,
        }))
      : [
          {
            num: "01",
            title: "Site Survey",
            desc: "Roof assessment, shading analysis & load verification",
          },
          {
            num: "02",
            title: "Design & SLD",
            desc: "Engineering drawings and single-line diagram preparation",
          },
          {
            num: "03",
            title: "Subsidy & Net Meter",
            desc: "PM Surya Ghar + DISCOM documentation & approval",
          },
          {
            num: "04",
            title: "Installation",
            desc: "Structure, modules, inverter & full electrical fit-out",
          },
          {
            num: "05",
            title: "Commissioning",
            desc: "Testing, earthing, net meter installation & handover",
          },
        ];

  const payments =
    data.execution.payments.length > 0
      ? data.execution.payments
      : [
          {
            label: "Booking Advance (25%)",
            pctLabel: "25%",
            amountInr: Math.round(finalAmount * 0.25),
          },
          {
            label: "Material Procurement (50%)",
            pctLabel: "50%",
            amountInr: Math.round(finalAmount * 0.5),
          },
          {
            label: "Installation (20%)",
            pctLabel: "20%",
            amountInr: Math.round(finalAmount * 0.2),
          },
          {
            label: "Commissioning (5%)",
            pctLabel: "5%",
            amountInr: Math.round(finalAmount * 0.05),
          },
        ];

  const termsLeft =
    data.terms.conditions.length > 0
      ? data.terms.conditions.slice(0, Math.ceil(data.terms.conditions.length / 2))
      : [
          "First year Annual Maintenance is included. From Year 2 onwards, AMC may be charged at 2% of project value with 5% yearly escalation.",
          "Installation to be completed within 30–40 working days from receipt of advance as per agreed schedule.",
          "Warranty covers manufacturing defects only. Physical damage, misuse or vandalism is excluded.",
        ];
  const termsRight =
    data.terms.conditions.length > 0
      ? data.terms.conditions.slice(Math.ceil(data.terms.conditions.length / 2))
      : data.terms.documents.length > 0
        ? data.terms.documents
        : [
            "Client to provide latest electricity bill, PAN, Aadhaar, ownership proof and passport-size photo.",
            "Routine panel cleaning (weekly recommended) is in customer’s scope as it directly affects generation.",
            "Any increase in sanctioned load or pending dues with DISCOM shall be cleared by the client before processing.",
          ];

  const contact =
    data.closing.contactLine?.trim() || "Harihar Solar · +91-99933 22267";

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className={`${styles.root} bg-[#FAF7F2] font-sans text-[#1C2526] print:bg-white`}>
      {/* Print bar */}
      <div className="sticky top-0 z-50 border-b border-[#EDE6D9] bg-[#FAF7F2]/95 py-4 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] justify-end px-8">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-2xl bg-[#1C2526] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-black active:scale-[0.985]"
          >
            Download as PDF
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-[210mm] px-8 pb-14 pt-16 print:pt-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px w-8 bg-[#B38B4D]" />
          <span className="text-xs font-medium uppercase tracking-[4px] text-[#B38B4D]">
            {brand}
          </span>
        </div>

        <h1 className="max-w-[18ch] text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-[72px] lg:tracking-[-3.5px]">
          Your Personalized
          <br />
          Energy Masterplan
        </h1>

        <p className="mt-6 max-w-md text-xl text-[#4A5568]">
          A thoughtfully engineered solar solution that delivers long-term savings,
          energy independence, and a quieter planet — designed exclusively for your
          home.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
          <div className="rounded-full border border-[#EDE6D9] px-5 py-2">
            {locationPill}
          </div>
          <div className="text-[#4A5568]">Prepared for {clientName}</div>
        </div>
      </div>

      {/* Key numbers */}
      <div className="mx-auto max-w-[210mm] px-8 pb-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              label: "ANNUAL CLEAN ENERGY",
              value:
                annualGeneration > 0
                  ? annualGeneration.toLocaleString("en-IN")
                  : "—",
              unit: "units / year",
            },
            {
              label: "YOUR SYSTEM",
              value: systemSize,
              unit: systemType,
            },
            {
              label: "ESTIMATED SAVINGS",
              value: estimatedSavings > 0 ? formatInr(estimatedSavings) : "—",
              unit: "per year in your pocket",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#EDE6D9] bg-white p-8"
            >
              <div className="mb-3 text-xs tracking-[1.5px] text-[#B38B4D]">
                {item.label}
              </div>
              <div className="text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
                {item.value}
              </div>
              <div className="mt-1 text-[#4A5568]">{item.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment */}
      <div className="mx-auto max-w-[210mm] border-b border-[#EDE6D9] px-8 pb-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            02 — THE INVESTMENT
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            Smart Capital Allocation
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-9 lg:col-span-3">
            <div className="space-y-6 text-lg">
              <div className="flex justify-between gap-4">
                <span>Total System Cost</span>
                <span className="font-medium">
                  {totalCost > 0 ? formatInr(totalCost) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-emerald-600">
                <span>PM Surya Ghar Subsidy</span>
                <span>{subsidy > 0 ? `− ${formatInr(subsidy)}` : "—"}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#EDE6D9] pt-6 text-2xl font-semibold">
                <span>Final Amount You Pay</span>
                <span>{finalAmount > 0 ? formatInr(finalAmount) : "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-[#1C2526] p-9 text-white lg:col-span-2">
            <div>
              <div className="text-xs tracking-[2px] text-[#B38B4D]">
                PAYBACK PERIOD
              </div>
              <div className="mt-3 text-[56px] font-semibold leading-none tracking-[-0.04em] sm:text-[68px] sm:tracking-[-3px]">
                {paybackYears > 0 ? paybackYears.toFixed(1) : "—"}
                <span className="align-super text-4xl"> yrs</span>
              </div>
            </div>
            <p className="mt-8 text-sm opacity-80">
              Your system pays for itself completely through electricity bill
              savings
              {paybackYears > 0
                ? ` in just ${paybackYears.toFixed(1)} years`
                : ""}
              .
            </p>
          </div>
        </div>
      </div>

      {/* Green legacy */}
      <div className="mx-auto max-w-[210mm] px-8 py-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            03 — YOUR GREEN LEGACY
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            What Your Roof Gives Back
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-9">
            <div className="text-5xl font-semibold tracking-[-3px] text-[#B38B4D] sm:text-[72px]">
              {co2Tons > 0 ? co2Tons : "—"}
            </div>
            <div className="mt-1 text-2xl">Tons of CO₂ Eliminated</div>
            <p className="mt-4 text-[#4A5568]">
              Over 25 years of clean energy generation from your rooftop.
            </p>
          </div>
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-9">
            <div className="text-5xl font-semibold tracking-[-3px] text-[#B38B4D] sm:text-[72px]">
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-1 text-2xl">Trees Equivalent Planted</div>
            <p className="mt-4 text-[#4A5568]">
              The same ecological benefit as planting a small forest over 25 years.
            </p>
          </div>
        </div>
      </div>

      {/* Engineering */}
      <div className="mx-auto max-w-[210mm] border-t border-[#EDE6D9] px-8 py-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            04 — ENGINEERING & DESIGN
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            Precision Engineered for Your Roof
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#EDE6D9] bg-white p-9">
            <div className="grid grid-cols-2 gap-y-6 text-sm">
              {engMetrics.map(([label, value]) => (
                <div key={label}>
                  <span className="text-[#4A5568]">{label}</span>
                  <div className="mt-0.5 text-lg font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#EDE6D9] bg-white p-8 text-sm">
              <div className="mb-3 font-medium">Standards Compliance</div>
              <div className="text-[#4A5568]">{standards}</div>
            </div>
            <div className="rounded-3xl border border-[#EDE6D9] bg-white p-8">
              <div className="mb-4 font-medium">Installation Journey</div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm text-[#4A5568] sm:grid-cols-2">
                {installJourney.slice(0, 6).map((step, i) => (
                  <div key={step} className="flex gap-2">
                    <span className="text-[#B38B4D]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware */}
      <div className="mx-auto max-w-[210mm] px-8 py-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            05 — PREMIUM HARDWARE
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            Tier-1 Components, Built to Last
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {hardware.map((item) => (
            <div
              key={item.title}
              className="flex gap-5 rounded-3xl border border-[#EDE6D9] bg-white p-8"
            >
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F5F0] text-sm font-semibold text-[#B38B4D]">
                {item.mark}
              </div>
              <div>
                <div className="text-xl font-semibold">{item.title}</div>
                <div className="mt-1 leading-snug text-[#4A5568]">{item.desc}</div>
                <div className="mt-4 inline-block rounded-full bg-[#F8F5F0] px-4 py-1 text-xs text-[#B38B4D]">
                  {item.warranty}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty */}
      <div className="mx-auto max-w-[210mm] border-t border-[#EDE6D9] px-8 py-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            06 — WARRANTY & ASSURANCE
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            Complete Peace of Mind
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {warrantyCards.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#EDE6D9] bg-white p-8 text-center"
            >
              <div className="text-5xl font-semibold tracking-tight text-[#B38B4D] sm:text-6xl">
                {item.years}
              </div>
              <div className="mt-2 text-lg">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey + payment */}
      <div className="mx-auto max-w-[210mm] px-8 py-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            07 — YOUR JOURNEY
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            From Paperwork to Power
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {journey.map((item) => (
              <div
                key={item.num}
                className="flex gap-5 rounded-3xl border border-[#EDE6D9] bg-white p-6"
              >
                <div className="w-8 font-mono text-xl text-[#B38B4D]">{item.num}</div>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-0.5 text-sm text-[#4A5568]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-3xl border border-[#EDE6D9] bg-white p-8 lg:col-span-2">
            <div className="mb-5 text-sm font-medium tracking-wider">
              PAYMENT SCHEDULE
            </div>
            <div className="space-y-4 text-[15px]">
              {payments.map((p, i) => (
                <div
                  key={p.label}
                  className={`flex justify-between gap-3 border-b border-[#EDE6D9] pb-3 ${
                    i === payments.length - 1 ? "border-none pb-0" : ""
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="font-medium">{formatInr(p.amountInr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mx-auto max-w-[210mm] border-t border-[#EDE6D9] px-8 py-16">
        <div className="mb-8">
          <span className="text-xs tracking-[2px] text-[#B38B4D]">
            08 — TERMS & CONDITIONS
          </span>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-1.5px] sm:text-5xl">
            Clear & Transparent
          </h2>
        </div>

        <div className="grid max-w-none grid-cols-1 gap-x-12 gap-y-8 text-sm text-[#4A5568] md:grid-cols-2">
          <ul className="list-disc space-y-3 pl-5">
            {termsLeft.map((t) => (
              <li key={t.slice(0, 48)}>{t}</li>
            ))}
          </ul>
          <ul className="list-disc space-y-3 pl-5">
            {termsRight.map((t) => (
              <li key={t.slice(0, 48)}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Closing */}
      <div className="mx-auto max-w-[210mm] border-t border-[#EDE6D9] px-8 py-20 print:pb-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 text-xs tracking-[3px] text-[#B38B4D]">THANK YOU</div>
          <h2 className="text-5xl font-semibold leading-none tracking-[-2px] sm:text-6xl">
            Ready to power
            <br />
            your future?
          </h2>
          <p className="mt-6 text-lg text-[#4A5568]">
            Your roof is about to start generating clean energy and meaningful
            savings.
          </p>

          <div className="my-10 flex justify-center gap-8 text-sm">
            <div>
              <span className="block text-3xl font-semibold tracking-tight">
                {annualGeneration > 0
                  ? annualGeneration.toLocaleString("en-IN")
                  : "—"}
              </span>
              units/year
            </div>
            <div>
              <span className="block text-3xl font-semibold tracking-tight">
                {estimatedSavings > 0 ? formatInr(estimatedSavings) : "—"}
              </span>
              saved/year
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-2xl bg-[#1C2526] px-10 py-4 text-base font-medium text-white transition-colors hover:bg-black print:hidden"
          >
            Download Proposal as PDF
          </button>

          <div className="mt-14 text-xs text-[#4A5568]">
            This proposal is valid for 15 days.
            <br />
            {brand} · {contact}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumLuxeRenderer;
