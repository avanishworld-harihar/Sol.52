"use client";

/**
 * Premium Luxe — Wealth Terminal (Page 03).
 * Net-first capital story, bill comparison bars, 25-year wealth path chart.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatLuxeInr,
  formatLuxeInrReadable,
  formatLuxeYears,
} from "./luxe-format";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type WealthTerminalProps = {
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
  const h = 210;
  const padL = 44;
  const padR = 16;
  const padT = 22;
  const padB = 28;
  const pb = Math.min(Math.max(paybackYears > 0 ? paybackYears : 5, 1), 20);
  const lifetime = lifetimeInr > 0 ? lifetimeInr : Math.max(netInr * 4, 1);
  const net = netInr > 0 ? netInr : 1;
  const minV = -net;
  const maxV = Math.max(lifetime, net * 0.6);
  const span = maxV - minV || 1;

  const toX = (y: number) => padL + (y / years) * (w - padL - padR);
  const toY = (v: number) => padT + (1 - (v - minV) / span) * (h - padT - padB);

  const points: { x: number; y: number; v: number }[] = [];
  for (let yr = 0; yr <= years; yr++) {
    let cum: number;
    if (yr <= pb) {
      cum = -net + (net * yr) / pb;
    } else {
      cum = lifetime * ((yr - pb) / (years - pb));
    }
    points.push({ x: toX(yr), y: toY(cum), v: cum });
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1]!;
  const first = points[0]!;
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${toY(0).toFixed(1)} L ${first.x.toFixed(1)} ${toY(0).toFixed(1)} Z`;

  const breakIdx = Math.min(Math.round(pb), points.length - 1);
  const breakPt = points[breakIdx]!;
  const yearTicks = [0, 5, 10, 15, 20, 25].map((y) => ({
    x: toX(y),
    label: `Y${y}`,
  }));

  return {
    areaPath,
    linePath,
    zeroY: toY(0),
    breakX: breakPt.x,
    breakY: breakPt.y,
    endX: last.x,
    endY: last.y,
    yearTicks,
  };
}

function barHeights(today: number, after: number): { todayH: number; afterH: number } {
  const max = Math.max(today, after, 1);
  const scale = 92;
  return {
    todayH: Math.max(8, (today / max) * scale),
    afterH: Math.max(8, (after / max) * scale),
  };
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
  const billToday =
    yearlyBill > 0
      ? yearlyBill
      : savingsAnnual > 0
        ? Math.round(savingsAnnual * 1.18)
        : 0;
  const billAfter =
    billToday > 0 && savingsAnnual > 0
      ? Math.max(0, billToday - savingsAnnual)
      : 0;
  const monthlyRelief =
    savingsAnnual > 0 ? Math.round(savingsAnnual / 12) : 0;

  const chart = buildWealthSeries(payback, lifetime, net);
  const bars = barHeights(billToday || 1, billAfter || 1);

  const capitalTotal = Math.max(gross, net + subsidy, 1);
  const subsidyPct = subsidy > 0 ? (subsidy / capitalTotal) * 100 : 0;
  const netPct = net > 0 ? (net / capitalTotal) * 100 : 100;
  const { copy, isHi } = useLuxeLang();

  return (
    <section
      className={`${styles.a4Page} ${styles.luxeTerminal} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>{copy.wealth.tag}</span>
        <h2 className={styles.luxeHeadline}>{copy.wealth.title}</h2>
      </header>

      {/* Net + capital composition */}
      <div className={styles.wealthTop}>
        <div className={styles.netHero}>
          <span className={styles.netLabel}>{copy.wealth.netInvest}</span>
          <strong className={`${styles.netFigure} ${styles.luxeNum}`}>
            {formatLuxeInrReadable(net)}
          </strong>
          <p className={`${styles.netQuiet} ${styles.luxeNum}`}>
            {copy.wealth.exact} {formatLuxeInr(net)}
            {gross > 0
              ? ` · ${copy.wealth.gross} ${formatLuxeInr(gross)}${
                  subsidy > 0
                    ? ` − ${copy.wealth.subsidy} ${formatLuxeInr(subsidy)}`
                    : ""
                }`
              : ""}
          </p>
        </div>

        <div className={styles.capitalStack}>
          <span className={styles.capitalStackTitle}>{copy.wealth.capitalComp}</span>
          <div className={styles.capitalBar} aria-hidden>
            {subsidy > 0 ? (
              <div
                className={styles.capitalBarSubsidy}
                style={{ width: `${subsidyPct}%` }}
                title={copy.wealth.subsidy}
              />
            ) : null}
            <div
              className={styles.capitalBarNet}
              style={{ width: `${netPct}%` }}
              title={copy.wealth.yourNet}
            />
          </div>
          <div className={styles.capitalLegend}>
            {subsidy > 0 ? (
              <span>
                <i className={styles.dotSubsidy} /> {copy.wealth.subsidy}{" "}
                <strong className={styles.luxeNum}>{formatLuxeInrReadable(subsidy)}</strong>
              </span>
            ) : null}
            <span>
              <i className={styles.dotNet} /> {copy.wealth.yourNet}{" "}
              <strong className={styles.luxeNum}>{formatLuxeInrReadable(net)}</strong>
            </span>
            {gross > 0 ? (
              <span>
                {copy.wealth.gross}{" "}
                <strong className={styles.luxeNum}>{formatLuxeInrReadable(gross)}</strong>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bill comparison + KPIs */}
      <div className={styles.wealthMid}>
        <div className={styles.billCompare}>
          <div className={styles.billCompareHead}>
            <span>{copy.wealth.billCompare}</span>
            <span className={styles.luxeNum}>
              {copy.wealth.relief} {formatLuxeInrReadable(savingsAnnual)}
            </span>
          </div>
          <div className={styles.billBars}>
            <div className={styles.billBarCol}>
              <div className={styles.billBarTrack}>
                <div
                  className={styles.billBarToday}
                  style={{ height: `${bars.todayH}px` }}
                />
              </div>
              <strong className={`${styles.luxeNum} ${styles.billBarValue}`}>
                {billToday > 0 ? formatLuxeInr(billToday) : "—"}
              </strong>
              <span className={styles.billBarLabel}>{copy.wealth.todayGrid}</span>
            </div>
            <div className={styles.billBarCol}>
              <div className={styles.billBarTrack}>
                <div
                  className={styles.billBarAfter}
                  style={{ height: `${bars.afterH}px` }}
                />
              </div>
              <strong className={`${styles.luxeNum} ${styles.billBarValue}`}>
                {billAfter > 0 || billToday > 0 ? formatLuxeInr(billAfter) : "—"}
              </strong>
              <span className={styles.billBarLabel}>{copy.wealth.year1Solar}</span>
            </div>
            <div className={styles.billReliefCard}>
              <span>{copy.wealth.year1Relief}</span>
              <strong className={`${styles.luxeNum} ${styles.billReliefValue}`}>
                {savingsAnnual > 0 ? formatLuxeInrReadable(savingsAnnual) : "—"}
              </strong>
              <em className={styles.luxeNum}>
                {savingsAnnual > 0 ? formatLuxeInr(savingsAnnual) : ""}
                {monthlyRelief > 0
                  ? ` · ~${formatLuxeInr(monthlyRelief)}/mo`
                  : ""}
              </em>
            </div>
          </div>
        </div>

        <div className={styles.wealthKpis}>
          <div className={styles.wealthKpi}>
            <span>{copy.wealth.payback}</span>
            <strong className={styles.luxeNum}>{formatLuxeYears(payback)}</strong>
          </div>
          <div className={styles.wealthKpi}>
            <span>{copy.wealth.wealth25}</span>
            <strong className={styles.luxeNum}>
              {lifetime > 0 ? formatLuxeInrReadable(lifetime) : "—"}
            </strong>
          </div>
          <div className={styles.wealthKpi}>
            <span>{copy.wealth.monthlyRelief}</span>
            <strong className={styles.luxeNum}>
              {monthlyRelief > 0 ? formatLuxeInr(monthlyRelief) : "—"}
            </strong>
          </div>
        </div>
      </div>

      {/* 25-year wealth path */}
      <div className={styles.paybackChart}>
        <div className={styles.chartHead}>
          <span>{copy.wealth.wealthPath}</span>
          <span className={styles.luxeNum}>
            {copy.wealth.breakEven} · {formatLuxeYears(payback)}
          </span>
        </div>
        <svg
          viewBox="0 0 560 210"
          width="100%"
          height="200"
          className={styles.paybackSvg}
          aria-hidden
        >
          <defs>
            <linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(184,150,46,0.35)" />
              <stop offset="100%" stopColor="rgba(184,150,46,0.02)" />
            </linearGradient>
            <linearGradient id="wealthLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#A07820" />
              <stop offset="100%" stopColor="#B8962E" />
            </linearGradient>
          </defs>

          {/* Recovery zone below zero */}
          <rect
            x="44"
            y={chart.zeroY}
            width="500"
            height={Math.max(0, 182 - chart.zeroY)}
            fill="rgba(20,24,32,0.035)"
          />

          {/* Horizontal grid */}
          {[0.25, 0.5, 0.75].map((t) => {
            const y = 22 + t * (210 - 22 - 28);
            return (
              <line
                key={t}
                x1="44"
                y1={y}
                x2="544"
                y2={y}
                stroke="#E2E6EC"
                strokeWidth="1"
              />
            );
          })}

          {/* Zero / break-even baseline */}
          <line
            x1="44"
            y1={chart.zeroY}
            x2="544"
            y2={chart.zeroY}
            stroke="#8A93A0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="40"
            y={chart.zeroY + 3}
            textAnchor="end"
            fill="#2a3140"
            fontSize="8"
            fontFamily="system-ui,sans-serif"
          >
            ₹0
          </text>

          {/* Area + line */}
          <path d={chart.areaPath} fill="url(#wealthFill)" />
          <path
            d={chart.linePath}
            stroke="url(#wealthLine)"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Payback marker */}
          <line
            x1={chart.breakX}
            y1={22}
            x2={chart.breakX}
            y2={182}
            stroke="rgba(184,150,46,0.35)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={chart.breakX} cy={chart.breakY} r="5.5" fill="#B8962E" />
          <circle cx={chart.breakX} cy={chart.breakY} r="9" fill="none" stroke="#B8962E" strokeWidth="1" />
          <text
            x={chart.breakX}
            y={Math.max(16, chart.breakY - 14)}
            textAnchor="middle"
            fill="#B8962E"
            fontSize="9"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
            letterSpacing="0.8"
          >
            PAYBACK
          </text>

          {/* End wealth marker */}
          <circle cx={chart.endX} cy={chart.endY} r="4" fill="#141820" />
          <text
            x={Math.min(520, chart.endX - 4)}
            y={Math.max(16, chart.endY - 10)}
            textAnchor="end"
            fill="#141820"
            fontSize="9"
            fontFamily="system-ui,sans-serif"
            fontWeight="600"
          >
            {lifetime > 0 ? formatLuxeInrReadable(lifetime) : ""}
          </text>

          {/* Year axis */}
          {chart.yearTicks.map((t) => (
            <g key={t.label}>
              <line
                x1={t.x}
                y1={182}
                x2={t.x}
                y2={186}
                stroke="#2a3140"
                strokeWidth="1"
              />
              <text
                x={t.x}
                y="200"
                textAnchor="middle"
                fill="#1e2430"
                fontSize="9"
                fontFamily="system-ui,sans-serif"
              >
                {t.label}
              </text>
            </g>
          ))}

          <text
            x="44"
            y="14"
            fill="#2a3140"
            fontSize="8"
            fontFamily="system-ui,sans-serif"
            letterSpacing="0.6"
          >
            {copy.wealth.cumulative}
          </text>
          <text
            x="44"
            y={Math.min(178, chart.zeroY + 16)}
            fill="#2a3140"
            fontSize="8"
            fontFamily="system-ui,sans-serif"
          >
            {copy.wealth.recovery}
          </text>
        </svg>
        <p className={styles.chartFoot}>
          {copy.wealth.chartFoot(
            formatLuxeYears(payback),
            lifetime > 0 ? formatLuxeInrReadable(lifetime) : isHi ? "दीर्घकालिक संपत्ति" : "long-term wealth"
          )}
        </p>
      </div>

      <p className={styles.wealthFootnote}>{copy.wealth.footnote}</p>

      <ExpertVerdict label={copy.wealth.verdictLabel}>
        {net > 0
          ? isHi
            ? `${formatLuxeInrReadable(net)} का नेट खर्च ${formatLuxeYears(payback)} में वापस${
                savingsAnnual > 0
                  ? `; वर्ष-1 राहत ${formatLuxeInrReadable(savingsAnnual)} फिर जुड़ती जाती है`
                  : ""
              }${
                lifetime > 0
                  ? ` — 25 वर्षों में लगभग ${formatLuxeInrReadable(lifetime)}`
                  : ""
              }.`
            : `Net outlay of ${formatLuxeInrReadable(net)} recovers in ${formatLuxeYears(payback)}${
                savingsAnnual > 0
                  ? `; year-1 relief of ${formatLuxeInrReadable(savingsAnnual)} then compounds`
                  : ""
              }${
                lifetime > 0
                  ? ` toward about ${formatLuxeInrReadable(lifetime)} over 25 years`
                  : ""
              }.`
          : isHi
            ? "संपत्ति पथ देखें: पेबैक के बाद हर महीने की बिल राहत लंबी अवधि की घरेलू संपत्ति बनती है।"
            : `Watch the wealth path: once payback clears, every month of bill relief compounds into long-horizon household equity.`}
      </ExpertVerdict>
    </section>
  );
}

export default WealthTerminal;
