"use client";

/**
 * Premium Luxe — Wealth Terminal (Page 03).
 * Net-first hero, before/after bill strip, SVG payback path.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatLuxeInr,
  formatLuxeInrReadable,
  formatLuxeYears,
} from "./luxe-format";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type WealthTerminalProps = {
  data: ProposalData;
};

function buildPaybackPath(
  paybackYears: number,
  lifetimeInr: number,
  netInr: number
): { path: string; breakX: number; breakY: number } {
  const years = 25;
  const w = 520;
  const h = 140;
  const padX = 8;
  const padY = 12;
  const pb = Math.min(Math.max(paybackYears > 0 ? paybackYears : 5, 1), 20);
  const lifetime = lifetimeInr > 0 ? lifetimeInr : netInr * 3;
  const net = netInr > 0 ? netInr : 1;

  const points: { x: number; y: number }[] = [];
  for (let y = 0; y <= years; y++) {
    let cum: number;
    if (y <= pb) {
      cum = -net + (net * y) / pb;
    } else {
      const after = lifetime * ((y - pb) / (years - pb));
      cum = after;
    }
    const minV = -net;
    const maxV = Math.max(lifetime, net * 0.5);
    const t = (cum - minV) / (maxV - minV || 1);
    const x = padX + (y / years) * (w - padX * 2);
    const py = h - padY - t * (h - padY * 2);
    points.push({ x, y: py });
  }

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const breakIdx = Math.round(pb);
  const breakPt = points[Math.min(breakIdx, points.length - 1)]!;
  return { path, breakX: breakPt.x, breakY: breakPt.y };
}

export function WealthTerminal({ data }: WealthTerminalProps) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const savingsAnnual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : data.economics.monthlySavingsInr * 12;
  const payback = data.economics.paybackYears;
  const lifetime =
    data.closing.lifetimeWealthInr || data.economics.lifetimeProfitInr;
  const yearlyBill = data.bill.yearlyBillInr;
  const billAfter =
    yearlyBill > 0 && savingsAnnual > 0
      ? Math.max(0, yearlyBill - savingsAnnual)
      : 0;

  const chart = buildPaybackPath(payback, lifetime, net);

  return (
    <section
      className={`${styles.a4Page} ${styles.luxeTerminal} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>03 // CAPITAL CLARITY</span>
        <h2 className={styles.luxeHeadline}>Your Net Position.</h2>
      </header>

      <div className={styles.netHero}>
        <span className={styles.netLabel}>YOUR NET INVESTMENT</span>
        <strong className={`${styles.netFigure} ${styles.luxeNum}`}>
          {formatLuxeInrReadable(net)}
        </strong>
        <p className={`${styles.netQuiet} ${styles.luxeNum}`}>
          Exact: {formatLuxeInr(net)}
          {gross > 0
            ? ` · Gross ${formatLuxeInr(gross)}${
                subsidy > 0 ? ` − Subsidy ${formatLuxeInr(subsidy)}` : ""
              }`
            : ""}
        </p>
      </div>

      <div className={styles.beforeAfter}>
        <div className={styles.baCol}>
          <span className={styles.baLabel}>TODAY · ANNUAL GRID BILL</span>
          <strong className={`${styles.baValue} ${styles.luxeNum}`}>
            {yearlyBill > 0 ? formatLuxeInr(yearlyBill) : "—"}
          </strong>
          {yearlyBill > 0 ? (
            <span className={styles.baSub}>{formatLuxeInrReadable(yearlyBill)}</span>
          ) : null}
        </div>
        <div className={styles.baArrow} aria-hidden>
          →
        </div>
        <div className={styles.baCol}>
          <span className={styles.baLabel}>YEAR 1 · WITH SOLAR</span>
          <strong className={`${styles.baValue} ${styles.luxeNum}`}>
            {billAfter > 0
              ? formatLuxeInr(billAfter)
              : savingsAnnual > 0
                ? formatLuxeInr(
                    Math.max(0, (yearlyBill || Math.round(savingsAnnual * 1.4)) - savingsAnnual)
                  )
                : "—"}
          </strong>
        </div>
        <div className={`${styles.baCol} ${styles.baDelta}`}>
          <span className={styles.baLabel}>YEAR-1 RELIEF</span>
          <strong className={`${styles.baValueGold} ${styles.luxeNum}`}>
            {savingsAnnual > 0 ? formatLuxeInr(savingsAnnual) : "—"}
          </strong>
          <span className={styles.baSub}>
            {savingsAnnual > 0 ? formatLuxeInrReadable(savingsAnnual) : "Bill reduction"}
          </span>
        </div>
      </div>

      <div className={styles.paybackChart}>
        <div className={styles.chartHead}>
          <span>25-YEAR WEALTH PATH</span>
          <span className={styles.luxeNum}>
            Break-even · {formatLuxeYears(payback)}
          </span>
        </div>
        <svg
          viewBox="0 0 520 160"
          width="100%"
          height="160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.paybackSvg}
          aria-hidden
        >
          <line
            x1="8"
            y1="80"
            x2="512"
            y2="80"
            stroke="#D8DEE6"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d={chart.path}
            stroke="#B8962E"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={chart.breakX}
            cy={chart.breakY}
            r="5"
            fill="#B8962E"
          />
          <text
            x={chart.breakX}
            y={Math.max(18, chart.breakY - 12)}
            textAnchor="middle"
            fill="#B8962E"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            letterSpacing="1"
          >
            PAYBACK
          </text>
          <text x="8" y="154" fill="#2a3140" fontSize="9">
            Yr 0
          </text>
          <text x="500" y="154" fill="#2a3140" fontSize="9" textAnchor="end">
            Yr 25
          </text>
        </svg>
        <p className={styles.chartFoot}>
          After payback, every month is bill relief
          {lifetime > 0
            ? ` · lifetime path about ${formatLuxeInrReadable(lifetime)} (${formatLuxeInr(lifetime)})`
            : ""}
          .
        </p>
      </div>

      <p className={styles.wealthFootnote}>
        Subsidy subject to MNRE / DISCOM approval · figures derived from your bill upload
        and site yield assumptions.
      </p>
    </section>
  );
}

export default WealthTerminal;
