"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bolt,
  Check,
  ChevronDown,
  Cpu,
  Download,
  Headphones,
  Lock,
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
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import "./solstice-proposal.css";

export type SolsticeProposalRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  installerLogoUrl?: string;
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

const INSTALLATION_DAY_TIMELINE = [
  { day: 1, title: "Survey", description: "Site visit, roof assessment & final layout sign-off." },
  { day: 5, title: "Material", description: "Tier-1 panels, inverter & mounting delivered to site." },
  { day: 8, title: "Installation", description: "Structure, DC/AC wiring, earthing & safety tests." },
  { day: 20, title: "Net Meter", description: "DISCOM application, inspection & meter commissioning." },
  { day: 30, title: "Generation", description: "Grid sync complete — your plant starts producing power." },
] as const;

function SolsticeSection({
  id,
  children,
  className = "",
  variant = "default",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hero" | "tight-top" | "flush-bottom";
}) {
  const variantClass =
    variant === "hero"
      ? "solstice-section--hero"
      : variant === "tight-top"
        ? "solstice-section--tight-top"
        : variant === "flush-bottom"
          ? "solstice-section--flush-bottom"
          : "";
  return (
    <section id={id} className={`solstice-section ${variantClass} ${className}`.trim()}>
      <div className="solstice-section-inner">{children}</div>
    </section>
  );
}

export function SolsticeProposalRenderer({
  pptInput,
  summary,
  installerLogoUrl: installerLogoUrlProp,
}: SolsticeProposalRendererProps) {
  const m = useMemo(() => transformToEditorialModel(pptInput, summary), [pptInput, summary]);
  const [activeNav, setActiveNav] = useState<string>(NAV_SECTIONS[0].id);
  const [upiCopied, setUpiCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return (
      installerLogoUrlProp?.trim() ||
      pptInput.installerLogoUrl?.trim() ||
      m.brand_logo_url?.trim() ||
      undefined
    );
  });

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
    const syncLogo = () => {
      const fromProp = installerLogoUrlProp?.trim() ?? "";
      const fromPpt = pptInput.installerLogoUrl?.trim() ?? "";
      const fromModel = m.brand_logo_url?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setLogoUrl(fromProp || fromModel || fromPpt || fromLocal || undefined);
    };
    syncLogo();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, syncLogo);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, syncLogo);
  }, [installerLogoUrlProp, m.brand_logo_url, pptInput.installerLogoUrl]);

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

  const logoUrlResolved = logoUrl?.trim();
  const brandName = m.brand_display || summary.installer || "Harihar Solar";
  const contact = m.closing.contact_line || summary.contact || "";
  const paybackPct = paybackBarWidth(m.economics.payback_years);

  return (
    <div className="solstice-proposal min-h-screen">
      <nav className="solstice-nav solstice-no-print">
        <div className="solstice-nav-inner">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-x-3">
              <div className="flex shrink-0 items-center gap-x-2">
                {logoUrlResolved ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrlResolved} alt={brandName} className="h-10 w-auto max-w-[140px] object-contain" />
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--solstice-accent)]">
                      <Sun className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold tracking-tighter text-slate-900">{brandName.split(" ")[0]}</div>
                      <div className="-mt-1.5 text-[10px] font-medium tracking-[2px] text-[var(--solstice-accent)]">
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
                  className={`transition-colors hover:text-[var(--solstice-accent)] ${activeNav === s.id ? "nav-active" : ""}`}
                >
                  {s.label}
                </a>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-x-3">
              {contact ? (
                <div className="hidden items-center gap-x-2 text-sm sm:flex">
                  <Phone className="h-4 w-4 text-[var(--solstice-accent)]" />
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

      <SolsticeSection variant="hero" className="solstice-cover-section">
        <div className="solstice-cover">
          <div className="solstice-cover-glow solstice-cover-glow--left" aria-hidden />
          <div className="solstice-cover-glow solstice-cover-glow--right" aria-hidden />
          <div className="solstice-cover-grid" aria-hidden />

          <div className="solstice-cover-inner">
            <div className="solstice-cover-top">
              <span className="solstice-confidential-badge">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Confidential
              </span>
            </div>

            <div className="solstice-cover-brand">
              {logoUrlResolved ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrlResolved}
                  alt={brandName}
                  className="solstice-cover-logo"
                />
              ) : (
                <div className="solstice-cover-logo-fallback" aria-hidden>
                  <Sun className="h-10 w-10 text-[var(--solstice-accent)]" />
                </div>
              )}
              <p className="solstice-cover-company">{brandName}</p>
            </div>

            <p className="solstice-cover-eyebrow">Prepared Exclusively For</p>
            <p className="solstice-cover-client">{m.customer_name}</p>

            <div className="solstice-cover-meta">
              <div className="solstice-cover-kw">
                <span className="solstice-cover-kw-value">{systemKw}</span>
                <span className="solstice-cover-kw-unit">kW Solar Plant</span>
              </div>
              {m.location_line ? (
                <div className="solstice-cover-location">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--solstice-accent)]" aria-hidden />
                  <span>{m.location_line}</span>
                </div>
              ) : null}
            </div>

            <a href="#investment" className="solstice-cover-scroll solstice-no-print">
              <span>Explore your plan</span>
              <ChevronDown className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </SolsticeSection>

      <SolsticeSection id="investment">
        <div className="solstice-snapshot-bar">
          <div className="solstice-snapshot-item">
            <span className="solstice-snapshot-label">System Size</span>
            <span className="solstice-snapshot-value">{systemKw} kW</span>
          </div>
          <div className="solstice-snapshot-item">
            <span className="solstice-snapshot-label">Annual Generation</span>
            <span className="solstice-snapshot-value solstice-accent-text">
              {Math.round(m.closing.annual_units).toLocaleString("en-IN")} Units
            </span>
          </div>
          <div className="solstice-snapshot-item">
            <span className="solstice-snapshot-label">Estimated Savings</span>
            <span className="solstice-snapshot-value solstice-positive-text">
              ₹{fmtInr(m.closing.annual_savings_inr)}/yr
            </span>
          </div>
          <div className="solstice-snapshot-item solstice-snapshot-item--payback">
            <span className="solstice-snapshot-label">Payback</span>
            <span className="solstice-snapshot-value">{m.economics.payback_years} Years</span>
            <div className="solstice-snapshot-bar-track">
              <div className="solstice-snapshot-bar-fill" style={{ width: paybackPct }} />
            </div>
          </div>
        </div>

        <div className="solstice-stat-grid">
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <Bolt className="h-10 w-10 text-[var(--solstice-accent)]" />
            <div>
              <div className="text-3xl font-bold">{loadCoverage}</div>
              <div className="text-sm text-slate-600">Load Coverage</div>
            </div>
          </div>
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <Sun className="h-10 w-10 text-[var(--solstice-accent)]" />
            <div>
              <div className="text-3xl font-bold">{dcKwp}</div>
              <div className="text-sm text-slate-600">DC Capacity</div>
            </div>
          </div>
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <div className="text-4xl text-[var(--solstice-positive)]">⏱</div>
            <div>
              <div className="text-3xl font-bold">{m.economics.payback_years} Yrs</div>
              <div className="text-sm text-slate-600">Payback Period</div>
            </div>
          </div>
          <div className="stat-pill flex items-center gap-x-4 rounded-3xl border border-slate-200 p-6">
            <Shield className="h-10 w-10 text-[var(--solstice-positive)]" />
            <div>
              <div className="text-3xl font-bold">{panelWarranty} Yrs</div>
              <div className="text-sm text-slate-600">Panel Warranty</div>
            </div>
          </div>
        </div>

        <div className="mb-8 mt-10 flex items-end justify-between">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[3px] solstice-kicker">01 / CAPITAL ALLOCATION</div>
            <h2 className="section-header">Your Investment</h2>
          </div>
          {m.economics.subsidy_inr > 0 ? (
            <div className="hidden text-right md:block">
              <div className="font-semibold solstice-positive-text">Government Subsidy Applied</div>
              <div className="text-3xl font-bold solstice-positive-text">{fmtInrSpaced(m.economics.subsidy_inr)}</div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
            <div className="solstice-investment-grid">
              <div>
                <div className="text-sm text-slate-500">TOTAL SYSTEM COST</div>
                <div className="mt-1 text-3xl font-bold sm:text-4xl">{fmtInrSpaced(m.economics.gross_cost_inr)}</div>
                <div className="mt-1 text-xs text-slate-500">Premium panels + Inverter + Installation</div>
              </div>
              <div>
                <div className="text-sm font-medium solstice-positive-text">PM SURYA GHAR SUBSIDY</div>
                <div className="mt-1 text-3xl font-bold solstice-positive-text sm:text-4xl">
                  {m.economics.subsidy_inr > 0 ? `- ${fmtInrSpaced(m.economics.subsidy_inr)}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">FINAL AMOUNT YOU PAY</div>
                <div className="mt-1 text-4xl font-extrabold text-slate-900 sm:text-5xl">
                  {fmtInrSpaced(m.economics.net_cost_inr)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-5">
            <div className="mb-4 flex items-center gap-x-2 font-semibold">
              <span className="solstice-accent-text">💳</span>
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
                      <td className="py-3 text-right font-bold solstice-accent-text">
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
      </SolsticeSection>

      <SolsticeSection id="eco">
        <div className="solstice-eco-panel">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-indigo-300">02 / ECOLOGICAL IMPACT</div>
          <h2 className="mb-8 text-4xl font-bold tracking-tight sm:text-5xl">Your Green Legacy</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="solstice-eco-stat">{fmtInr(m.impact.co2_tons)}</div>
                <div>
                  <div className="text-2xl font-semibold">Tons</div>
                  <div className="text-indigo-300">CO₂ ELIMINATED</div>
                </div>
              </div>
              <p className="mt-4 max-w-md text-slate-300">
                By producing your own solar power, you prevent fossil-fuel generation on your behalf over the system
                lifetime.
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="solstice-eco-stat">{fmtInr(m.impact.trees)}</div>
                <div>
                  <div className="text-2xl font-semibold">Trees</div>
                  <div className="text-indigo-300">EQUIVALENT PLANTED</div>
                </div>
              </div>
              <p className="mt-4 max-w-md text-slate-300">
                Your rooftop achieves the same ecological milestone as planting a small forest — without waiting
                decades.
              </p>
            </div>
          </div>
        </div>
      </SolsticeSection>

      <SolsticeSection id="design">
        <div className="solstice-section-header mb-8">
          <div className="text-xs font-semibold tracking-[3px] solstice-kicker">03 / ENGINEERING DESIGN</div>
          <h2 className="section-header">Design &amp; Performance</h2>
        </div>

        <div className="solstice-tilt-hero solstice-print-keep">
          <p className="solstice-tilt-hero-kicker">Optimal panel tilt for your latitude</p>
          <p className="solstice-tilt-hero-degree">
            {m.engineering.tilt_deg}
            <span className="solstice-tilt-hero-unit">°</span>
          </p>
          <p className="solstice-tilt-hero-title">Recommended Roof Tilt</p>
          <p className="solstice-tilt-hero-note">{m.engineering.tilt_note}</p>
          {m.engineering.city_label ? (
            <p className="solstice-tilt-hero-site">
              Site reference · {m.engineering.city_label}
            </p>
          ) : null}
        </div>

        <div className="solstice-print-keep mt-6 rounded-3xl border border-slate-200 bg-white p-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm md:grid-cols-3 lg:grid-cols-5">
            {m.engineering.metrics_rows.map((row) => (
              <div key={row.label} className={row.highlight ? "solstice-metric-highlight" : undefined}>
                <span className="block text-slate-500">{row.label}</span>
                <span className="text-lg font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </SolsticeSection>

      <SolsticeSection id="components">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[3px] solstice-kicker">04 / HARDWARE INTELLIGENCE</div>
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
                    <div className="text-xs font-semibold tracking-wider solstice-positive-text">{warrantyBadge(row)}</div>
                  </div>
                  <Icon className="h-10 w-10 text-[var(--solstice-accent-soft)]" />
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
                  <div className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">DCR Listed</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </SolsticeSection>

      <SolsticeSection>
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <div className="mb-6">
            <div className="text-xs font-semibold tracking-[3px] solstice-kicker">05 / WARRANTY &amp; ASSURANCE</div>
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
                  <tr key={row.item} className={i === 1 ? "bg-slate-50" : undefined}>
                    <td className="px-5 py-4 font-medium">{row.item}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-bold ${i === 1 ? "solstice-accent-text" : ""}`}>{row.duration}</span>
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
      </SolsticeSection>

      <SolsticeSection id="execution">
        <div className="solstice-section-header mb-8">
          <div className="text-xs font-semibold tracking-[3px] solstice-kicker">06 / EXECUTION &amp; SETTLEMENT</div>
          <h2 className="section-header">Installation Process</h2>
        </div>

        <div className="solstice-day-timeline">
          <p className="solstice-day-timeline-heading">Your project timeline</p>
          <div className="solstice-day-timeline-track">
            {INSTALLATION_DAY_TIMELINE.map((item, i) => (
              <div key={item.day} className="solstice-day-timeline-step solstice-print-keep">
                <div className="solstice-day-timeline-node">
                  <span className="solstice-day-timeline-day">Day {item.day}</span>
                  <span className="solstice-day-timeline-dot" />
                </div>
                <div className="solstice-day-timeline-card">
                  <p className="solstice-day-timeline-title">{item.title}</p>
                  <p className="solstice-day-timeline-desc">{item.description}</p>
                </div>
                {i < INSTALLATION_DAY_TIMELINE.length - 1 ? (
                  <div className="solstice-day-timeline-arrow" aria-hidden>
                    ↓
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="solstice-execution-layout mt-8 grid gap-6 lg:grid-cols-12">
          <div className="solstice-execution-steps lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {m.execution.steps.map((step, i) => (
                <div key={step.num} className="solstice-print-keep rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="mb-3 flex items-center gap-x-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-bold text-white ${
                        i === m.execution.steps.length - 1 ? "bg-[var(--solstice-positive)]" : "bg-[var(--solstice-accent)]"
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

          <div className="solstice-execution-payment solstice-print-keep rounded-3xl border border-slate-200 bg-white p-7 lg:col-span-5">
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
                    <span className="font-semibold solstice-accent-text">{m.execution.upi_id}</span>
                    <button
                      type="button"
                      onClick={copyUpi}
                      className="ml-auto rounded-xl border bg-white px-3 py-1 text-xs hover:bg-slate-50"
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
      </SolsticeSection>

      <SolsticeSection variant="flush-bottom">
        <div className="solstice-closing-block solstice-print-keep rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-white md:p-14">
          <div className="max-w-2xl">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[4px] text-indigo-300">
              CONGRATULATIONS, {m.customer_name.toUpperCase()}
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tighter sm:text-5xl">
              Your family is ready to generate clean power.
            </h2>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <div className="text-sm text-indigo-300">LIFETIME WEALTH CREATED</div>
                <div className="text-4xl font-extrabold">₹{fmtInr(m.closing.lifetime_wealth_inr)}</div>
              </div>
              <div>
                <div className="text-sm text-indigo-300">ANNUAL GENERATION</div>
                <div className="text-4xl font-extrabold">{Math.round(m.closing.annual_units).toLocaleString("en-IN")} Units</div>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-x-2 rounded-2xl bg-white px-8 py-4 font-semibold text-slate-900 transition-colors hover:bg-slate-100"
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
      </SolsticeSection>

      <footer className="solstice-footer">
        Prepared exclusively for <span className="font-semibold text-slate-700">{m.customer_name}</span> •{" "}
        {m.location_line} • {brandName} © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
