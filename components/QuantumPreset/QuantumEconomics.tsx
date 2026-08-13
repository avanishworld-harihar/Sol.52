"use client";

/**
 * Quantum Economics — clear investment story + 25-year savings chart.
 * Glanceable KPIs, price breakup, bill before/after, wealth path.
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  formatInr,
  formatInrCompact,
} from "@/components/proposals/_shared/formatters";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import { useQuantumLang } from "./quantum-lang-context";
import {
  QuantumChartDraw,
  QuantumCountUp,
  QuantumFadeUp,
  QuantumGrowBar,
} from "./quantum-motion";
import styles from "./Quantum.module.css";

const fmtCompact = (n: number) => formatInrCompact(n);
const fmtInr = (n: number) => formatInr(n);

export type QuantumEconomicsProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
};

type ChartSeries = {
  areaPath: string;
  linePath: string;
  zeroY: number;
  breakX: number;
  breakY: number;
  endX: number;
  endY: number;
  plotBottom: number;
  yearTicks: { x: number; label: string }[];
};

function buildWealthSeries(
  paybackYears: number,
  lifetimeInr: number,
  netInr: number
): ChartSeries {
  const years = 25;
  const w = 560;
  const h = 148;
  const padL = 40;
  const padR = 14;
  const padT = 20;
  const padB = 26;
  const pb = Math.min(Math.max(paybackYears > 0 ? paybackYears : 5, 1), 20);
  const lifetime = lifetimeInr > 0 ? lifetimeInr : Math.max(netInr * 4, 1);
  const net = netInr > 0 ? netInr : 1;
  const minV = -net;
  const maxV = Math.max(lifetime, net * 0.6);
  const span = maxV - minV || 1;

  const toX = (y: number) => padL + (y / years) * (w - padL - padR);
  const toY = (v: number) => padT + (1 - (v - minV) / span) * (h - padT - padB);

  const points: { x: number; y: number }[] = [];
  for (let yr = 0; yr <= years; yr++) {
    let cum: number;
    if (yr <= pb) {
      cum = -net + (net * yr) / pb;
    } else {
      cum = lifetime * ((yr - pb) / (years - pb));
    }
    points.push({ x: toX(yr), y: toY(cum) });
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1]!;
  const first = points[0]!;
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${toY(0).toFixed(1)} L ${first.x.toFixed(1)} ${toY(0).toFixed(1)} Z`;

  const breakIdx = Math.min(Math.round(pb), points.length - 1);
  const breakPt = points[breakIdx]!;

  const plotBottom = h - padB;

  return {
    areaPath,
    linePath,
    zeroY: toY(0),
    breakX: breakPt.x,
    breakY: breakPt.y,
    endX: last.x,
    endY: last.y,
    plotBottom,
    yearTicks: [0, 5, 10, 15, 20, 25].map((y) => ({
      x: toX(y),
      label: `Y${y}`,
    })),
  };
}

export function QuantumEconomics({ data, pptInput }: QuantumEconomicsProps) {
  const { copy } = useQuantumLang();
  const eco = data.economics;
  const gross = eco.grossInr;
  const subsidy = eco.subsidyInr;
  const net = eco.netInr;
  const payback = eco.paybackYears;
  const monthly = eco.monthlySavingsInr;
  const annual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly > 0
        ? monthly * 12
        : 0;
  const lifetime =
    data.closing.lifetimeWealthInr || eco.lifetimeProfitInr;

  const yearlyBill = data.bill.yearlyBillInr;
  const billToday =
    yearlyBill > 0
      ? yearlyBill
      : annual > 0
        ? Math.round(annual * 1.18)
        : 0;
  const billAfter = Math.max(0, billToday - annual);

  const ratePct =
    eco.interestRatePct && eco.interestRatePct > 0 ? eco.interestRatePct : 7;
  const selectedTenure =
    pptInput?.financeOption?.selectedTenureYears &&
    pptInput.financeOption.selectedTenureYears > 0
      ? pptInput.financeOption.selectedTenureYears
      : null;
  const emiRows = (eco.emiRows ?? []).slice(0, 3).filter((r) => r.monthlyEmiInr > 0);

  const paybackLabel =
    payback > 0
      ? `${payback.toFixed(payback % 1 ? 1 : 0)} ${copy.econ.yrs}`
      : "—";

  const chart = buildWealthSeries(payback, lifetime, net);

  const maxBill = Math.max(billToday, billAfter, 1);
  const todayH = Math.max(10, (billToday / maxBill) * 72);
  const afterH = Math.max(10, (billAfter / maxBill) * 72);

  return (
    <section className={`${styles.a4Page} ${styles.econPage}`}>
      <QuantumAtmosphere variant="finance" />

      <div className={styles.pageStack}>
        <div className={styles.pageHeader}>
          <span
            className={styles.cyanText}
            style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
          >
            {copy.econ.eyebrow}
          </span>
          <h2>{copy.econ.title}</h2>
        </div>

        <p className={styles.econLead}>{copy.econ.lead}</p>

        {/* Glance KPIs */}
        <div className={styles.econKpiRow}>
          <QuantumFadeUp delay={0}>
            <div className={`${styles.glass3D} ${styles.econKpi}`}>
              <span className={styles.econKpiLabel}>{copy.econ.youPay}</span>
              <strong className={styles.econKpiValue}>
                <QuantumCountUp value={net} format={fmtCompact} />
              </strong>
              <em>{copy.econ.afterSubsidy}</em>
            </div>
          </QuantumFadeUp>
          <QuantumFadeUp delay={0.06}>
            <div className={`${styles.glass3D} ${styles.econKpi}`}>
              <span className={styles.econKpiLabel}>{copy.econ.saveMonth}</span>
              <strong className={`${styles.econKpiValue} ${styles.accentText}`}>
                <QuantumCountUp value={monthly} format={fmtInr} />
              </strong>
              <em>{copy.econ.lowerBill}</em>
            </div>
          </QuantumFadeUp>
          <QuantumFadeUp delay={0.12}>
            <div className={`${styles.glass3D} ${styles.econKpi}`}>
              <span className={styles.econKpiLabel}>{copy.econ.moneyBack}</span>
              <strong className={`${styles.econKpiValue} ${styles.accentText}`}>
                {payback > 0 ? (
                  <>
                    <QuantumCountUp
                      value={payback}
                      format={(n) =>
                        `${n.toFixed(payback % 1 ? 1 : 0)} ${copy.econ.yrs}`
                      }
                      decimals={payback % 1 ? 1 : 0}
                    />
                  </>
                ) : (
                  "—"
                )}
              </strong>
              <em>{copy.econ.paybackTime}</em>
            </div>
          </QuantumFadeUp>
          <QuantumFadeUp delay={0.18}>
            <div className={`${styles.glass3D} ${styles.econKpi}`}>
              <span className={styles.econKpiLabel}>{copy.econ.savings25}</span>
              <strong className={`${styles.econKpiValue} ${styles.okText}`}>
                <QuantumCountUp value={lifetime} format={fmtCompact} />
              </strong>
              <em>{copy.econ.totalRelief}</em>
            </div>
          </QuantumFadeUp>
        </div>

        <div className={styles.econMidGrid}>
          {/* Price breakup */}
          <QuantumFadeUp delay={0.08}>
            <div className={`${styles.glass3D} ${styles.econPanel}`}>
              <span className={styles.econPanelTitle}>
                {copy.econ.priceBreakup}
              </span>
              <div className={styles.econBreakRows}>
                <div className={styles.econBreakRow}>
                  <span>{copy.econ.systemGross}</span>
                  <strong>
                    <QuantumCountUp value={gross} format={fmtInr} />
                  </strong>
                </div>
                <div className={styles.econBreakRow}>
                  <span>{copy.econ.subsidyEst}</span>
                  <strong className={styles.okText}>
                    {subsidy > 0 ? (
                      <>
                        − <QuantumCountUp value={subsidy} format={fmtInr} />
                      </>
                    ) : (
                      "—"
                    )}
                  </strong>
                </div>
                <div className={`${styles.econBreakRow} ${styles.econBreakNet}`}>
                  <span>{copy.econ.netYouPay}</span>
                  <strong>
                    <QuantumCountUp value={net} format={fmtInr} />
                  </strong>
                </div>
                <div className={styles.econBreakRow}>
                  <span>{copy.econ.netMeterFees}</span>
                  <strong>{copy.econ.included}</strong>
                </div>
                <div className={styles.econBreakRow}>
                  <span>{copy.econ.amc5}</span>
                  <strong>{copy.econ.included}</strong>
                </div>
              </div>
            </div>
          </QuantumFadeUp>

          {/* Bill before / after */}
          <QuantumFadeUp delay={0.14}>
            <div className={`${styles.glass3D} ${styles.econPanel}`}>
              <span className={styles.econPanelTitle}>
                {copy.econ.yearlyBill}
              </span>
              <div className={styles.econBillCompare}>
                <div className={styles.econBillCol}>
                  <QuantumGrowBar
                    className={styles.econBillBarToday}
                    heightPx={todayH}
                    delay={0.1}
                  />
                  <strong>
                    <QuantumCountUp value={billToday} format={fmtCompact} />
                  </strong>
                  <span>{copy.econ.beforeSolar}</span>
                </div>
                <div className={styles.econBillArrow} aria-hidden>
                  →
                </div>
                <div className={styles.econBillCol}>
                  <QuantumGrowBar
                    className={styles.econBillBarAfter}
                    heightPx={afterH}
                    delay={0.22}
                  />
                  <strong className={styles.accentText}>
                    <QuantumCountUp value={billAfter} format={fmtCompact} />
                  </strong>
                  <span>{copy.econ.afterSolar}</span>
                </div>
              </div>
              <p className={styles.econBillNote}>
                {copy.econ.firstYear}{" "}
                <strong>
                  <QuantumCountUp value={annual} format={fmtInr} />
                </strong>
                {monthly > 0
                  ? ` (~${formatInr(monthly)}${copy.econ.perMonth})`
                  : null}
              </p>
            </div>
          </QuantumFadeUp>
        </div>

        {emiRows.length > 0 ? (
          <QuantumFadeUp delay={0.1}>
            <div className={`${styles.glass3D} ${styles.econFinance}`}>
              <div className={styles.econFinanceHead}>
                <span className={styles.econPanelTitle}>
                  {copy.econ.financeTitle}
                </span>
                <p className={styles.econFinanceLead}>
                  {copy.econ.financeLead(
                    Number.isInteger(ratePct)
                      ? String(ratePct)
                      : ratePct.toFixed(1)
                  )}
                </p>
              </div>
              <div className={styles.econEmiGrid}>
                {emiRows.map((row) => {
                  const yearsMatch = row.tenureLabel.match(/(\d+)/);
                  const years = yearsMatch ? Number(yearsMatch[1]) : 0;
                  const selected = selectedTenure != null && years === selectedTenure;
                  const covers = monthly > 0 && monthly >= row.monthlyEmiInr;
                  return (
                    <article
                      key={row.tenureLabel}
                      className={`${styles.econEmiCard}${
                        selected ? ` ${styles.econEmiCardSelected}` : ""
                      }`}
                    >
                      <span className={styles.econEmiTenure}>
                        {years > 0
                          ? copy.econ.tenureLoan(years)
                          : row.tenureLabel}
                      </span>
                      <strong className={styles.econEmiValue}>
                        {formatInr(row.monthlyEmiInr)}
                      </strong>
                      <span className={styles.econEmiUnit}>
                        {copy.econ.emiUnit}
                      </span>
                      {row.interestPaidInr > 0 ? (
                        <span className={styles.econEmiNote}>
                          {copy.econ.interestTotal(
                            formatInrCompact(row.interestPaidInr)
                          )}
                        </span>
                      ) : null}
                      {selected ? (
                        <span className={styles.econEmiBadge}>
                          {copy.econ.emiSelected}
                        </span>
                      ) : monthly > 0 ? (
                        <span
                          className={
                            covers
                              ? styles.econEmiCover
                              : styles.econEmiShort
                          }
                        >
                          {covers
                            ? copy.econ.savingsCoverEmi
                            : copy.econ.emiAboveSavings}
                        </span>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </QuantumFadeUp>
        ) : null}

        {/* 25-year graph */}
        <QuantumFadeUp delay={0.1}>
          <div className={`${styles.glass3D} ${styles.econChartCard}`}>
            <div className={styles.econChartHead}>
              <div>
                <span className={styles.econPanelTitle}>{copy.econ.path25}</span>
                <p className={styles.econChartSub}>{copy.econ.pathSub}</p>
              </div>
              <span className={styles.econChartBadge}>
                {copy.econ.breakEven} · {paybackLabel}
              </span>
            </div>

            <svg
              viewBox="0 0 560 148"
              width="100%"
              height="148"
              className={styles.econChartSvg}
              aria-hidden
            >
              <defs>
                <linearGradient id="qWealthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.4)" />
                  <stop offset="100%" stopColor="rgba(6,182,212,0.02)" />
                </linearGradient>
                <linearGradient id="qWealthLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>

              <rect
                x="40"
                y={chart.zeroY}
                width="506"
                height={Math.max(0, chart.plotBottom - chart.zeroY)}
                fill="rgba(239,68,68,0.04)"
              />

              {[0.25, 0.5, 0.75].map((t) => {
                const y = 20 + t * (chart.plotBottom - 20);
                return (
                  <line
                    key={t}
                    x1="40"
                    y1={y}
                    x2="546"
                    y2={y}
                    stroke="rgba(148,163,184,0.15)"
                    strokeWidth="1"
                  />
                );
              })}

              <line
                x1="40"
                y1={chart.zeroY}
                x2="546"
                y2={chart.zeroY}
                stroke="rgba(148,163,184,0.45)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x="36"
                y={chart.zeroY + 3}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="8"
              >
                ₹0
              </text>

              <QuantumChartDraw
                linePath={chart.linePath}
                areaPath={chart.areaPath}
              >
                <line
                  x1={chart.breakX}
                  y1={18}
                  x2={chart.breakX}
                  y2={chart.plotBottom}
                  stroke="rgba(6,182,212,0.35)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={chart.breakX}
                  cy={chart.breakY}
                  r="5"
                  fill="#22d3ee"
                />
                <circle
                  cx={chart.breakX}
                  cy={chart.breakY}
                  r="8.5"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1"
                />
                <text
                  x={chart.breakX}
                  y={Math.max(14, chart.breakY - 12)}
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="8.5"
                  fontWeight="700"
                  letterSpacing="0.6"
                >
                  {copy.econ.payback}
                </text>

                <circle
                  cx={chart.endX}
                  cy={chart.endY}
                  r="3.5"
                  fill="#e2e8f0"
                />
                <text
                  x={Math.min(530, chart.endX - 2)}
                  y={Math.max(14, chart.endY - 9)}
                  textAnchor="end"
                  fill="#e2e8f0"
                  fontSize="9"
                  fontWeight="600"
                >
                  {lifetime > 0 ? formatInrCompact(lifetime) : ""}
                </text>
              </QuantumChartDraw>

              {chart.yearTicks.map((t) => (
                <g key={t.label}>
                  <line
                    x1={t.x}
                    y1={chart.plotBottom}
                    x2={t.x}
                    y2={chart.plotBottom + 4}
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <text
                    x={t.x}
                    y={chart.plotBottom + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              <text
                x="40"
                y="12"
                fill="#64748b"
                fontSize="8"
                letterSpacing="0.5"
              >
                {copy.econ.cumulative}
              </text>
            </svg>

            <p className={styles.econChartFoot}>
              {copy.econ.chartFoot(
                paybackLabel,
                lifetime > 0 ? formatInrCompact(lifetime) : copy.econ.longTerm
              )}
            </p>
          </div>
        </QuantumFadeUp>
      </div>
    </section>
  );
}

export default QuantumEconomics;
