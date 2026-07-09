"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bolt,
  Check,
  CheckCircle2,
  Cpu,
  Download,
  Headphones,
  Leaf,
  MapPin,
  Phone,
  Plug,
  Shield,
  Sun,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import { fmtInr, fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import type { EditorialBomRow } from "@/lib/executive-premium-editorial/types";
import "./solstice-proposal.css";

export type SolsticeProposalRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
};

const NAV_SECTIONS = [
  { id: "investment", label: "Investment" },
  { id: "eco", label: "Green Impact" },
  { id: "design", label: "Design" },
  { id: "components", label: "Components" },
  { id: "execution", label: "Execution" },
] as const;

function metricValue(rows: { label: string; value: string }[], needle: string): string {
  const row = rows.find((r) => r.label.toLowerCase().includes(needle.toLowerCase()));
  return row?.value ?? "—";
}

function bomIcon(row: EditorialBomRow): LucideIcon {
  const key = `${row.name} ${row.spec}`.toLowerCase();
  if (key.includes("panel") || key.includes("module")) return Sun;
  if (key.includes("inverter")) return Cpu;
  if (key.includes("mount") || key.includes("structure")) return Wrench;
  if (key.includes("cabl")) return Plug;
  if (key.includes("protect") || key.includes("safety") || key.includes("earthing")) return Shield;
  return Headphones;
}

function warrantyBadge(row: EditorialBomRow): string {
  const w = row.warranty.trim();
  if (!w) return "Tier-1";
  return w.toUpperCase().includes("YEAR") ? w.toUpperCase() : `${w} WARRANTY`;
}

function telHref(contact: string): string {
  const digits = contact.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "#";
}

function paybackBarWidth(years: number): string {
  return `${Math.min(100, Math.max(8, Math.round((years / 10) * 100)))}%`;
}

export function SolsticeProposalRenderer({ pptInput, summary }: SolsticeProposalRendererProps) {
  const m = useMemo(() => transformToEditorialModel(pptInput, summary), [pptInput, summary]);
  const [activeNav, setActiveNav] = useState<string>(NAV_SECTIONS[0].id);
  const [upiCopied, setUpiCopied] = useState(false);

  const systemKw = summary.systemKw;
  const dcKwp = metricValue(m.engineering.metrics_rows, "dc capacity");
  const loadCoverage = metricValue(m.engineering.metrics_rows, "load coverage");
  const panelWarranty =
    m.warranty.highlights.find((h) => h.label.toLowerCase().includes("power"))?.value ?? "30";

  const copyUpi = useCallback(() => {
    const upi = m.execution.upi_id?.trim();
    if (!upi || upi === "—") return;
    void navigator.clipboard.writeText(upi).then(() => {
      setUpiCopied(true);
      window.setTimeout(() => setUpiCopied(false), 1800);
    });
  }, [m.execution.upi_id]);

  useEffect(() => {
    const onScroll = () => {
      let current: string = NAV_SECTIONS[0].id;
      for (const section of NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 180) current = section.id;
      }
      setActiveNav(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logoUrl = pptInput.installerLogoUrl?.trim() || m.brand_logo_url?.trim();
  const brandName = m.brand_display || summary.installer || "Harihar Solar";
  const contact = m.closing.contact_line || summary.contact || "";
  const paybackPct = paybackBarWidth(m.economics.payback_years);

  return (
    <div className="solstice-proposal min-h-screen bg-slate-50 text-slate-800">
      <nav className="solstice-no-print sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-x-3">
              <div className="flex shrink-0 items-center gap-x-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[120px] object-contain" />
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500">
                      <Sun className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold tracking-tighter text-slate-900">{brandName.split(" ")[0]}</div>
                      <div className="-mt-1.5 text-[10px] font-medium tracking-[2px] text-amber-600">
                        {brandName.split(" ").slice(1).join(" ") || "SOLAR"}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 md:block">
                Premium Grid Architecture
              </div>
            </div>

            <div className="hidden items-center gap-x-8 text-sm font-medium md:flex">
              {NAV_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`transition-colors hover:text-amber-600 ${activeNav === s.id ? "nav-active" : ""}`}
                >
                  {s.label}
                </a>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-x-3">
              {contact ? (
                <div className="hidden items-center gap-x-2 text-sm sm:flex">
                  <Phone className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">{contact}</span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-x-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-black sm:px-5"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-12 sm:px-8">
        <div className="grid items-center gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="mb-6 inline-flex items-center gap-x-2 rounded-3xl border border-slate-200 bg-white px-4 py-1.5 shadow-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600">Personalized Energy Masterplan</span>
            </div>

            <h1 className="mb-4 text-5xl font-bold leading-none tracking-tighter sm:text-6xl md:text-7xl">
              Your roof is ready
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                to start generating.
              </span>
            </h1>

            <div className="mb-8 flex items-center gap-x-4">
              <div>
                <div className="text-3xl font-semibold">{m.customer_name}</div>
                <div className="flex items-center gap-x-2 text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{m.location_line}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-x-3 rounded-3xl border border-slate-200 bg-white px-6 py-3 shadow-sm">
                <div>
                  <div className="text-xs text-slate-500">SYSTEM SIZE</div>
                  <div className="text-2xl font-bold tracking-tighter">{systemKw} kW</div>
                </div>
                <div className="h-9 w-px bg-slate-200" />
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex items-center gap-x-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-3 font-semibold text-emerald-700">
                <Leaf className="h-4 w-4" />
                <span>100% Clean Energy</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:col-span-5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="mb-1 text-sm text-slate-500">ANNUAL GENERATION</div>
                <div className="metric-value text-amber-600">{fmtInr(m.closing.annual_units)}</div>
                <div className="text-sm font-medium">Units / Year</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-slate-500">ESTIMATED SAVINGS</div>
                <div className="metric-value text-emerald-600">₹{fmtInr(m.closing.annual_savings_inr)}</div>
                <div className="text-sm font-medium">Per Year</div>
              </div>
              <div className="col-span-2 border-t pt-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Payback Period</span>
                  <span className="font-bold text-slate-900">{m.economics.payback_years} Years</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                    style={{ width: paybackPct }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 pb-12 sm:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <Bolt className="h-10 w-10 text-amber-500" />
            <div>
              <div className="text-3xl font-bold">{loadCoverage}</div>
              <div className="text-sm text-slate-600">Load Coverage</div>
            </div>
          </div>
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <Sun className="h-10 w-10 text-amber-500" />
            <div>
              <div className="text-3xl font-bold">{dcKwp}</div>
              <div className="text-sm text-slate-600">DC Capacity</div>
            </div>
          </div>
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <div className="text-4xl text-emerald-500">⏱</div>
            <div>
              <div className="text-3xl font-bold">{m.economics.payback_years} Yrs</div>
              <div className="text-sm text-slate-600">Payback Period</div>
            </div>
          </div>
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <Shield className="h-10 w-10 text-emerald-500" />
            <div>
              <div className="text-3xl font-bold">{panelWarranty} Yrs</div>
              <div className="text-sm text-slate-600">Panel Warranty</div>
            </div>
          </div>
        </div>
      </div>

      <div id="investment" className="mx-auto max-w-screen-2xl scroll-mt-20 px-4 py-12 sm:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[3px] text-amber-600">02 / CAPITAL ALLOCATION</div>
            <h2 className="section-header">Your Investment</h2>
          </div>
          {m.economics.subsidy_inr > 0 ? (
            <div className="hidden text-right md:block">
              <div className="font-semibold text-emerald-600">Government Subsidy Applied</div>
              <div className="text-3xl font-bold text-emerald-600">{fmtInrSpaced(m.economics.subsidy_inr)}</div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-7">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <div className="text-sm text-slate-500">TOTAL SYSTEM COST</div>
                <div className="mt-1 text-4xl font-bold">{fmtInrSpaced(m.economics.gross_cost_inr)}</div>
                <div className="mt-1 text-xs text-slate-500">Premium panels + Inverter + Installation</div>
              </div>
              <div className="md:border-l md:pl-6">
                <div className="text-sm font-medium text-emerald-600">PM SURYA GHAR SUBSIDY</div>
                <div className="mt-1 text-4xl font-bold text-emerald-600">
                  {m.economics.subsidy_inr > 0 ? `- ${fmtInrSpaced(m.economics.subsidy_inr)}` : "—"}
                </div>
              </div>
              <div className="border-t pt-6 md:border-l md:border-t-0 md:pt-0 md:pl-6">
                <div className="text-sm text-slate-500">FINAL AMOUNT YOU PAY</div>
                <div className="mt-1 text-5xl font-extrabold text-slate-900">{fmtInrSpaced(m.economics.net_cost_inr)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-5">
            <div className="mb-4 flex items-center gap-x-2 font-semibold">
              <span className="text-amber-500">💳</span>
              <span>Financing Options</span>
            </div>
            {m.economics.emi_rows.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="pb-3 text-left font-normal">PLAN</th>
                    <th className="pb-3 text-right font-normal">INTEREST</th>
                    <th className="pb-3 text-right font-normal">EMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {m.economics.emi_rows.map((row) => (
                    <tr key={row.tenure_label}>
                      <td className="py-3 font-medium">{row.tenure_label}</td>
                      <td className="py-3 text-right font-semibold">{fmtInrSpaced(row.interest_paid_inr)}</td>
                      <td className="py-3 text-right font-bold text-amber-600">
                        {fmtInrSpaced(row.monthly_emi_inr)}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">Financing options available on request.</p>
            )}
          </div>
        </div>
      </div>

      <div id="eco" className="mx-auto max-w-screen-2xl scroll-mt-20 px-4 py-12 sm:px-8">
        <div className="rounded-3xl bg-emerald-900 px-4 py-12 text-white sm:px-8">
          <div className="px-0 sm:px-8">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-emerald-400">03 / ECOLOGICAL RETENTION</div>
            <h2 className="mb-8 text-5xl font-bold tracking-tight">Your Green Legacy</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <div className="flex items-baseline gap-x-3">
                  <div className="text-[5.5rem] font-extrabold leading-none">{fmtInr(m.impact.co2_tons)}</div>
                  <div>
                    <div className="text-2xl font-semibold">Tons</div>
                    <div className="text-emerald-400">CO₂ ELIMINATED</div>
                  </div>
                </div>
                <p className="mt-4 max-w-md text-emerald-200">
                  By producing your own solar power, you prevent fossil-fuel generation on your behalf over the system
                  lifetime.
                </p>
              </div>
              <div>
                <div className="flex items-baseline gap-x-3">
                  <div className="text-[5.5rem] font-extrabold leading-none">{fmtInr(m.impact.trees)}</div>
                  <div>
                    <div className="text-2xl font-semibold">Trees</div>
                    <div className="text-emerald-400">EQUIVALENT PLANTED</div>
                  </div>
                </div>
                <p className="mt-4 max-w-md text-emerald-200">
                  Your rooftop achieves the same ecological milestone as planting a small forest — without waiting decades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="design" className="mx-auto max-w-screen-2xl scroll-mt-20 px-4 py-16 sm:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[3px] text-amber-600">05 / ENGINEERING DESIGN</div>
          <h2 className="section-header">Design &amp; Performance</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-7">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm md:grid-cols-3">
              {m.engineering.metrics_rows.map((row) => (
                <div key={row.label}>
                  <span className="block text-slate-500">{row.label}</span>
                  <span className="text-lg font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 border-t pt-6">
              <div className="flex items-center gap-x-2 rounded-2xl bg-amber-100 px-5 py-2 text-sm font-semibold text-amber-700">
                <Sun className="h-4 w-4" />
                <span>
                  Recommended Tilt: <strong>{m.engineering.tilt_deg}°</strong>
                </span>
              </div>
              <div className="text-xs text-slate-500">{m.engineering.tilt_note}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-5">
            <div className="mb-5 font-semibold">Installation Process</div>
            <div className="space-y-5 text-sm">
              {m.engineering.install_phases.map((phase) => (
                <div key={phase.num} className="timeline-item flex gap-x-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {phase.num.padStart(2, "0")}
                  </div>
                  <div>
                    <span className="font-semibold">{phase.title}</span> — {phase.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="components" className="mx-auto max-w-screen-2xl scroll-mt-20 px-4 pb-16 sm:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[3px] text-amber-600">06 / HARDWARE INTELLIGENCE</div>
          <h2 className="section-header">System Components</h2>
          <p className="text-slate-600">Tier-1 components with full engineering specification</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {m.architecture.bom_rows.map((row) => {
            const Icon = bomIcon(row);
            const isDcr = row.technical_points.some((p) => p.toLowerCase().includes("dcr"));
            return (
              <div key={`${row.name}-${row.brand}`} className="proposal-card rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex justify-between">
                  <div>
                    <div className="text-xl font-bold">{row.brand || row.name}</div>
                    <div className="text-xs font-semibold tracking-wider text-emerald-600">{warrantyBadge(row)}</div>
                  </div>
                  <Icon className="h-10 w-10 text-amber-400" />
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div>
                    {row.spec} {row.name !== row.brand ? `· ${row.name}` : ""}
                  </div>
                  {row.technical_points.length > 0 ? (
                    <div className="text-xs text-slate-500">{row.technical_points.slice(0, 3).join(" • ")}</div>
                  ) : null}
                </div>
                {isDcr ? (
                  <div className="mt-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">DCR Listed</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <div className="mb-6">
            <div className="text-xs font-semibold tracking-[3px] text-amber-600">07 / WARRANTY &amp; ASSURANCE</div>
            <h3 className="text-3xl font-bold">Warranty Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="modern-table w-full text-sm">
              <thead>
                <tr>
                  <th className="rounded-tl-2xl px-5 py-4 text-left">ITEM</th>
                  <th className="px-5 py-4 text-center">DURATION</th>
                  <th className="px-5 py-4 text-center">BY</th>
                  <th className="rounded-tr-2xl px-5 py-4 text-left">COVERAGE</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {m.warranty.rows.map((row, i) => (
                  <tr key={row.item} className={i === 1 ? "bg-emerald-50/50" : undefined}>
                    <td className="px-5 py-4 font-medium">{row.item}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-bold ${i === 1 ? "text-emerald-600" : ""}`}>{row.duration}</span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500">{row.by}</td>
                    <td className="px-5 py-4">{row.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 px-1 text-xs text-slate-500">
            * Physical damage, vandalism or misuse is not covered. Routine cleaning is customer&apos;s responsibility.
          </p>
        </div>
      </div>

      <div id="execution" className="mx-auto max-w-screen-2xl scroll-mt-20 px-4 pb-16 sm:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[3px] text-amber-600">08 / EXECUTION &amp; SETTLEMENT</div>
          <h2 className="section-header">Installation Process</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {m.execution.steps.map((step, i) => (
                <div key={step.num} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="mb-3 flex items-center gap-x-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-bold text-white ${
                        i === m.execution.steps.length - 1 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    >
                      {step.num}
                    </div>
                    <div className="font-semibold">{step.title.toUpperCase()}</div>
                  </div>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 lg:col-span-5">
            <div className="mb-4 font-semibold">Payment Schedule</div>
            <div className="space-y-3 text-sm">
              {m.execution.payments.map((p) => (
                <div
                  key={p.label}
                  className={`flex items-center justify-between ${p.is_total ? "border-t pt-3" : ""}`}
                >
                  <span>
                    {p.label} ({p.pct_label})
                  </span>
                  <span className="font-bold">{fmtInrSpaced(p.amount_inr)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="mb-2 text-xs text-slate-500">SECURE PAYMENT DETAILS</div>
              <div className="space-y-1 rounded-2xl bg-slate-50 p-4 text-sm">
                <div>
                  <span className="text-slate-500">Beneficiary:</span>{" "}
                  <span className="font-semibold">{m.execution.company}</span>
                </div>
                <div>
                  <span className="text-slate-500">A/c No:</span>{" "}
                  <span className="font-mono font-semibold">{m.execution.account_number}</span>
                </div>
                <div>
                  <span className="text-slate-500">IFSC:</span>{" "}
                  <span className="font-mono font-semibold">{m.execution.ifsc}</span>
                </div>
                {m.execution.upi_id && m.execution.upi_id !== "—" ? (
                  <div className="mt-2 flex items-center gap-x-2 border-t pt-2">
                    <span className="rounded-xl border bg-white px-2.5 py-1 text-xs">UPI:</span>
                    <span className="font-semibold text-amber-600">{m.execution.upi_id}</span>
                    <button
                      type="button"
                      onClick={copyUpi}
                      className="ml-auto rounded-xl border bg-white px-3 py-1 text-xs hover:bg-amber-50"
                    >
                      {upiCopied ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3 w-3" /> Copied!
                        </span>
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 pb-20 sm:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-white md:p-14">
          <div className="max-w-2xl">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[4px] text-amber-400">
              CONGRATULATIONS, {m.customer_name.toUpperCase()}
            </div>
            <h2 className="mb-4 text-5xl font-bold tracking-tighter">Your roof is ready to start generating.</h2>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <div className="text-sm text-emerald-400">ANNUAL GENERATION</div>
                <div className="text-4xl font-extrabold">{fmtInr(m.closing.annual_units)} Units</div>
              </div>
              <div>
                <div className="text-sm text-emerald-400">ESTIMATED SAVINGS / YEAR</div>
                <div className="text-4xl font-extrabold">₹{fmtInr(m.closing.annual_savings_inr)}</div>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-x-2 rounded-2xl bg-white px-8 py-4 font-semibold text-slate-900 transition-colors hover:bg-amber-50"
              >
                <Download className="h-5 w-5" />
                <span>Download Proposal as PDF</span>
              </button>
              {contact ? (
                <a
                  href={telHref(contact)}
                  className="flex items-center justify-center gap-x-2 rounded-2xl border border-white/30 px-8 py-4 font-semibold transition-colors hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call {brandName}</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-xs text-slate-500">
        Prepared exclusively for <span className="font-semibold text-slate-700">{m.customer_name}</span> •{" "}
        {m.location_line} • {brandName} © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
