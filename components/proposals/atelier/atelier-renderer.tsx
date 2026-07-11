"use client";

/**
 * Atelier — Industrial Minimalist A4 residential proposal (11 pages).
 * Charcoal #1E293B · Aluminum #F1F5F9 · Burnt Orange #F97316
 * ProposalData-native · print-ready (break-after: page per section)
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
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
  // ── derived ──────────────────────────────────────────────────
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

  // BOM
  const panelItem =
    bomByHint(data, [/panel/i, /module/i, /waaree/i]) || data.bom[0];
  const inverterItem =
    bomByHint(data, [/inverter/i, /havells/i, /polycab/i]) || data.bom[1];
  const structureItem =
    bomByHint(data, [/mount/i, /structure/i, /jsw/i]) || data.bom[2];
  const protectionItem =
    bomByHint(data, [/protect/i, /acdb/i, /dcdb/i, /safety/i]) || data.bom[3];

  const hardware = [
    {
      mark: "P",
      title: "Solar Panels",
      desc: bomLine(panelItem, "Tier-1 DCR TOPCon N-Type modules"),
      warranty: panelItem?.warranty || "30 Years Performance",
    },
    {
      mark: "I",
      title: "String Inverter",
      desc: bomLine(inverterItem, "Grid-tie string inverter (Dual MPPT)"),
      warranty: inverterItem?.warranty || "10 Years Warranty",
    },
    {
      mark: "M",
      title: "Mounting Structure",
      desc: bomLine(structureItem, "Hot-dip galvanized GI (150 km/h wind rated)"),
      warranty: structureItem?.warranty || "10 Years Structural",
    },
    {
      mark: "S",
      title: "Protection & Safety",
      desc: bomLine(
        protectionItem,
        "DCDB + ACDB with SPD, MCB/MCCB & Copper Earthing"
      ),
      warranty: protectionItem?.warranty || "5 Years",
    },
  ];

  // Engineering metrics
  const engMetrics =
    data.engineering.metrics.length > 0
      ? data.engineering.metrics
          .slice(0, 8)
          .map((m) => [m.label, m.value] as [string, string])
      : ([
          [
            "DC Capacity",
            systemKw > 0 ? `${(systemKw * 1.04).toFixed(2)} kWp` : "—",
          ],
          ["AC Capacity", systemSize],
          ["DC/AC Ratio", "1.04"],
          ["Peak Sun Hours", "5 hrs / day"],
          ["Performance Ratio", "75%"],
          ["Specific Yield", "1440 kWh/kWp/yr"],
          [
            "Annual Generation",
            annualGen > 0 ? `${annualGen.toLocaleString("en-IN")} units` : "—",
          ],
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
            desc: "Engineering drawings & single-line diagram",
          },
          {
            num: "03",
            title: "Approvals",
            desc: "DISCOM + PM Surya Ghar paperwork",
          },
          {
            num: "04",
            title: "Material Delivery",
            desc: "Tier-1 components delivered to site",
          },
          {
            num: "05",
            title: "Installation",
            desc: "Structure, modules, inverter & electrical",
          },
          {
            num: "06",
            title: "Commissioning",
            desc: "Net meter, grid sync & full handover",
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
          "Warranty covers manufacturing defects only; physical damage or vandalism is excluded.",
          "Client to provide: electricity bill, PAN, Aadhaar, ownership proof & passport photo.",
          "Weekly panel cleaning recommended; this is customer's scope as it directly affects generation.",
          "Pending DISCOM dues or sanctioned load changes must be cleared by client before processing.",
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

  const half = Math.ceil(allTerms.length / 2);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className={styles.wrapper}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Lato:wght@300;400;700&display=swap');`}</style>

      {/* Print bar */}
      <div className={`${styles.printBar} print:hidden`}>
        <div className={styles.printBarInner}>
          <button
            type="button"
            onClick={handlePrint}
            className={styles.printBarBtn}
          >
            Download as PDF
          </button>
        </div>
      </div>

      {/* ══ P1: COVER ══════════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.coverPage}`}>
        <div className={styles.coverBody}>
          <div className={styles.brandLine}>
            <div className={styles.accentRule} />
            <span className={styles.brandText}>{brand.toUpperCase()}</span>
          </div>
          <h1 className={styles.coverTitle}>
            The Energy
            <br />
            Masterplan
          </h1>
          <div className={styles.coverDivider} />
          <p className={styles.coverClient}>Curated for {clientName}</p>
          <p className={styles.coverLocation}>{location}</p>
          <div className={styles.coverSystemPill}>
            <span>{systemSize}</span>
            <span className={styles.dot}>·</span>
            <span>{systemType}</span>
          </div>
        </div>
        <span className={styles.pageNum}>01 / 11</span>
      </section>

      {/* ══ P2: VISION ══════════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.visionPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>02 — VISION</span>
          <h2 className={styles.pageTitle}>Energy Independence Starts Here</h2>
        </header>

        <blockquote className={styles.quote}>
          &ldquo;The sun is the most democratic energy source on earth — it shines
          on every roof, in every village, without exception.&rdquo;
        </blockquote>

        <div className={styles.visionStats}>
          {[
            {
              label: "Annual Clean Energy",
              value:
                annualGen > 0 ? annualGen.toLocaleString("en-IN") : "—",
              unit: "units / year",
            },
            {
              label: "Estimated Savings",
              value: annualSavings > 0 ? formatInr(annualSavings) : "—",
              unit: "per year",
            },
            {
              label: "25-Year Lifetime Benefit",
              value:
                lifetimeWealth > 0
                  ? `${Math.round(lifetimeWealth / 100000).toLocaleString("en-IN")}L`
                  : "—",
              unit: "total wealth created",
            },
          ].map((s) => (
            <div key={s.label} className={styles.visionStatCard}>
              <div className={styles.visionStatVal}>{s.value}</div>
              <div className={styles.visionStatUnit}>{s.unit}</div>
              <div className={styles.visionStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <span className={styles.pageNum}>02 / 11</span>
      </section>

      {/* ══ P3: GREEN IMPACT ══════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.impactPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>03 — GREEN LEGACY</span>
          <h2 className={styles.pageTitle}>What Your Roof Gives Back</h2>
        </header>

        <div className={styles.impactGrid}>
          <div className={styles.impactCard}>
            <div className={styles.impactBig}>
              {co2 > 0 ? co2 : "—"}
            </div>
            <div className={styles.impactUnit}>Tons</div>
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
            <div className={styles.impactUnit}>Trees</div>
            <div className={styles.impactLabel}>Ecological Equivalent Planted</div>
            <p className={styles.impactSub}>
              Your rooftop = a small forest working silently for the planet.
            </p>
          </div>
        </div>

        <div className={styles.impactBar}>
          <span className={styles.impactBarLabel}>Daily Clean Generation</span>
          <div className={styles.impactBarTrack}>
            <div
              className={styles.impactBarFill}
              style={{
                width: `${Math.min(100, Math.max(8, (annualGen / 365 / 25) * 100))}%`,
              }}
            />
          </div>
          <span className={styles.impactBarVal}>
            {annualGen > 0 ? `${(annualGen / 365).toFixed(1)} units/day` : "—"}
          </span>
        </div>

        <span className={styles.pageNum}>03 / 11</span>
      </section>

      {/* ══ P4: FINANCIAL LEDGER ══════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.financePage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>04 — FINANCIAL LEDGER</span>
          <h2 className={styles.pageTitle}>Smart Capital Allocation</h2>
        </header>

        <div className={styles.financeCards}>
          <div className={styles.finCard}>
            <span className={styles.finCardTag}>GROSS INVESTMENT</span>
            <div className={styles.finCardBig}>
              {grossInr > 0 ? formatInr(grossInr) : "—"}
            </div>
            <div className={styles.finCardSub}>
              Panels + Inverter + Full Installation
            </div>
          </div>
          <div className={`${styles.finCard} ${styles.finCardGreen}`}>
            <span className={styles.finCardTag}>PM SURYA GHAR SUBSIDY</span>
            <div className={styles.finCardBig}>
              {subsidyInr > 0 ? `− ${formatInr(subsidyInr)}` : "—"}
            </div>
            <div className={styles.finCardSub}>Government support deducted</div>
          </div>
          <div className={`${styles.finCard} ${styles.finCardDark}`}>
            <span className={styles.finCardTag}>YOUR NET INVESTMENT</span>
            <div className={styles.finCardBig}>
              {netInr > 0 ? formatInr(netInr) : "—"}
            </div>
            <div className={styles.finCardSub}>Final amount you pay</div>
          </div>
        </div>

        <div className={styles.savingsRow}>
          {[
            {
              tag: "PAYBACK PERIOD",
              val:
                paybackYears > 0 ? `${paybackYears.toFixed(1)} yrs` : "—",
            },
            {
              tag: "MONTHLY SAVINGS",
              val: monthlyInr > 0 ? formatInr(monthlyInr) : "—",
            },
            {
              tag: "ANNUAL SAVINGS",
              val: annualSavings > 0 ? formatInr(annualSavings) : "—",
            },
          ].map((s) => (
            <div key={s.tag} className={styles.savingsBox}>
              <div className={styles.savingsTag}>{s.tag}</div>
              <div className={styles.savingsBig}>{s.val}</div>
            </div>
          ))}
        </div>

        <span className={styles.pageNum}>04 / 11</span>
      </section>

      {/* ══ P5: ENGINEERING ══════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.engPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>05 — ENGINEERING SNAPSHOT</span>
          <h2 className={styles.pageTitle}>
            Precision Engineered for {city}
          </h2>
        </header>

        <div className={styles.engLayout}>
          <div className={styles.engLocCard}>
            <span className={styles.engLocTag}>INSTALLATION SITE</span>
            <div className={styles.engLocCity}>{city}</div>
            <div className={styles.engLocFull}>{location}</div>
            <div className={styles.tiltBadge}>
              <span className={styles.tiltVal}>{tilt}°</span>
              <span className={styles.tiltLabel}>Optimal Panel Tilt</span>
            </div>
          </div>

          <div className={styles.engMetricsGrid}>
            {engMetrics.map(([label, value]) => (
              <div key={label} className={styles.engMetricCard}>
                <div className={styles.engMetricVal}>{value}</div>
                <div className={styles.engMetricLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.stdRow}>
          <div className={styles.stdTitle}>Standards Compliance</div>
          <div className={styles.stdBadges}>
            {standards.map((s) => (
              <span key={s} className={styles.stdBadge}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <span className={styles.pageNum}>05 / 11</span>
      </section>

      {/* ══ P6: HARDWARE ══════════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.hwPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>06 — HARDWARE ARCHITECTURE</span>
          <h2 className={styles.pageTitle}>Tier-1 Components, Built to Last</h2>
        </header>

        <div className={styles.hwGrid}>
          {hardware.map((h) => (
            <div key={h.title} className={styles.hwCard}>
              <div className={styles.hwMark}>{h.mark}</div>
              <div className={styles.hwTitle}>{h.title}</div>
              <div className={styles.hwDesc}>{h.desc}</div>
              <span className={styles.hwWarranty}>{h.warranty}</span>
            </div>
          ))}
        </div>

        <span className={styles.pageNum}>06 / 11</span>
      </section>

      {/* ══ P7: WARRANTY ══════════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.warrantyPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>07 — WARRANTY & ASSURANCE</span>
          <h2 className={styles.pageTitle}>Complete Peace of Mind</h2>
        </header>

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

        <p className={styles.warrantyNote}>
          All warranties are backed by respective manufacturers. Harihar Solar
          provides dedicated escalation support for warranty claims throughout
          the product lifecycle.
        </p>

        <span className={styles.pageNum}>07 / 11</span>
      </section>

      {/* ══ P8: JOURNEY (horizontal timeline) ══════════════════════════ */}
      <section className={`${styles.page} ${styles.journeyPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>08 — THE JOURNEY</span>
          <h2 className={styles.pageTitle}>From Paperwork to Power</h2>
        </header>

        <div className={styles.timeline}>
          {journey.map((step, i) => (
            <div key={step.num} className={styles.timelineStep}>
              <div className={styles.timelineTop}>
                <div className={styles.tlDot}>
                  <span className={styles.tlDotNum}>{step.num}</span>
                </div>
                {i < journey.length - 1 && (
                  <div className={styles.tlConnector} />
                )}
              </div>
              <div className={styles.tlContent}>
                <div className={styles.tlTitle}>{step.title}</div>
                <div className={styles.tlDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <span className={styles.pageNum}>08 / 11</span>
      </section>

      {/* ══ P9: PAYMENT SCHEDULE ══════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.paymentPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>09 — PAYMENT SCHEDULE</span>
          <h2 className={styles.pageTitle}>Transparent Investment Flow</h2>
        </header>

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
                <span className={styles.invoiceAmt}>{formatInr(p.amountInr)}</span>
              </div>
            ))}
          </div>

          <div className={styles.invoiceFooter}>
            Subsidy of{" "}
            {subsidyInr > 0 ? formatInr(subsidyInr) : "—"} will be credited
            directly to your bank account by the government after commissioning.
          </div>
        </div>

        <span className={styles.pageNum}>09 / 11</span>
      </section>

      {/* ══ P10: COMPLIANCE ═════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>10 — COMPLIANCE & DOCUMENTATION</span>
          <h2 className={styles.pageTitle}>Clear & Transparent</h2>
        </header>

        <div className={styles.termsGrid}>
          <div>
            <div className={styles.termsSubhead}>Terms & Conditions</div>
            <ul className={styles.termsList}>
              {allTerms.slice(0, half).map((t) => (
                <li key={t.slice(0, 40)}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className={styles.termsSubhead}>Additional Terms</div>
            <ul className={styles.termsList}>
              {allTerms.slice(half).map((t) => (
                <li key={t.slice(0, 40)}>{t}</li>
              ))}
            </ul>
            <div className={styles.termsSubhead} style={{ marginTop: "1.75rem" }}>
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

      {/* ══ P11: CLOSING CTA ══════════════════════════════════════════ */}
      <section className={`${styles.page} ${styles.closingPage}`}>
        <div className={styles.closingInner}>
          <span className={styles.closingTag}>11 — READY TO START</span>
          <h2 className={styles.closingTitle}>
            Your roof is ready
            <br />
            to power your future.
          </h2>
          <p className={styles.closingSub}>
            Every day you delay is a day of electricity bills you pay
            unnecessarily. Let&apos;s begin.
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
                {paybackYears > 0 ? `${paybackYears.toFixed(1)} yrs` : "—"}
              </div>
              <div className={styles.closingStatLabel}>payback</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className={`${styles.closingBtn} print:hidden`}
          >
            Download Proposal as PDF
          </button>

          <div className={styles.closingContact}>
            <div>{brand}</div>
            <div>{contact}</div>
            <div className={styles.closingValidity}>
              This proposal is valid for 15 days from the date of issue.
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
