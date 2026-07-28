"use client";

/**
 * Premium Luxe (noir) — A4 multi-page residential proposal.
 * Preset id: residential_luxe_noir · Canvas-style pagination · dark #0a0a0a + gold #D4AF37.
 * Atelier (residential_premium_luxe) stays separate.
 */

import type { ReactNode } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatLifetimeBenefitInr } from "@/components/proposals/_shared/formatters";
import { CoverPage } from "./CoverPage";
import { EngineeringHUD } from "./EngineeringHUD";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe-noir-shell.module.css";

export type LuxeNoirRendererProps = {
  data: ProposalData;
};

const DEFAULT_PAYMENT_PCTS = [25, 50, 20, 5] as const;
const DEFAULT_PAYMENT_TITLES = [
  "Advance (Booking)",
  "Material Delivery",
  "Installation",
  "Commissioning",
] as const;

function A4Page({
  pageLabel,
  brand,
  children,
  contentClassName,
}: {
  pageLabel: string;
  brand: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className={styles.a4Page}>
      <div className={`${styles.pageInner} ${contentClassName ?? ""}`.trim()}>
        {children}
      </div>
      <footer className={styles.pageFooter}>
        <span className={styles.pageFooterGold}>{brand}</span>
        <span>{pageLabel}</span>
      </footer>
    </section>
  );
}

export function LuxeNoirRenderer({ data }: LuxeNoirRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Loading Premium Luxe…</div>;
  }

  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const client = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "Madhya Pradesh";
  const systemKw = Number(data.meta.systemKw) || 0;
  const eco = data.economics;
  const bill = data.bill;
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const impact = data.impact;
  const execution = data.execution;
  const terms = data.terms;
  const closing = data.closing;

  const net = eco.netInr;
  const gross = eco.grossInr;
  const subsidy = eco.subsidyInr;
  const savingsAnnual =
    closing.annualSavingsInr > 0
      ? closing.annualSavingsInr
      : eco.monthlySavingsInr * 12;
  const lifetimeWealth = closing.lifetimeWealthInr || eco.lifetimeProfitInr;
  const contact =
    closing.contactLine?.trim() || "Harihar Solar · +91-99933 22267";
  const contactPerson = closing.contactPerson?.trim() || brand;
  const contactRole =
    closing.contactPersonDesignation?.trim() || "Authorized Signatory";

  const yearlyUnits =
    bill.totals.units > 0
      ? bill.totals.units
      : bill.months.reduce((s, m) => s + (m.units || 0), 0);
  const monthlyUnitsAvg =
    bill.months.length > 0
      ? Math.round(yearlyUnits / Math.max(bill.months.length, 1))
      : yearlyUnits > 0
        ? Math.round(yearlyUnits / 12)
        : 0;
  const monthlyBillApprox =
    bill.yearlyBillInr > 0 ? Math.round(bill.yearlyBillInr / 12) : 0;
  const generationUnits =
    closing.annualUnits > 0
      ? closing.annualUnits
      : systemKw > 0
        ? Math.round(systemKw * 1450)
        : 0;

  const panelItem = bom.find((b) => /module|panel|solar/i.test(`${b.name} ${b.brand}`));
  const inverterItem = bom.find((b) => /inverter|mppt/i.test(`${b.name} ${b.brand}`));
  const otherHw = bom
    .filter((b) => b !== panelItem && b !== inverterItem)
    .slice(0, 2);

  const paymentBaseInr = gross > 0 ? gross : net;
  const paymentMilestones =
    execution.payments.length > 0
      ? execution.payments.slice(0, 4).map((p, i) => {
          const pctMatch = p.pctLabel.match(/(\d+)\s*%/);
          const pct = Number(
            pctMatch?.[1] ??
              DEFAULT_PAYMENT_PCTS[i] ??
              Math.round(100 / Math.max(execution.payments.length, 1))
          );
          const amountInr =
            paymentBaseInr > 0
              ? Math.round((paymentBaseInr * pct) / 100)
              : p.amountInr > 0
                ? p.amountInr
                : 0;
          return {
            step: String(i + 1).padStart(2, "0"),
            title: p.label.replace(/^\d+\.\s*/, "") || DEFAULT_PAYMENT_TITLES[i]!,
            amountLabel: amountInr > 0 ? formatInr(amountInr) : "—",
            percent: `${pct}%`,
          };
        })
      : DEFAULT_PAYMENT_PCTS.map((pct, i) => {
          const amountInr =
            paymentBaseInr > 0 ? Math.round((paymentBaseInr * pct) / 100) : 0;
          return {
            step: String(i + 1).padStart(2, "0"),
            title: DEFAULT_PAYMENT_TITLES[i]!,
            amountLabel: amountInr > 0 ? formatInr(amountInr) : "—",
            percent: `${pct}%`,
          };
        });

  const emiRows = (eco.emiRows ?? []).slice(0, 4);
  const paymentTerms =
    terms.conditions.length > 0
      ? terms.conditions.slice(0, 4)
      : [
          "Prices valid for 15 days from proposal date.",
          "Subsidy subject to MNRE / DISCOM approval timelines.",
          "Site readiness and structural clearance are client responsibilities.",
          "Commissioning follows net-metering approval by the DISCOM.",
        ];

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className={`${styles.root} ${luxeDisplayFont.variable}`}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Premium Luxe · A4 Proposal</span>
          <button type="button" className={styles.printBarBtn} onClick={handlePrint}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Page 01: Cinematic Cover ───────────────────────────── */}
      <CoverPage data={data} />

      {/* ── Page 02: System Requirement & Load Analysis ───────── */}
      <A4Page pageLabel="02 / 09" brand={brand}>
        <p className={styles.eyebrow}>Load & demand</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          System Requirement & Load Analysis
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>
          We size the array from your actual consumption pattern — not a generic rule of
          thumb — so generation tracks the bill you already pay.
        </p>

        <div className={styles.cardGrid3} style={{ marginTop: 20 }}>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Avg monthly units</span>
            <span className={styles.cardValue}>
              {monthlyUnitsAvg > 0 ? monthlyUnitsAvg.toLocaleString("en-IN") : "—"}
            </span>
            <span className={styles.cardHint}>From bill history</span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Est. monthly bill</span>
            <span className={styles.cardValue}>
              {monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"}
            </span>
            <span className={styles.cardHint}>Energy + fixed + duty</span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Proposed capacity</span>
            <span className={styles.cardValue}>
              {systemKw > 0 ? `${systemKw} kW` : "—"}
            </span>
            <span className={styles.cardHint}>AC inverter rating</span>
          </div>
        </div>

        <div className={styles.stack} style={{ marginTop: 18 }}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Annual generation target</span>
            <span className={styles.cardValue} style={{ fontSize: "22pt" }}>
              {generationUnits > 0
                ? `${generationUnits.toLocaleString("en-IN")} units`
                : "—"}
            </span>
            <span className={styles.cardHint}>
              ~1,450 kWh/kW · site-calibrated yield
            </span>
          </div>
          {bill.hasData && bill.months.length > 0 ? (
            <div className={styles.card}>
              <span className={styles.cardLabel}>Recent bill months</span>
              <div className={styles.stack} style={{ marginTop: 8, gap: 0 }}>
                {bill.months.slice(0, 6).map((m) => (
                  <div key={m.label} className={styles.listRow}>
                    <span>
                      {m.label}
                      {m.isSummerPeak ? " · peak" : ""}
                    </span>
                    <strong>
                      {m.units.toLocaleString("en-IN")} u · {formatInr(m.netInr)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <span className={styles.cardLabel}>Coverage intent</span>
              <p className={styles.cardHint} style={{ marginTop: 8, fontSize: "10pt" }}>
                Array sized to offset daytime load and reduce grid draw during peak tariff
                windows. Final net-metering settlement follows DISCOM approval.
              </p>
            </div>
          )}
        </div>
      </A4Page>

      {/* ── Page 03: Investment Snapshot ───────────────────────── */}
      <A4Page pageLabel="03 / 09" brand={brand}>
        <p className={styles.eyebrow}>Capital clarity</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          Investment Snapshot
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>
          Transparent economics — gross, subsidy, and what you actually write the cheque
          for.
        </p>

        <div className={styles.cardGrid2} style={{ marginTop: 22 }}>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Gross project cost</span>
            <span className={styles.cardValue}>
              {gross > 0 ? formatInr(gross) : "—"}
            </span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Estimated subsidy</span>
            <span className={styles.cardValue}>
              {subsidy > 0 ? formatInr(subsidy) : "—"}
            </span>
            <span className={styles.cardHint}>Subject to scheme eligibility</span>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 12 }}>
          <span className={styles.cardLabel}>You pay (net)</span>
          <span className={styles.cardValue} style={{ fontSize: "32pt", color: "#d4af37" }}>
            {net > 0 ? formatInr(net) : "—"}
          </span>
          <span className={styles.cardHint}>After applicable subsidy</span>
        </div>

        <div className={styles.cardGrid3} style={{ marginTop: 14 }}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Monthly savings</span>
            <span className={styles.cardValue} style={{ fontSize: "16pt" }}>
              {eco.monthlySavingsInr > 0 ? formatInr(eco.monthlySavingsInr) : "—"}
            </span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Annual savings</span>
            <span className={styles.cardValue} style={{ fontSize: "16pt" }}>
              {savingsAnnual > 0 ? formatInr(savingsAnnual) : "—"}
            </span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Payback</span>
            <span className={styles.cardValue} style={{ fontSize: "16pt" }}>
              {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} yrs` : "—"}
            </span>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 14 }}>
          <span className={styles.cardLabel}>Lifetime wealth trajectory</span>
          <span className={styles.cardValue} style={{ fontSize: "20pt" }}>
            {lifetimeWealth > 0 ? formatLifetimeBenefitInr(lifetimeWealth) : "—"}
          </span>
          <span className={styles.cardHint}>
            Cumulative bill offset over the system&apos;s productive life
          </span>
        </div>
      </A4Page>

      {/* ── Page 04: EMI Layout ────────────────────────────────── */}
      <A4Page pageLabel="04 / 09" brand={brand}>
        <p className={styles.eyebrow}>Financing</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          EMI Layout
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>
          Spread the net investment across tenures — often comparable to the bill you
          already settle every month.
        </p>

        <div className={styles.card} style={{ marginTop: 20 }}>
          {emiRows.length > 0 ? (
            <table className={styles.emiTable}>
              <thead>
                <tr>
                  <th>Tenure</th>
                  <th>Interest (est.)</th>
                  <th>Monthly EMI</th>
                </tr>
              </thead>
              <tbody>
                {emiRows.map((row) => (
                  <tr key={row.tenureLabel}>
                    <td>{row.tenureLabel}</td>
                    <td>
                      {row.interestPaidInr > 0 ? formatInr(row.interestPaidInr) : "—"}
                    </td>
                    <td>
                      <strong>
                        {row.monthlyEmiInr > 0 ? formatInr(row.monthlyEmiInr) : "—"}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.cardHint} style={{ fontSize: "10pt" }}>
              EMI options will be confirmed with your preferred lending partner. Typical
              tenures: 3–7 years against the net project cost.
            </p>
          )}
        </div>

        <div className={styles.cardGrid2} style={{ marginTop: 14 }}>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Reference net cost</span>
            <span className={styles.cardValue} style={{ fontSize: "18pt" }}>
              {net > 0 ? formatInr(net) : "—"}
            </span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Vs. monthly bill</span>
            <span className={styles.cardValue} style={{ fontSize: "18pt" }}>
              {monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"}
            </span>
            <span className={styles.cardHint}>Current approx. grid spend</span>
          </div>
        </div>

        <div className={styles.termsBox}>
          Indicative EMIs assume standard retail rates; final sanction, processing fees,
          and tenure are at the lender&apos;s discretion. We assist with documentation —
          approval rests with the bank / NBFC.
        </div>
      </A4Page>

      {/* ── Page 05: Engineering HUD ──────────────────────────── */}
      <EngineeringHUD data={data} />

      {/* ── Page 06: Hardware Trust ────────────────────────────── */}
      <A4Page pageLabel="06 / 09" brand={brand}>
        <p className={styles.eyebrow}>Bill of materials</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          Hardware Trust
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>
          Tier-1 modules and string electronics — specified for yield, warranty depth, and
          DISCOM compliance.
        </p>

        <div className={styles.stack} style={{ marginTop: 18, gap: 12 }}>
          <div className={styles.hwCard}>
            <div className={styles.hwMark}>PV</div>
            <div>
              <h3 className={styles.hwTitle}>
                {panelItem
                  ? `${panelItem.brand} ${panelItem.name}`.trim()
                  : "High-efficiency mono modules"}
              </h3>
              <p className={styles.hwSpec}>
                {panelItem?.spec ||
                  (systemKw > 0
                    ? `~${Math.ceil((systemKw * 1000) / 580)} × 580 Wp · bifacial-capable`
                    : "Module wattage confirmed at procurement")}
              </p>
              {(panelItem?.technicalPoints ?? []).slice(0, 2).map((pt) => (
                <p key={pt} className={styles.hwSpec}>
                  {pt}
                </p>
              ))}
              <span className={styles.hwWarranty}>
                {panelItem?.warranty?.trim() || "25-yr performance warranty"}
              </span>
            </div>
          </div>

          <div className={styles.hwCard}>
            <div className={styles.hwMark}>INV</div>
            <div>
              <h3 className={styles.hwTitle}>
                {inverterItem
                  ? `${inverterItem.brand} ${inverterItem.name}`.trim()
                  : "Grid-tied string inverter"}
              </h3>
              <p className={styles.hwSpec}>
                {inverterItem?.spec ||
                  (systemKw > 0
                    ? `${systemKw} kW AC · MPPT · export-capable`
                    : "Inverter rating matched to array")}
              </p>
              {(inverterItem?.technicalPoints ?? []).slice(0, 2).map((pt) => (
                <p key={pt} className={styles.hwSpec}>
                  {pt}
                </p>
              ))}
              <span className={styles.hwWarranty}>
                {inverterItem?.warranty?.trim() || "5–10 yr manufacturer warranty"}
              </span>
            </div>
          </div>

          {otherHw.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className={styles.hwCard}>
              <div className={styles.hwMark}>{String(idx + 3).padStart(2, "0")}</div>
              <div>
                <h3 className={styles.hwTitle}>
                  {`${item.brand} ${item.name}`.trim()}
                </h3>
                <p className={styles.hwSpec}>{item.spec || item.description || "—"}</p>
                <span className={styles.hwWarranty}>
                  {item.warranty?.trim() || "As per OEM"}
                </span>
              </div>
            </div>
          ))}

          {bom.length === 0 ? (
            <div className={styles.card}>
              <p className={styles.cardHint} style={{ fontSize: "10pt" }}>
                Detailed BOM and datasheets are attached at agreement — panels, inverter,
                ACDB/DCDB, cabling, and mounting structure sized to this proposal.
              </p>
            </div>
          ) : null}
        </div>
      </A4Page>

      {/* ── Page 07: Ecological Dividend ───────────────────────── */}
      <A4Page pageLabel="07 / 09" brand={brand}>
        <p className={styles.eyebrow}>Impact</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          Ecological Dividend
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>
          Every kilowatt-hour displaced from the grid is a tonne of carbon that never
          reaches the atmosphere — and a quieter bill for decades.
        </p>

        <div style={{ marginTop: 28 }}>
          <p className={styles.impactHero}>
            {impact.co2Tons > 0 ? `~${impact.co2Tons.toFixed(0)}` : "—"}
          </p>
          <span className={styles.cardLabel} style={{ marginTop: 8, display: "block" }}>
            Tonnes CO₂ avoided (lifetime estimate)
          </span>
        </div>

        <div className={styles.cardGrid2} style={{ marginTop: 28 }}>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Trees equivalent</span>
            <span className={styles.cardValue}>
              {impact.treesEquivalent > 0
                ? Math.round(impact.treesEquivalent).toLocaleString("en-IN")
                : "—"}
            </span>
            <span className={styles.cardHint}>Mature tree CO₂ absorption parity</span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Clean units / year</span>
            <span className={styles.cardValue} style={{ fontSize: "16pt" }}>
              {generationUnits > 0
                ? generationUnits.toLocaleString("en-IN")
                : "—"}
            </span>
            <span className={styles.cardHint}>Estimated annual generation</span>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 14 }}>
          <span className={styles.cardLabel}>Household legacy</span>
          <p className={styles.cardHint} style={{ marginTop: 8, fontSize: "10.5pt" }}>
            This installation is a 25-year commitment to cleaner air for your street —
            measured in avoided coal burn, not just rupees saved.
          </p>
        </div>
      </A4Page>

      {/* ── Page 08: Investment Milestones & Payment Terms ─────── */}
      <A4Page pageLabel="08 / 09" brand={brand}>
        <p className={styles.eyebrow}>Execution</p>
        <h2 className={styles.title} style={{ fontSize: "26pt" }}>
          Investment Milestones & Payment Terms
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>
          Capital released against clear project gates — booking through commissioning.
        </p>

        <div className={styles.stack} style={{ marginTop: 16, gap: 0 }}>
          {paymentMilestones.map((m) => (
            <div key={m.step} className={styles.milestone}>
              <span className={styles.milestoneNum}>{m.step}</span>
              <div>
                <h3 className={styles.milestoneTitle}>{m.title}</h3>
                <span className={styles.cardHint}>{m.percent} of project value</span>
              </div>
              <span className={styles.milestoneAmt}>{m.amountLabel}</span>
            </div>
          ))}
        </div>

        <div className={styles.termsBox}>
          <strong style={{ color: "#d4af37", display: "block", marginBottom: 6 }}>
            Payment terms
          </strong>
          {paymentTerms.map((t) => (
            <div key={t} style={{ marginBottom: 4 }}>
              · {t}
            </div>
          ))}
        </div>
      </A4Page>

      {/* ── Page 09: Cinematic Closing + Signature ─────────────── */}
      <A4Page pageLabel="09 / 09" brand={brand} contentClassName={styles.closingPage}>
        <div>
          <p className={styles.eyebrow}>Next chapter</p>
          <h2 className={styles.closingTitle}>Ready when you are.</h2>
          <p className={styles.closingBody}>
            We will lock design, DISCOM paperwork, and installation schedule around your
            roof — with the same engineering discipline on every page of this brief.
          </p>
          <p className={styles.closingBody} style={{ marginTop: 12, fontSize: "12pt" }}>
            Prepared for {client}
            {systemKw > 0 ? ` · ${systemKw} kW` : ""}.
          </p>
        </div>

        <div className={styles.signatureBlock}>
          <div>
            <div className={styles.sigLine}>
              <div className={styles.sigLabel}>Client acceptance</div>
              <div className={styles.sigName}>{client}</div>
            </div>
          </div>
          <div>
            <div className={styles.sigLine}>
              <div className={styles.sigLabel}>Authorized signature</div>
              <div className={styles.sigName}>{contactPerson}</div>
              <div className={styles.sigLabel} style={{ marginTop: 4 }}>
                {contactRole}
              </div>
            </div>
          </div>
        </div>

        <p className={styles.contactLine}>{contact}</p>
      </A4Page>
    </div>
  );
}

export default LuxeNoirRenderer;
