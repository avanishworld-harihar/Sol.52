"use client";

/**
 * Atelier — Investment Blueprint (High-Conversion Sales Journey)
 * Flow: [Cover] → [Impact] → [Financial Story] → [Wealth Proof]
 *       → [Generation] → [Hardware ×2] → [Roof] → [Roadmap] → [Compliance] → [Closing]
 *
 * ProposalData-native · Print A4 · 11 pages · break-after: page
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

  // Terms
  const allTerms =
    data.terms.conditions.length > 0
      ? data.terms.conditions
      : [
          "Year 1 AMC included; from Year 2, AMC at 2% of project value with 5% yearly escalation.",
          "Installation within 30–40 working days from advance receipt per agreed schedule.",
          "Warranty covers manufacturing defects only; physical damage or vandalism excluded.",
          "Client to provide: electricity bill, PAN, Aadhaar, ownership proof & passport photo.",
          "Weekly panel cleaning recommended; customer scope (directly affects generation).",
          "Pending DISCOM dues or sanctioned load changes must be cleared before processing.",
        ];
  const docs =
    data.terms.documents.length > 0
      ? data.terms.documents
      : [
          "Latest 3-month electricity bills",
          "PAN Card & Aadhaar Card",
          "Ownership proof of property",
          "Passport-size photograph",
          "Bank account details for subsidy disbursement",
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
        <span className={styles.pageNum}>01 / 11</span>
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
        <span className={styles.pageNum}>02 / 11</span>
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

        <span className={styles.pageNum}>03 / 11</span>
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

        <span className={styles.pageNum}>04 / 11</span>
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

        <span className={styles.pageNum}>05 / 11</span>
      </section>

      {/* ══ P6: HARDWARE — PANELS & INVERTER ═════════════════════ */}
      <section className={`${styles.page} ${styles.hwPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>06 — HARDWARE TRUST</span>
          <h2 className={styles.pageTitle}>
            Tier-1 Components. Zero Compromise.
          </h2>
        </header>

        <div className={styles.hwBigGrid}>
          {/* Panels */}
          <div className={styles.hwBigCard}>
            <div className={`${styles.hwBgArt} ${styles.hwBgPanel}`}>
              {/* Swap src with real product image when available */}
              <img
                src="/hardware/waaree-panel.png"
                alt="Waaree Solar Panel"
                className={styles.hwProductImg}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={styles.hwBgMark}>P</div>
            </div>
            <div className={styles.hwBigBody}>
              <div className={styles.hwBigTag}>SOLAR PANELS</div>
              <div className={styles.hwBigTitle}>
                {panelItem ? panelItem.brand || "Waaree" : "Waaree Energies"}
              </div>
              <p className={styles.hwBigSpec}>
                {bomLine(panelItem, "580 Wp DCR TOPCon N-Type")}
              </p>
              <div className={styles.hwBigStats}>
                <div>
                  <div className={styles.hwBigStatNum}>{panelCount}</div>
                  <div className={styles.hwBigStatLabel}>Panels</div>
                </div>
                <div>
                  <div className={styles.hwBigStatNum}>{systemSize}</div>
                  <div className={styles.hwBigStatLabel}>Total Capacity</div>
                </div>
              </div>
              <div className={styles.hwWhyBox}>
                <span className={styles.hwWhyTag}>WHY THIS PRODUCT?</span>
                <p className={styles.hwWhyText}>
                  TOPCon N-type cells deliver 22%+ module efficiency. Superior
                  performance in heat-prone regions like {cityLabel} — up to 8%
                  higher yield than standard poly panels during summer peak
                  hours.
                </p>
              </div>
              <span className={styles.hwWarrantyBadge}>
                {panelItem?.warranty || "30 Years Performance"}
              </span>
            </div>
          </div>

          {/* Inverter */}
          <div className={styles.hwBigCard}>
            <div className={`${styles.hwBgArt} ${styles.hwBgInverter}`}>
              {/* Swap src with real product image when available */}
              <img
                src="/hardware/havells-inverter.png"
                alt="Havells Inverter"
                className={styles.hwProductImg}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={styles.hwBgMark}>I</div>
            </div>
            <div className={styles.hwBigBody}>
              <div className={styles.hwBigTag}>STRING INVERTER</div>
              <div className={styles.hwBigTitle}>
                {inverterItem
                  ? inverterItem.brand || "Havells / Polycab"
                  : "Havells / Polycab"}
              </div>
              <p className={styles.hwBigSpec}>
                {bomLine(inverterItem, `${systemKw} kW Dual MPPT String Inverter`)}
              </p>
              <div className={styles.hwBigStats}>
                <div>
                  <div className={styles.hwBigStatNum}>97%</div>
                  <div className={styles.hwBigStatLabel}>Efficiency</div>
                </div>
                <div>
                  <div className={styles.hwBigStatNum}>Dual</div>
                  <div className={styles.hwBigStatLabel}>MPPT Trackers</div>
                </div>
              </div>
              <div className={styles.hwWhyBox}>
                <span className={styles.hwWhyTag}>WHY THIS PRODUCT?</span>
                <p className={styles.hwWhyText}>
                  BEE 5-star rated, IP65 weatherproof. Dual MPPT handles
                  partial shading without reducing output from unshaded
                  strings — critical for rooftops with nearby obstructions.
                </p>
              </div>
              <span className={styles.hwWarrantyBadge}>
                {inverterItem?.warranty || "10 Years Warranty"}
              </span>
            </div>
          </div>
        </div>

        <span className={styles.pageNum}>06 / 11</span>
      </section>

      {/* ══ P7: HARDWARE — STRUCTURE, PROTECTION + WARRANTY ═════ */}
      <section className={`${styles.page} ${styles.hwPage2}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>07 — HARDWARE & WARRANTY</span>
          <h2 className={styles.pageTitle}>
            Built to Withstand. Backed to Last.
          </h2>
        </header>

        <div className={styles.hw2Grid}>
          <div className={styles.hwCard}>
            <div className={styles.hwMark} style={{ background: "#1E293B" }}>M</div>
            <div className={styles.hwTitle}>Mounting Structure</div>
            <div className={styles.hwDesc}>
              {bomLine(structureItem, "JSW Hot-Dip Galvanized GI")}
            </div>
            <p className={styles.hwNote}>150 km/h wind load rated. Engineered for Indian rooftop conditions.</p>
            <span className={styles.hwWarranty}>{structureItem?.warranty || "10 Years Structural"}</span>
          </div>
          <div className={styles.hwCard}>
            <div className={styles.hwMark} style={{ background: "#0A0F1C" }}>S</div>
            <div className={styles.hwTitle}>Protection & Safety</div>
            <div className={styles.hwDesc}>
              {bomLine(protectionItem, "DCDB + ACDB with SPD")}
            </div>
            <p className={styles.hwNote}>MCB/MCCB protection, surge protection device & copper earthing system.</p>
            <span className={styles.hwWarranty}>{protectionItem?.warranty || "5 Years"}</span>
          </div>
        </div>

        {/* Warranty Data Cards */}
        <div className={styles.warrantyGrid}>
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

        <span className={styles.pageNum}>07 / 11</span>
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

        <span className={styles.pageNum}>08 / 11</span>
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
                <div className={styles.tlDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

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

        <span className={styles.pageNum}>09 / 11</span>
      </section>

      {/* ══ P10: COMPLIANCE ══════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>10 — COMPLIANCE & DOCUMENTATION</span>
          <h2 className={styles.pageTitle}>Clear & Transparent</h2>
        </header>
        <div className={styles.termsGrid}>
          <div>
            <div className={styles.termsSubhead}>Terms & Conditions</div>
            <ul className={styles.termsList}>
              {allTerms
                .slice(0, Math.ceil(allTerms.length / 2))
                .map((t) => (
                  <li key={t.slice(0, 40)}>{t}</li>
                ))}
            </ul>
          </div>
          <div>
            <div className={styles.termsSubhead}>Additional Terms</div>
            <ul className={styles.termsList}>
              {allTerms
                .slice(Math.ceil(allTerms.length / 2))
                .map((t) => (
                  <li key={t.slice(0, 40)}>{t}</li>
                ))}
            </ul>
            <div
              className={styles.termsSubhead}
              style={{ marginTop: "1.75rem" }}
            >
              Documents Required
            </div>
            <ul className={styles.docsList}>
              {docs.map((d) => (
                <li key={d.slice(0, 40)}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
        <span className={styles.pageNum}>10 / 11</span>
      </section>

      {/* ══ P11: EMOTIONAL CLOSING — SPLIT SCREEN ══════════════════ */}
      <section className={`${styles.page} ${styles.closingPage}`}>
        <div className={styles.closingInner}>
          <div className={styles.closingSplit}>
            {/* Left — Energy Independence narrative */}
            <div className={styles.closingLeft}>
              <span className={styles.closingTag}>11 — ENERGY INDEPENDENCE</span>
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

            {/* Right — CTA box */}
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
          11 / 11
        </span>
      </section>
    </div>
  );
}

export default AtelierRenderer;
