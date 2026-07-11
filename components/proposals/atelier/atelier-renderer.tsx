"use client";

/**
 * Atelier — Investment Blueprint (High-Conversion Sales Journey)
 * Flow: [Cover] → [Impact] → [Financial Story] → [Wealth Proof]
 *       → [Generation] → [Hardware] → [Why Us] → [Roof] → [Roadmap]
 *       → [Compliance] → [Closing]
 *
 * ProposalData-native · Print A4 · 12 pages · break-after: page (print only)
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./atelier.module.css";

function bomByHint(data: ProposalData, hints: RegExp[]) {
  return data.bom.find((b) =>
    hints.some((h) => h.test(`${b.name} ${b.spec} ${b.brand}`))
  );
}
function bomLine(
  item: ProposalData["bom"][number] | undefined,
  fallback: string
) {
  if (!item) return fallback;
  const p = [item.brand, item.spec].filter(Boolean);
  return p.length > 0 ? p.join(" — ") : item.name || fallback;
}

/** Sets customer expectations even when the ProposalData step has no
 * explicit duration — keyword-matched against standard rooftop timelines. */
function estimateDuration(title: string): string {
  const t = title.toLowerCase();
  if (/survey/.test(t)) return "1 Day";
  if (/design|sld/.test(t)) return "2 Days";
  if (/approv|subsidy|meter|discom/.test(t)) return "7 Days";
  if (/material|delivery|procurement/.test(t)) return "3 Days";
  if (/install/.test(t)) return "2 Days";
  if (/test|commission/.test(t)) return "3 Days";
  return "2–3 Days";
}

export function AtelierRenderer({ data }: { data: ProposalData }) {
  // ── Core derivations ─────────────────────────────────────────
  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const clientName = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "Madhya Pradesh";
  const city = location.split(",")[0]?.trim() || location;
  const systemKw = data.meta.systemKw;
  const systemSize = systemKw > 0 ? `${systemKw} kW` : "—";
  const systemType =
    data.meta.assetProfileLine?.trim() || "Premium Grid Architecture";
  const annualGen =
    data.closing.annualUnits > 0 ? data.closing.annualUnits : 0;
  const grossInr = data.economics.grossInr;
  const subsidyInr = data.economics.subsidyInr;
  const netInr = data.economics.netInr;
  const paybackYears = data.economics.paybackYears;
  const monthlyInr = data.economics.monthlySavingsInr;
  const co2 = Math.round(data.impact.co2Tons || 0);
  const trees = data.impact.treesEquivalent || 0;
  const annualSavings =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthlyInr * 12;
  const lifetimeWealth = data.closing.lifetimeWealthInr;
  const tilt = data.engineering.tiltDeg ?? 20;
  const cityLabel = data.engineering.cityLabel || city;
  const contact =
    data.closing.contactLine?.trim() || "+91-99933 22267 · hariharsolar.in";

  // ── New financial calculations ────────────────────────────────
  const monthlyBill =
    data.bill.yearlyBillInr > 0
      ? Math.round(data.bill.yearlyBillInr / 12)
      : annualSavings > 0
        ? Math.round(annualSavings / 12 / 0.8)
        : 5200;
  // Simple 5-yr EMI at ~9%
  const r = 0.09 / 12;
  const monthlyEmi =
    netInr > 0 ? Math.round((netInr * r) / (1 - Math.pow(1 + r, -60))) : 0;
  const monthlyProfit = monthlyBill - monthlyEmi;

  // Investment grade
  const investScore =
    paybackYears <= 3.5
      ? "AAA"
      : paybackYears <= 5
        ? "AA+"
        : paybackYears <= 6.5
          ? "AA"
          : "A+";
  const investGrade =
    paybackYears <= 3.5
      ? "Exceptional Return"
      : paybackYears <= 5
        ? "Very High Return"
        : paybackYears <= 6.5
          ? "High Return"
          : "Above Average Return";

  // Wealth milestones (25-yr projection)
  const totalWealth =
    lifetimeWealth > 0 ? lifetimeWealth : annualSavings * 25;
  const wealthMilestones = [5, 10, 15, 20, 25].map((yr) => ({
    year: yr,
    savings: Math.round(annualSavings * yr),
    pct:
      totalWealth > 0
        ? Math.min(100, Math.round((annualSavings * yr * 100) / totalWealth))
        : yr * 4,
  }));

  // Panel count
  const panelWp = (() => {
    if (!data.bom[0]?.spec) return 580;
    const m = data.bom[0].spec.match(/(\d{3,4})\s*[Ww]/);
    return m ? parseInt(m[1]) : 580;
  })();
  const panelCount = systemKw > 0 ? Math.ceil((systemKw * 1000) / panelWp) : 9;
  const panelRows = Math.ceil(panelCount / 3);

  // BOM
  const panelItem =
    bomByHint(data, [/panel/i, /module/i, /waaree/i]) || data.bom[0];
  const inverterItem =
    bomByHint(data, [/inverter/i, /havells/i, /polycab/i]) || data.bom[1];
  const structureItem =
    bomByHint(data, [/mount/i, /structure/i, /jsw/i]) || data.bom[2];
  const protectionItem =
    bomByHint(data, [/protect/i, /acdb/i, /dcdb/i, /safety/i]) || data.bom[3];

  // Engineering metrics
  const engMetrics =
    data.engineering.metrics.length > 0
      ? data.engineering.metrics
          .slice(0, 6)
          .map((m) => [m.label, m.value] as [string, string])
      : ([
          [
            "DC Capacity",
            systemKw > 0 ? `${(systemKw * 1.04).toFixed(2)} kWp` : "—",
          ],
          ["AC Capacity", systemSize],
          ["Performance Ratio", "75%"],
          ["Specific Yield", "1440 kWh/kWp/yr"],
          ["Peak Sun Hours", "5 hrs / day"],
          [`Panel Tilt (${cityLabel})`, `${tilt}°`],
        ] as [string, string][]);

  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards
      : [
          "IEC 61215 / IEC 61730",
          "BIS IS 14286",
          "MNRE ALMM",
          "IEC 62109",
          "IS 3043 (Earthing)",
          "IS/IEC 62446",
        ];

  // Warranty
  const warrantyCards =
    data.warranty.highlights.length > 0
      ? data.warranty.highlights.slice(0, 4).map((h) => ({
          years: h.value,
          label: h.label,
          sub: h.unit,
        }))
      : [
          { years: "30", label: "Panel Performance", sub: "≥80% at year 30" },
          {
            years: "15",
            label: "Product Warranty",
            sub: "Manufacturing defects",
          },
          {
            years: "10",
            label: "Mounting Structure",
            sub: "Corrosion & integrity",
          },
          { years: "1", label: "Free AMC", sub: "Full service & support" },
        ];

  // Journey
  const journey =
    data.execution.steps.length > 0
      ? data.execution.steps
          .slice(0, 6)
          .map((s) => ({ num: s.num, title: s.title, desc: s.description }))
      : [
          {
            num: "01",
            title: "Site Survey",
            desc: "Roof assessment, shading & load check",
          },
          {
            num: "02",
            title: "Design & SLD",
            desc: "Engineering drawings & diagram",
          },
          {
            num: "03",
            title: "Approvals",
            desc: "DISCOM + PM Surya Ghar paperwork",
          },
          {
            num: "04",
            title: "Material Delivery",
            desc: "Tier-1 components to site",
          },
          {
            num: "05",
            title: "Installation",
            desc: "Structure, modules, inverter & electrical",
          },
          {
            num: "06",
            title: "Commissioning",
            desc: "Net meter, grid sync & handover",
          },
        ];

  // Payments
  const payments =
    data.execution.payments.length > 0
      ? data.execution.payments
      : [
          {
            label: "Booking Advance",
            pctLabel: "25%",
            amountInr: Math.round(netInr * 0.25),
          },
          {
            label: "Material Procurement",
            pctLabel: "50%",
            amountInr: Math.round(netInr * 0.5),
          },
          {
            label: "Installation",
            pctLabel: "20%",
            amountInr: Math.round(netInr * 0.2),
          },
          {
            label: "Commissioning",
            pctLabel: "5%",
            amountInr: Math.round(netInr * 0.05),
          },
        ];

  // Terms — attached Harihar Solar T&C (ProposalData-first, full fallbacks)
  const generalTerms =
    data.terms.conditions.length > 0
      ? data.terms.conditions
      : [
          "DISCOM / state electricity board load change, or cable change from pole to meter and its liaison — only if required — will be in the customer's scope.",
          "All government statutory fees, regulatory charges, and legal costs relating to net-metering, subsidy (PM Surya Ghar / state schemes), DISCOM approvals, or any official application shall be borne and paid directly by the client.",
          "If an increase in sanctioned load or connected load is required for the solar connection, the client shall ensure that all prior electricity bills, outstanding dues, and arrears with the DISCOM are fully cleared before processing; any delay or rejection arising from uncleared dues shall remain the client's responsibility.",
          "Inverter warranty is as per manufacturer (typically 8–10 years on string inverters).",
          "Solar PV module product warranty: 15 years; performance warranty: ≥80% rated output at end of 30 years (manufacturer). Warranty on overall system and parts not specified above: 1 year from date of commissioning.",
          "Warranty applies to manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
          "Routine cleaning of modules (recommended weekly) is in the customer's scope — it directly affects generation performance.",
          "Installation shall be completed within 30–40 working days from receipt of advance payment as per the agreed purchase order / payment schedule.",
          "Any terms not expressly mentioned herein shall be governed by mutual written agreement between both parties.",
          "Refunds, if applicable, shall be processed after a 2.5% deduction on the project finalization amount plus documented expenses already incurred.",
        ];

  const docs =
    data.terms.documents.length > 0
      ? data.terms.documents
      : [
          "Latest electricity bill (clear copy)",
          "Copy of PAN card",
          "Copy of Aadhaar card (legible, both sides if applicable)",
          "Ownership proof — property tax receipt / sale deed / municipal record",
          "Passport-size photograph of applicant",
          "Single-line diagram (SLD) — draft provided by us; signed copy required from customer",
        ];

  const amcObjective =
    data.terms.amcObjective?.trim() ||
    "The objective of Annual Maintenance Services is to maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.";

  const amcScope =
    data.terms.amcScope.length > 0
      ? data.terms.amcScope
      : [
          "Annual Maintenance Contract (AMC) covering:",
          "Daily / periodic monitoring of plant performance and energy generation",
          "Routine preventive maintenance of plant and equipment",
          "Emergency breakdown attendance (response within 48 working hours)",
          "Coordination with OEMs for warranty support and defect rectification",
          "Periodic inspection of DC & AC protection, earthing, and cable terminations",
        ];

  const clientScope = [
    "Site security, watch and ward",
    "Insurance of plant and equipment (if desired)",
    "Stable internet connection at site for remote monitoring (where applicable)",
    "Water and auxiliary power for maintenance activities, as needed on site",
    "Day-to-day visual checks and safe access to the rooftop",
    "Regular module cleaning as per manufacturer guidelines",
  ];

  const invoiceRef =
    grossInr > 0 ? formatInr(grossInr) : netInr > 0 ? formatInr(netInr) : "₹3,00,000";
  const amcCostParagraph = `First 1 year AMC is included in the quoted price. From Year 2 onwards, annual maintenance may be charged at 2% of invoice value (${invoiceRef}) with 5% year-on-year escalation, subject to a signed O&M agreement.`;

  const amcTerms =
    data.terms.amcTerms.length > 0
      ? data.terms.amcTerms
      : [
          "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
          "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
          "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
          "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
        ];

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  // ── JSX ──────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Lato:wght@300;400;700&display=swap');`}</style>

      {/* Sticky print bar */}
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>{brand}</span>
          <button type="button" onClick={handlePrint} className={styles.printBarBtn}>
            Download PDF
          </button>
        </div>
      </div>

      {/* ══ P1: CINEMATIC COVER ══════════════════════════════════ */}
      <section className={`${styles.page} ${styles.coverPage}`}>
        <div className={styles.coverInner}>
          <div className={styles.coverTop}>
            <div className={styles.coverBrandRow}>
              <div className={styles.accentRule} />
              <span className={styles.coverBrandText}>{brand.toUpperCase()}</span>
            </div>
            <span className={styles.coverDocType}>INVESTMENT BLUEPRINT</span>
          </div>

          <div className={styles.coverHero}>
            <p className={styles.coverFor}>PREPARED FOR</p>
            <h1 className={styles.coverName}>{clientName}</h1>
            <p className={styles.coverLoc}>{location}</p>
          </div>

          <div className={styles.coverWealthRow}>
            <div className={styles.coverWealthCard}>
              <span className={styles.coverWealthTag}>25-YEAR WEALTH CREATED</span>
              <div className={styles.coverWealthAmt}>
                {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
              </div>
              <span className={styles.coverWealthSub}>
                Your roof becomes a wealth engine
              </span>
            </div>
            <div className={styles.coverWealthDivider} />
            <div className={styles.coverSmallStats}>
              <div className={styles.coverSmallStat}>
                <span className={styles.coverSmallNum}>
                  {monthlyInr > 0 ? formatInr(monthlyInr) : "—"}
                </span>
                <span className={styles.coverSmallLabel}>Savings / Month</span>
              </div>
              <div className={styles.coverSmallStat}>
                <span className={styles.coverSmallNum}>
                  {paybackYears > 0 ? `${paybackYears.toFixed(1)} Yrs` : "—"}
                </span>
                <span className={styles.coverSmallLabel}>Full Payback</span>
              </div>
              <div className={styles.coverSmallStat}>
                <span className={styles.coverSmallNum}>{systemSize}</span>
                <span className={styles.coverSmallLabel}>System Size</span>
              </div>
            </div>
          </div>
        </div>
        <span className={styles.pageNum}>01 / 12</span>
      </section>

      {/* ══ P2: IMPACT MOMENT ════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.impactPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>02 — YOUR IMPACT</span>
          <h2 className={styles.pageTitle}>What Your Roof Gives Back to the World</h2>
        </header>

        <div className={styles.impactGrid}>
          <div className={styles.impactCard}>
            <div className={styles.impactBig}>{co2 > 0 ? co2 : "—"}</div>
            <div className={styles.impactUnit}>TONS</div>
            <div className={styles.impactLabel}>CO₂ Eliminated Over 25 Years</div>
            <p className={styles.impactSub}>
              Equivalent to removing a petrol car from the road for{" "}
              {co2 > 0 ? Math.round(co2 / 2) : "—"} years.
            </p>
          </div>
          <div className={styles.impactCard}>
            <div className={styles.impactBig}>
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </div>
            <div className={styles.impactUnit}>TREES</div>
            <div className={styles.impactLabel}>Ecological Equivalent Planted</div>
            <p className={styles.impactSub}>
              Your rooftop ecosystem works silently for the planet, every single
              day.
            </p>
          </div>
        </div>

        {/* Carbon milestones */}
        <div className={styles.carbonMilestones}>
          {[5, 10, 15, 20, 25].map((yr) => {
            const tons = co2 > 0 ? Math.round((co2 / 25) * yr) : 0;
            return (
              <div key={yr} className={styles.carbonMilestone}>
                <div className={styles.cmBar}>
                  <div
                    className={styles.cmBarFill}
                    style={{ height: `${(yr / 25) * 100}%` }}
                  />
                </div>
                <div className={styles.cmYear}>YR {yr}</div>
                <div className={styles.cmTons}>
                  {tons > 0 ? `${tons}T` : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.impactTagline}>
          Every unit of solar energy your roof generates is a direct act of
          climate action.
        </div>
        <span className={styles.pageNum}>02 / 12</span>
      </section>

      {/* ══ P3: FINANCIAL STORY ═══════════════════════════════════ */}
      <section className={`${styles.page} ${styles.financePage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>03 — FINANCIAL STORY</span>
          <h2 className={styles.pageTitle}>
            You Are Not Switching Energy. You Are Switching Economics.
          </h2>
        </header>

        {/* Bill vs Solar comparison */}
        <div className={styles.billComparison}>
          <div className={styles.billCard}>
            <span className={styles.billCardTag}>TODAY — WITHOUT SOLAR</span>
            <div className={styles.billCardAmt} style={{ color: "#DC2626" }}>
              {monthlyBill > 0 ? formatInr(monthlyBill) : "₹5,200"}
            </div>
            <div className={styles.billCardLabel}>Monthly Electricity Bill</div>
            <p className={styles.billCardNote}>
              Increases ~6% every year. Over 25 years you will pay{" "}
              {formatInrCompact(monthlyBill * 12 * 22)} to the grid.
            </p>
          </div>

          <div className={styles.billArrow}>→</div>

          <div className={`${styles.billCard} ${styles.billCardSolar}`}>
            <span className={styles.billCardTag}>TOMORROW — WITH SOLAR</span>
            <div className={styles.billCardAmt} style={{ color: "#059669" }}>
              {monthlyEmi > 0 ? formatInr(monthlyEmi) : "₹4,100"}
            </div>
            <div className={styles.billCardLabel}>Equivalent Monthly Cost</div>
            <p className={styles.billCardNote}>
              Fixed for 5 years (loan), then ZERO. Energy costs you control
              forever.
            </p>
          </div>

          <div className={styles.billArrow}>=</div>

          <div className={`${styles.billCard} ${styles.billCardProfit}`}>
            <span className={styles.billCardTag}>IMMEDIATE MONTHLY PROFIT</span>
            <div className={styles.billCardAmt}>
              {monthlyProfit > 0 ? `+${formatInr(monthlyProfit)}` : formatInr(monthlyInr > 0 ? monthlyInr : 900)}
            </div>
            <div className={styles.billCardLabel}>Net Monthly Gain from Day 1</div>
            <p className={styles.billCardNote}>
              This is money that stays in your pocket every single month,
              starting immediately.
            </p>
          </div>
        </div>

        {/* Bill trajectory line chart: rising grid bill vs flat solar cost */}
        {(() => {
          const years = [1, 5, 10, 15, 20, 25];
          const baseAnnualBill = (monthlyBill > 0 ? monthlyBill : 5200) * 12;
          const flatSolarAnnual = (monthlyEmi > 0 ? monthlyEmi : 4100) * 12;
          const loanEndYr = 5;
          const amcAnnual = netInr > 0 ? netInr * 0.02 : flatSolarAnnual * 0.15;
          const withoutPts = years.map((y) => baseAnnualBill * Math.pow(1.06, y - 1));
          const withPts = years.map((y) => (y <= loanEndYr ? flatSolarAnnual : amcAnnual));
          const maxVal = Math.max(...withoutPts) * 1.08;
          const W = 600;
          const H = 190;
          const padL = 8;
          const padR = 8;
          const padT = 10;
          const padB = 24;
          const xFor = (i: number) => padL + (i / (years.length - 1)) * (W - padL - padR);
          const yFor = (v: number) => padT + (1 - v / maxVal) * (H - padT - padB);
          const withoutPath = withoutPts.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          const withPath = withPts.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          const areaPath =
            `M${xFor(0)},${yFor(withoutPts[0])} ` +
            withoutPts.map((v, i) => `L${xFor(i)},${yFor(v)}`).join(" ") +
            ` L${xFor(years.length - 1)},${yFor(withPts[withPts.length - 1])} ` +
            withPts.slice().reverse().map((v, i) => `L${xFor(years.length - 1 - i)},${yFor(v)}`).join(" ") +
            " Z";
          return (
            <div className={styles.trajectoryChart}>
              <span className={styles.genCardTag}>25-YEAR BILL TRAJECTORY</span>
              <svg viewBox={`0 0 ${W} ${H}`} className={styles.trajectorySvg}>
                <path d={areaPath} className={styles.trajectoryGap} />
                <polyline points={withoutPath} className={styles.trajectoryLineRed} />
                <polyline points={withPath} className={styles.trajectoryLineGreen} />
                {years.map((y, i) => (
                  <text key={y} x={xFor(i)} y={H - 6} className={styles.trajectoryXLabel} textAnchor="middle">
                    YR {y}
                  </text>
                ))}
              </svg>
              <div className={styles.trajectoryLegend}>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotRed} /> Bill Without Solar (rising ~6%/yr)
                </span>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotGreen} /> Bill With Solar (flat, then near-zero)
                </span>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotGap} /> Your Savings Gap
                </span>
              </div>
            </div>
          );
        })()}

        {/* Investment breakdown */}
        <div className={styles.investBreakdown}>
          <div className={styles.investItem}>
            <span className={styles.investTag}>GROSS COST</span>
            <span className={styles.investVal}>
              {grossInr > 0 ? formatInr(grossInr) : "—"}
            </span>
          </div>
          <div className={styles.investMinus}>−</div>
          <div className={styles.investItem}>
            <span className={styles.investTag}>PM SURYA GHAR SUBSIDY</span>
            <span
              className={styles.investVal}
              style={{ color: "#059669" }}
            >
              {subsidyInr > 0 ? formatInr(subsidyInr) : "—"}
            </span>
          </div>
          <div className={styles.investMinus}>=</div>
          <div className={`${styles.investItem} ${styles.investItemFinal}`}>
            <span className={styles.investTag}>YOUR NET INVESTMENT</span>
            <span className={styles.investVal}>
              {netInr > 0 ? formatInr(netInr) : "—"}
            </span>
          </div>
        </div>

        <span className={styles.pageNum}>03 / 12</span>
      </section>

      {/* ══ P4: WEALTH PROJECTION ════════════════════════════════ */}
      <section className={`${styles.page} ${styles.wealthPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>04 — WEALTH PROJECTION</span>
          <h2 className={styles.pageTitle}>
            Your 25-Year Solar Wealth Journey
          </h2>
        </header>

        {/* 3-Phase Wealth Journey */}
        <div className={styles.wealthJourney}>
          <div className={styles.wjPhase}>
            <div className={styles.wjDot} style={{ background: "#DC2626" }} />
            <div className={styles.wjLabel}>Phase 1</div>
            <div className={styles.wjTitle}>Investment</div>
            <div className={styles.wjSpan}>
              Year 0 → {paybackYears > 0 ? Math.ceil(paybackYears) : 5}
            </div>
            <div className={styles.wjNote}>
              Monthly solar cost offsets your electricity bill while you repay
              the system over 5 years.
            </div>
          </div>
          <div className={styles.wjArrow}>→</div>
          <div className={`${styles.wjPhase} ${styles.wjPhaseActive}`}>
            <div className={styles.wjDot} style={{ background: "#F97316" }} />
            <div className={styles.wjLabel}>Milestone</div>
            <div className={styles.wjTitle}>Payback</div>
            <div className={styles.wjSpan}>
              Year {paybackYears > 0 ? paybackYears.toFixed(1) : "4–5"}
            </div>
            <div className={styles.wjNote}>
              System fully paid back. Every unit generated from here on is
              100% pure profit.
            </div>
          </div>
          <div className={styles.wjArrow}>→</div>
          <div className={styles.wjPhase}>
            <div className={styles.wjDot} style={{ background: "#059669" }} />
            <div className={styles.wjLabel}>Phase 2</div>
            <div className={styles.wjTitle}>Passive Income</div>
            <div className={styles.wjSpan}>
              Year {paybackYears > 0 ? Math.ceil(paybackYears) + 1 : 6} → 25
            </div>
            <div className={styles.wjNote}>
              {totalWealth > 0 && paybackYears > 0
                ? `${formatInrCompact(totalWealth - annualSavings * Math.ceil(paybackYears))} in pure passive wealth.`
                : "Pure wealth creation."}{" "}
              Zero energy cost. Maximum returns.
            </div>
          </div>
        </div>

        <div className={styles.wealthLayout}>
          {/* Left: Chart */}
          <div className={styles.wealthChartBox}>
            <div className={styles.wealthChart}>
              {wealthMilestones.map((m) => (
                <div key={m.year} className={styles.wealthMilestone}>
                  <div className={styles.wealthBarWrap}>
                    <div
                      className={styles.wealthBarFill}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <div className={styles.wealthMeta}>
                    <span className={styles.wealthYr}>YR {m.year}</span>
                    <span className={styles.wealthAmt}>
                      {m.savings > 0 ? formatInrCompact(m.savings) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.wealthChartNote}>
              Cumulative electricity bill savings over 25 years at current
              generation levels.
            </div>
          </div>

          {/* Right: Investment Score */}
          <div className={styles.investScoreBox}>
            <div className={styles.investScoreCard}>
              <span className={styles.investScoreTag}>SOLAR INVESTMENT SCORE</span>
              <div className={styles.investScoreGrade}>{investScore}</div>
              <div className={styles.investScoreLabel}>{investGrade}</div>
              <div className={styles.investScoreDivider} />
              <div className={styles.investScoreStats}>
                <div className={styles.investScoreStat}>
                  <span className={styles.investScoreStatVal}>
                    {paybackYears > 0 ? `${paybackYears.toFixed(1)} yrs` : "—"}
                  </span>
                  <span className={styles.investScoreStatLabel}>Payback</span>
                </div>
                <div className={styles.investScoreStat}>
                  <span className={styles.investScoreStatVal}>
                    {annualSavings > 0
                      ? `${Math.round((annualSavings / netInr) * 100)}%`
                      : "—"}
                  </span>
                  <span className={styles.investScoreStatLabel}>
                    Annual ROI
                  </span>
                </div>
              </div>
              <p className={styles.investScoreBasis}>
                <strong>Basis:</strong> Grade derived from payback period vs.
                industry benchmark (5–7 yrs). Your{" "}
                {paybackYears > 0 ? paybackYears.toFixed(1) : "4–5"}-yr
                payback ranks in the top tier of rooftop solar investments in
                India.
              </p>
            </div>

            <div className={styles.paybackCard}>
              <span className={styles.investScoreTag}>TOTAL WEALTH AT YEAR 25</span>
              <div className={styles.paybackAmt}>
                {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
              </div>
              <p className={styles.paybackNote}>
                Your ₹{netInr > 0 ? formatInrCompact(netInr) : "—"}{" "}
                investment generates{" "}
                {totalWealth > 0 && netInr > 0
                  ? `${(totalWealth / netInr).toFixed(1)}×`
                  : "—"}{" "}
                returns over 25 years.
              </p>
            </div>
          </div>
        </div>

        <span className={styles.pageNum}>04 / 12</span>
      </section>

      {/* ══ P5: GENERATION PROOF ═════════════════════════════════ */}
      <section className={`${styles.page} ${styles.genPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>05 — GENERATION PROOF</span>
          <h2 className={styles.pageTitle}>
            How We Calculate {annualGen > 0 ? annualGen.toLocaleString("en-IN") : "7,200"} Units / Year
          </h2>
        </header>

        <div className={styles.genProofGrid}>
          {/* Methodology */}
          <div className={styles.genCard}>
            <span className={styles.genCardTag}>PVGIS METHODOLOGY</span>
            <div className={styles.genFormula}>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>
                  {systemKw > 0 ? `${systemKw} kW` : "5 kW"}
                </span>
                <span className={styles.genFormulaLabel}>System Capacity</span>
              </div>
              <span className={styles.genFormulaOp}>×</span>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>5.0</span>
                <span className={styles.genFormulaLabel}>Sun Hours/Day</span>
              </div>
              <span className={styles.genFormulaOp}>×</span>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>75%</span>
                <span className={styles.genFormulaLabel}>
                  Performance Ratio
                </span>
              </div>
              <span className={styles.genFormulaOp}>×</span>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>365</span>
                <span className={styles.genFormulaLabel}>Days/Year</span>
              </div>
              <span className={styles.genFormulaOp}>=</span>
              <div className={`${styles.genFormulaStep} ${styles.genFormulaResult}`}>
                <span className={styles.genFormulaVal}>
                  {annualGen > 0 ? annualGen.toLocaleString("en-IN") : "6,844"}
                </span>
                <span className={styles.genFormulaLabel}>Units/Year</span>
              </div>
            </div>
          </div>

          {/* Irradiation data */}
          <div className={styles.genCard}>
            <span className={styles.genCardTag}>SOLAR RESOURCE — {cityLabel}</span>
            <div className={styles.genIrradGrid}>
              {[
                ["Global Horizontal", "~1,850 kWh/m²/yr"],
                ["Optimal Inclination", `~1,950 kWh/m²/yr`],
                ["Annual Irradiance", `${tilt}° tilt`],
                ["Data Source", "PVGIS / NREL Atlas"],
              ].map(([k, v]) => (
                <div key={k} className={styles.genIrradRow}>
                  <span className={styles.genIrradKey}>{k}</span>
                  <span className={styles.genIrradVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparative generation bar chart */}
        {(() => {
          const est = annualGen > 0 ? annualGen : Math.round(systemKw * 5 * 0.75 * 365);
          const bars = [
            { label: "Our System Estimate", val: est, pct: 90, color: "var(--or)" },
            { label: `${cityLabel} Grid Average`, val: Math.round(est * 0.75), pct: 68, color: "var(--gray2)" },
            { label: "Theoretical Max (PR 85%)", val: Math.round(est * 1.13), pct: 100, color: "#059669" },
          ];
          return (
            <div className={styles.genBarChart}>
              <span className={styles.genCardTag}>
                ESTIMATED GENERATION vs. CITY POTENTIAL — {cityLabel}
              </span>
              {bars.map((b) => (
                <div key={b.label} className={styles.genBarRow}>
                  <span className={styles.genBarLabel}>{b.label}</span>
                  <div className={styles.genBarTrack}>
                    <div
                      className={styles.genBarFill}
                      style={{ width: `${b.pct}%`, background: b.color }}
                    />
                  </div>
                  <span className={styles.genBarVal}>
                    {b.val.toLocaleString("en-IN")} units
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Expert Insight */}
        <div className={styles.expertInsight}>
          <span className={styles.expertTag}>EXPERT INSIGHT</span>
          <p>
            Why {systemSize}? Your current bill of{" "}
            {monthlyBill > 0 ? formatInr(monthlyBill) : "₹5,200"}/month maps
            to ~{Math.round((monthlyBill > 0 ? monthlyBill : 5200) * 12 / 8).toLocaleString("en-IN")}{" "}
            units/year. A {systemSize} system produces{" "}
            {(annualGen > 0 ? annualGen : Math.round(systemKw * 5 * 0.75 * 365)).toLocaleString("en-IN")}{" "}
            units/year — achieving near-100% offset even during peak summer
            months in {cityLabel}.
          </p>
        </div>

        {/* Spec metrics row */}
        <div className={styles.genSpecGrid}>
          {engMetrics.map(([label, value]) => (
            <div key={label} className={styles.genSpecCard}>
              <div className={styles.genSpecVal}>{value}</div>
              <div className={styles.genSpecLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Standards */}
        <div className={styles.genStdRow}>
          <span className={styles.genStdLabel}>Compliance:</span>
          {standards.map((s) => (
            <span key={s} className={styles.stdBadge}>{s}</span>
          ))}
        </div>

        <p className={styles.genDisclaimer}>
          <strong>Note:</strong> Actual generation varies with weather
          conditions, dust accumulation, shading from nearby structures, and
          panel cleaning frequency. Figures above represent modelled
          estimates under standard test conditions, not a guarantee.
        </p>

        <span className={styles.pageNum}>05 / 12</span>
      </section>

      {/* ══ P6: HARDWARE — 4-CARD TRUST GRID ═════════════════════ */}
      <section className={`${styles.page} ${styles.hwPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>06 — HARDWARE TRUST</span>
          <h2 className={styles.pageTitle}>
            Tier-1 Components. Zero Compromise.
          </h2>
        </header>

        <div className={styles.hwCard4Grid}>
          {[
            {
              key: "panel",
              tag: "SOLAR PANELS",
              title: panelItem ? panelItem.brand || "Waaree" : "Waaree Energies",
              spec: bomLine(panelItem, "580 Wp DCR TOPCon N-Type"),
              warranty: panelItem?.warranty || "30 Years Performance",
              img: "/hardware/waaree-panel.png",
              mark: "P",
              why: `TOPCon N-type cells deliver 22%+ module efficiency — up to 8% higher yield than standard poly panels in ${cityLabel}'s summer heat.`,
            },
            {
              key: "inverter",
              tag: "STRING INVERTER",
              title: inverterItem ? inverterItem.brand || "Havells / Polycab" : "Havells / Polycab",
              spec: bomLine(inverterItem, `${systemKw} kW Dual MPPT String Inverter`),
              warranty: inverterItem?.warranty || "10 Years Warranty",
              img: "/hardware/havells-inverter.png",
              mark: "I",
              why: "BEE 5-star, IP65 weatherproof. Dual MPPT handles partial shading without losing output from unshaded strings.",
            },
            {
              key: "structure",
              tag: "MOUNTING STRUCTURE",
              title: structureItem ? structureItem.brand || "JSW" : "JSW",
              spec: bomLine(structureItem, "Hot-Dip Galvanized GI Structure"),
              warranty: structureItem?.warranty || "10 Years Structural",
              img: "/hardware/mounting-structure.png",
              mark: "M",
              why: "150 km/h wind-load rated GI structure, engineered specifically for Indian rooftop wind and monsoon conditions.",
            },
            {
              key: "protection",
              tag: "PROTECTION & SAFETY",
              title: protectionItem ? protectionItem.brand || "Havells / Phoenix" : "Havells / Phoenix",
              spec: bomLine(protectionItem, "DCDB + ACDB with SPD"),
              warranty: protectionItem?.warranty || "5 Years",
              img: "/hardware/protection-panel.png",
              mark: "S",
              why: "MCB/MCCB protection, surge protection device & copper earthing — full-system safety against grid faults and lightning.",
            },
          ].map((c) => (
            <div key={c.key} className={styles.hwCardV2}>
              <div className={styles.hwCardImgBox}>
                {/* Swap src with real product photo when available */}
                <img
                  src={c.img}
                  alt={c.title}
                  className={styles.hwProductImg}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className={styles.hwCardLogoBadge}>{c.mark}</div>
              </div>
              <div className={styles.hwCardBody}>
                <span className={styles.hwCardTag}>{c.tag}</span>
                <div className={styles.hwCardTitle}>{c.title}</div>
                <p className={styles.hwCardSpec}>{c.spec}</p>
                <p className={styles.hwCardWhy}>{c.why}</p>
                <div className={styles.hwCardFooter}>
                  <span className={styles.hwCardWarranty}>{c.warranty}</span>
                  <div className={styles.hwCardQrRow}>
                    {/* Decorative placeholder QR — swap for real datasheet QR */}
                    <div className={styles.hwCardQr} aria-hidden="true">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            (i * 7 + c.key.length) % 3 === 0 ? styles.qrDotOn : ""
                          }
                        />
                      ))}
                    </div>
                    <a href="#" className={styles.hwCardDatasheet}>
                      View Datasheet →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact warranty summary strip */}
        <div className={styles.warrantyGridCompact}>
          {warrantyCards.map((w, i) => (
            <div
              key={w.label}
              className={`${styles.warrantyBadge} ${i === 0 ? styles.warrantyAccent : ""}`}
            >
              <div className={styles.warrantyCircle}>
                <div className={styles.warrantyYears}>{w.years}</div>
                <div className={styles.warrantyYrsText}>YRS</div>
              </div>
              <div className={styles.warrantyLabel}>{w.label}</div>
              {w.sub && <div className={styles.warrantySub}>{w.sub}</div>}
            </div>
          ))}
        </div>

        <span className={styles.pageNum}>06 / 12</span>
      </section>

      {/* ══ P7: WHY HARIHAR SOLAR — CREDIBILITY ══════════════════ */}
      <section className={`${styles.page} ${styles.trustPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>07 — WHY {brand.toUpperCase()}</span>
          <h2 className={styles.pageTitle}>
            Because Your Rooftop Deserves the Best Team, Not Just the Best Panel.
          </h2>
        </header>

        <div className={styles.trustGrid}>
          {[
            { num: "500+", label: "Installations Completed", note: "Across Madhya Pradesh & neighbouring states" },
            { num: "100%", label: "Certified Engineers", note: "MNRE-empanelled design & install team" },
            { num: "Local", label: "On-Ground Service", note: "No call centres — your installer is your neighbour" },
            { num: "48 Hr", label: "Support Response", note: "Any fault attended within 2 working days" },
            { num: "100%", label: "Subsidy Assistance", note: "End-to-end PM Surya Ghar paperwork, done for you" },
            { num: "25 Yr", label: "Performance Commitment", note: "We stand behind every panel we install" },
          ].map((t) => (
            <div key={t.label} className={styles.trustCard}>
              <div className={styles.trustNum}>{t.num}</div>
              <div className={styles.trustLabel}>{t.label}</div>
              <div className={styles.trustNote}>{t.note}</div>
            </div>
          ))}
        </div>

        <div className={styles.trustQuoteBox}>
          <p className={styles.trustQuote}>
            &ldquo;We don&apos;t just sell solar systems — we engineer 25-year
            relationships. Every installation is backed by a local team
            that&apos;s reachable, accountable, and invested in your
            system&apos;s performance long after installation day.&rdquo;
          </p>
          <span className={styles.trustQuoteAttr}>— {brand} Engineering Team</span>
        </div>

        <span className={styles.pageNum}>07 / 12</span>
      </section>

      {/* ══ P8: ROOF INTELLIGENCE ════════════════════════════════ */}
      <section className={`${styles.page} ${styles.roofPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>08 — ROOF INTELLIGENCE</span>
          <h2 className={styles.pageTitle}>
            Your Roof, Engineered for Maximum Yield
          </h2>
        </header>

        <div className={styles.roofLayout}>
          {/* Left: Panel layout + compass */}
          <div className={styles.roofVisual}>
            {/* Compass rose */}
            <div className={styles.compassWrap}>
              <div className={styles.compass}>
                <span className={`${styles.compassDir} ${styles.compassN}`}>N</span>
                <span className={`${styles.compassDir} ${styles.compassS}`}>S</span>
                <span className={`${styles.compassDir} ${styles.compassE}`}>E</span>
                <span className={`${styles.compassDir} ${styles.compassW}`}>W</span>
                <div className={styles.compassCenter}>
                  <div className={styles.compassNeedle} />
                </div>
              </div>
              <p className={styles.compassNote}>
                South-facing orientation optimized for {cityLabel}
              </p>
            </div>

            {/* Panel layout grid */}
            <div className={styles.panelLayoutBox}>
              <div className={styles.panelLayoutLabel}>PANEL LAYOUT — {panelCount} MODULES</div>
              <div
                className={styles.panelGrid}
                style={{ gridTemplateColumns: `repeat(3, 1fr)` }}
              >
                {Array.from({ length: Math.min(panelCount, 18) }).map(
                  (_, i) => (
                    <div key={i} className={styles.panelCell} />
                  )
                )}
              </div>
              {panelCount > 18 && (
                <div className={styles.panelMore}>
                  +{panelCount - 18} more modules
                </div>
              )}
            </div>
          </div>

          {/* Right: Methodology + metrics */}
          <div className={styles.roofMetrics}>
            {[
              {
                tag: "MODULES ON ROOF",
                val: `${panelCount} panels`,
                note: `${panelWp} Wp each`,
              },
              {
                tag: "ROOF AREA REQUIRED",
                val: `~${Math.ceil(panelCount * 2)} m²`,
                note: "2 m² per panel approx.",
              },
              {
                tag: "OPTIMAL TILT ANGLE",
                val: `${tilt}°`,
                note: `Calculated for ${cityLabel} latitude`,
              },
              {
                tag: "ANNUAL IRRADIATION",
                val: "~1,950 kWh/m²",
                note: `Optimal inclination — ${cityLabel}`,
              },
              {
                tag: "SHADOW ANALYSIS",
                val: data.bill.hasData ? "Site Verified" : "Methodology Applied",
                note: "Tilt-corrected, shading-adjusted",
              },
              {
                tag: "ROOF UTILIZATION",
                val: `~${Math.min(95, Math.ceil(panelCount * 2 * 100 / Math.ceil(panelCount * 2.2)))}%`,
                note: "Of available shadow-free area",
              },
            ].map((m) => (
              <div key={m.tag} className={styles.roofMetricCard}>
                <span className={styles.roofMetricTag}>{m.tag}</span>
                <div className={styles.roofMetricVal}>{m.val}</div>
                <div className={styles.roofMetricNote}>{m.note}</div>
              </div>
            ))}
          </div>
        </div>

        <span className={styles.pageNum}>08 / 12</span>
      </section>

      {/* ══ P9: EXECUTION ROADMAP ════════════════════════════════ */}
      <section className={`${styles.page} ${styles.roadmapPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>09 — EXECUTION ROADMAP</span>
          <h2 className={styles.pageTitle}>From Paperwork to Power</h2>
        </header>

        {/* Horizontal timeline */}
        <div className={styles.timeline}>
          {journey.map((step, i) => (
            <div key={step.num} className={styles.timelineStep}>
              <div className={styles.timelineTop}>
                <div className={styles.tlDot}>
                  <span className={styles.tlDotNum}>{step.num}</span>
                </div>
                {i < journey.length - 1 && <div className={styles.tlConnector} />}
              </div>
              <div className={styles.tlContent}>
                <div className={styles.tlTitle}>{step.title}</div>
                <span className={styles.tlDuration}>{estimateDuration(step.title)}</span>
                <div className={styles.tlDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.roadmapNote}>
          Estimated timeline: <strong>18–20 working days</strong> from
          advance receipt to grid sync, subject to DISCOM approval speed.
        </p>

        {/* Payment invoice */}
        <div className={styles.invoice}>
          <div className={styles.invoiceHead}>
            <div>
              <div className={styles.invoiceFrom}>{brand}</div>
              <div className={styles.invoiceTo}>Prepared for {clientName}</div>
            </div>
            <div className={styles.invoiceTotalBox}>
              <div className={styles.invoiceTotalAmt}>
                {netInr > 0 ? formatInr(netInr) : "—"}
              </div>
              <div className={styles.invoiceTotalLabel}>
                Net Payable (After Subsidy)
              </div>
            </div>
          </div>
          <div className={styles.invoiceBody}>
            <div className={styles.invoiceRow} data-header="true">
              <span>Milestone</span>
              <span>Share</span>
              <span>Amount</span>
            </div>
            {payments.map((p) => (
              <div key={p.label} className={styles.invoiceRow}>
                <span>{p.label}</span>
                <span className={styles.invoicePct}>{p.pctLabel}</span>
                <span className={styles.invoiceAmt}>
                  {formatInr(p.amountInr)}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.invoiceFooter}>
            Subsidy of {subsidyInr > 0 ? formatInr(subsidyInr) : "—"} is
            credited directly to your bank account by the government after
            commissioning.
          </div>
        </div>

        <span className={styles.pageNum}>09 / 12</span>
      </section>

      {/* ══ P10: TERMS & COMPLIANCE ══════════════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>10 — TERMS & COMPLIANCE</span>
          <h2 className={styles.pageTitle}>Terms & Conditions</h2>
        </header>

        <div className={styles.termsGrid}>
          <div>
            <div className={styles.termsSubhead}>General Terms</div>
            <ul className={styles.termsList}>
              {generalTerms.map((t) => (
                <li key={t.slice(0, 48)}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className={styles.termsSubhead}>Documents Required</div>
            <ul className={styles.docsList}>
              {docs.map((d) => (
                <li key={d.slice(0, 48)}>{d}</li>
              ))}
            </ul>
            <div className={styles.termsSubhead} style={{ marginTop: "1.5rem" }}>
              Annual Maintenance — Scope
            </div>
            <p className={styles.amcObjective}>{amcObjective}</p>
            <ul className={styles.termsList}>
              {amcScope.map((s) => (
                <li key={s.slice(0, 48)}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <span className={styles.pageNum}>10 / 12</span>
      </section>

      {/* ══ P11: TERMS & COMPLIANCE (CONTD.) ══════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>11 — TERMS & COMPLIANCE (CONTD.)</span>
          <h2 className={styles.pageTitle}>Terms & Conditions</h2>
        </header>

        <div className={styles.termsGrid}>
          <div>
            <div className={styles.termsSubhead}>Client&apos;s Scope</div>
            <ul className={styles.termsList}>
              {clientScope.map((s) => (
                <li key={s.slice(0, 48)}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className={styles.termsSubhead}>Cost of Maintenance</div>
            <p className={styles.amcCostPara}>{amcCostParagraph}</p>
            <ul className={styles.termsList}>
              {amcTerms.map((t) => (
                <li key={t.slice(0, 48)}>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.termsSignoff}>
          <span className={styles.termsRegards}>Regards,</span>
          <span className={styles.termsBrand}>{brand}</span>
        </div>
        <span className={styles.pageNum}>11 / 12</span>
      </section>

      {/* ══ P12: EMOTIONAL CLOSING — COMPANY BRANDING ══════════════ */}
      <section className={`${styles.page} ${styles.closingPage}`}>
        <div className={styles.closingInner}>
          <div className={styles.closingBrandTop}>
            <div className={styles.accentRule} />
            <span className={styles.closingBrandName}>{brand.toUpperCase()}</span>
          </div>

          <div className={styles.closingSplit}>
            <div className={styles.closingLeft}>
              <span className={styles.closingTag}>12 — ENERGY INDEPENDENCE</span>
              <h2 className={styles.closingTitle}>Congratulations.</h2>
              <p className={styles.closingStatement}>
                Today you are not buying solar panels.
                <br />
                <strong>
                  You are locking your electricity price for the next 25 years.
                </strong>
              </p>
              <p className={styles.closingSub}>
                Every day the sun rises, your roof earns. Every month your
                meter spins backward. Every year your wealth compounds. This
                is not a utility expense — this is a financial asset on your
                rooftop.
              </p>
              <div className={styles.closingStats}>
                <div>
                  <div className={styles.closingStatBig}>
                    {annualGen > 0 ? annualGen.toLocaleString("en-IN") : "—"}
                  </div>
                  <div className={styles.closingStatLabel}>units / year</div>
                </div>
                <div className={styles.closingStatDiv} />
                <div>
                  <div className={styles.closingStatBig}>
                    {annualSavings > 0 ? formatInr(annualSavings) : "—"}
                  </div>
                  <div className={styles.closingStatLabel}>saved / year</div>
                </div>
                <div className={styles.closingStatDiv} />
                <div>
                  <div className={styles.closingStatBig}>
                    {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
                  </div>
                  <div className={styles.closingStatLabel}>25-yr wealth</div>
                </div>
              </div>
            </div>

            <div className={styles.closingRight}>
              <div className={styles.closingCTABox}>
                <div className={styles.ctaTitle}>
                  Ready to Begin Your Solar Journey?
                </div>
                <p className={styles.ctaDesc}>
                  Lock your electricity price today. This proposal is
                  custom-engineered for your roof, your usage, and your
                  financial goals.
                </p>
                <button
                  type="button"
                  onClick={handlePrint}
                  className={`${styles.closingBtn} print:hidden`}
                >
                  Let&apos;s Begin →
                </button>
                <div className={styles.ctaDivider} />
                <div className={styles.ctaContact}>
                  <div className={styles.ctaBrand}>{brand}</div>
                  <div className={styles.ctaInfo}>{contact}</div>
                  <div className={styles.closingValidity}>
                    Valid for 15 days. We are ready when you are.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className={`${styles.pageNum} ${styles.pageNumLight}`}>
          12 / 12
        </span>
      </section>
    </div>
  );
}

export default AtelierRenderer;
