"use client";

/**
 * Quantum Economics — clear investment story + 25-year savings chart.
 * Glanceable KPIs, price breakup, bill before/after, wealth path.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
} from "@/components/proposals/_shared/formatters";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import styles from "./Quantum.module.css";

export type QuantumEconomicsProps = {
  data: ProposalData;
};

type ChartSeries = {
  areaPath: string;
  linePath: string;
  zeroY: number;
  breakX: number;
  breakY: number;
  endX: number;
  endY: number;
  yearTicks: { x: number; label: string }[];
};

function buildWealthSeries(
  paybackYears: number,
  lifetimeInr: number,
  netInr: number
): ChartSeries {
  const years = 25;
  const w = 560;
  const h = 168;
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

  return {
    areaPath,
    linePath,
    zeroY: toY(0),
    breakX: breakPt.x,
    breakY: breakPt.y,
    endX: last.x,
    endY: last.y,
    yearTicks: [0, 5, 10, 15, 20, 25].map((y) => ({
      x: toX(y),
      label: `Y${y}`,
    })),
  };
}

export function QuantumEconomics({ data }: QuantumEconomicsProps) {
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

  const paybackLabel =
    payback > 0
      ? `${payback.toFixed(payback % 1 ? 1 : 0)} yrs`
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
            02 // COST &amp; SAVINGS
          </span>
          <h2>Your Investment.</h2>
        </div>

        <p className={styles.econLead}>
          See what you pay, how soon it returns, and how savings grow over 25
          years.
        </p>

        {/* Glance KPIs */}
        <div className={styles.econKpiRow}>
          <div className={`${styles.glass3D} ${styles.econKpi}`}>
            <span className={styles.econKpiLabel}>You pay (net)</span>
            <strong className={styles.econKpiValue}>
              {net > 0 ? formatInrCompact(net) : "—"}
            </strong>
            <em>After subsidy</em>
          </div>
          <div className={`${styles.glass3D} ${styles.econKpi}`}>
            <span className={styles.econKpiLabel}>Save every month</span>
            <strong className={`${styles.econKpiValue} ${styles.accentText}`}>
              {monthly > 0 ? formatInr(monthly) : "—"}
            </strong>
            <em>Lower electricity bill</em>
          </div>
          <div className={`${styles.glass3D} ${styles.econKpi}`}>
            <span className={styles.econKpiLabel}>Money back in</span>
            <strong className={`${styles.econKpiValue} ${styles.accentText}`}>
              {paybackLabel}
            </strong>
            <em>Payback time</em>
          </div>
          <div className={`${styles.glass3D} ${styles.econKpi}`}>
            <span className={styles.econKpiLabel}>25-year savings</span>
            <strong className={`${styles.econKpiValue} ${styles.okText}`}>
              {lifetime > 0 ? formatInrCompact(lifetime) : "—"}
            </strong>
            <em>Total bill relief</em>
          </div>
        </div>

        <div className={styles.econMidGrid}>
          {/* Price breakup */}
          <div className={`${styles.glass3D} ${styles.econPanel}`}>
            <span className={styles.econPanelTitle}>Price breakup</span>
            <div className={styles.econBreakRows}>
              <div className={styles.econBreakRow}>
                <span>System price (gross)</span>
                <strong>{gross > 0 ? formatInr(gross) : "—"}</strong>
              </div>
              <div className={styles.econBreakRow}>
                <span>MNRE subsidy (est.)</span>
                <strong className={styles.okText}>
                  {subsidy > 0 ? `− ${formatInr(subsidy)}` : "—"}
                </strong>
              </div>
              <div className={`${styles.econBreakRow} ${styles.econBreakNet}`}>
                <span>Net you pay</span>
                <strong>{net > 0 ? formatInr(net) : "—"}</strong>
              </div>
              <div className={styles.econBreakRow}>
                <span>Net metering &amp; DISCOM fees</span>
                <strong>Included</strong>
              </div>
              <div className={styles.econBreakRow}>
                <span>5-year AMC</span>
                <strong>Included</strong>
              </div>
            </div>
          </div>

          {/* Bill before / after */}
          <div className={`${styles.glass3D} ${styles.econPanel}`}>
            <span className={styles.econPanelTitle}>Yearly electricity bill</span>
            <div className={styles.econBillCompare}>
              <div className={styles.econBillCol}>
                <div
                  className={styles.econBillBarToday}
                  style={{ height: `${todayH}px` }}
                />
                <strong>{billToday > 0 ? formatInrCompact(billToday) : "—"}</strong>
                <span>Before solar</span>
              </div>
              <div className={styles.econBillArrow} aria-hidden>
                →
              </div>
              <div className={styles.econBillCol}>
                <div
                  className={styles.econBillBarAfter}
                  style={{ height: `${afterH}px` }}
                />
                <strong className={styles.accentText}>
                  {billToday > 0 ? formatInrCompact(billAfter) : "—"}
                </strong>
                <span>After solar</span>
              </div>
            </div>
            <p className={styles.econBillNote}>
              First-year savings:{" "}
              <strong>
                {annual > 0 ? formatInr(annual) : "—"}
              </strong>
              {monthly > 0 ? ` (~${formatInr(monthly)}/month)` : null}
            </p>
          </div>
        </div>

        {/* 25-year graph */}
        <div className={`${styles.glass3D} ${styles.econChartCard}`}>
          <div className={styles.econChartHead}>
            <div>
              <span className={styles.econPanelTitle}>25-year savings path</span>
              <p className={styles.econChartSub}>
                Starts as money you invest, crosses zero at payback, then grows
                as savings.
              </p>
            </div>
            <span className={styles.econChartBadge}>
              Break-even · {paybackLabel}
            </span>
          </div>

          <svg
            viewBox="0 0 560 168"
            width="100%"
            height="168"
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
              height={Math.max(0, 142 - chart.zeroY)}
              fill="rgba(239,68,68,0.04)"
            />

            {[0.25, 0.5, 0.75].map((t) => {
              const y = 20 + t * (168 - 20 - 26);
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

            <path d={chart.areaPath} fill="url(#qWealthFill)" />
            <path
              d={chart.linePath}
              stroke="url(#qWealthLine)"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <line
              x1={chart.breakX}
              y1={18}
              x2={chart.breakX}
              y2={142}
              stroke="rgba(6,182,212,0.35)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={chart.breakX} cy={chart.breakY} r="5" fill="#22d3ee" />
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
              PAYBACK
            </text>

            <circle cx={chart.endX} cy={chart.endY} r="3.5" fill="#e2e8f0" />
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

            {chart.yearTicks.map((t) => (
              <g key={t.label}>
                <line
                  x1={t.x}
                  y1={142}
                  x2={t.x}
                  y2={146}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <text
                  x={t.x}
                  y="158"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                >
                  {t.label}
                </text>
              </g>
            ))}

            <text x="40" y="12" fill="#64748b" fontSize="8" letterSpacing="0.5">
              CUMULATIVE POSITION
            </text>
          </svg>

          <p className={styles.econChartFoot}>
            Curve starts at your net cost, reaches break-even at {paybackLabel},
            then grows toward about{" "}
            {lifetime > 0 ? formatInrCompact(lifetime) : "long-term savings"}{" "}
            over 25 years.
          </p>
        </div>
      </div>
    </section>
  );
}

export default QuantumEconomics;
