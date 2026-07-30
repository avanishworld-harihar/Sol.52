"use client";

/**
 * Quantum Economics — Financial Yield Terminal (professional capital summary).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import { useQuantumBrand } from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumEconomicsProps = {
  data: ProposalData;
};

function CashflowSparkline({
  paybackYears,
  lifetimeInr,
  netInr,
}: {
  paybackYears: number;
  lifetimeInr: number;
  netInr: number;
}) {
  const years = 25;
  const w = 520;
  const h = 78;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 14;
  const pb = Math.min(Math.max(paybackYears > 0 ? paybackYears : 5, 1), 20);
  const lifetime = lifetimeInr > 0 ? lifetimeInr : Math.max(netInr * 4, 1);
  const net = netInr > 0 ? netInr : 1;
  const minV = -net;
  const maxV = Math.max(lifetime, net * 0.5);
  const span = maxV - minV || 1;

  const toX = (y: number) => padL + (y / years) * (w - padL - padR);
  const toY = (v: number) => padT + (1 - (v - minV) / span) * (h - padT - padB);

  const pts: string[] = [];
  for (let yr = 0; yr <= years; yr++) {
    let cum: number;
    if (yr <= pb) {
      cum = -net + (net * yr) / pb;
    } else {
      cum = lifetime * ((yr - pb) / (years - pb));
    }
    pts.push(`${toX(yr).toFixed(1)},${toY(cum).toFixed(1)}`);
  }

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  const area = `${line} L${last.split(",")[0]},${toY(0).toFixed(1)} L${first.split(",")[0]},${toY(0).toFixed(1)} Z`;
  const breakX = toX(pb);
  const zeroY = toY(0);

  return (
    <svg className={styles.cashflowChart} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id="qCashFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <line
        x1={padL}
        y1={zeroY}
        x2={w - padR}
        y2={zeroY}
        stroke="rgba(148,163,184,0.25)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {[5, 10, 15, 20, 25].map((y) => (
        <line
          key={y}
          x1={toX(y)}
          y1={padT}
          x2={toX(y)}
          y2={h - padB}
          stroke="rgba(148,163,184,0.08)"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill="url(#qCashFill)" />
      <path d={line} fill="none" stroke="#22d3ee" strokeWidth="2" />

      <line
        x1={breakX}
        y1={padT}
        x2={breakX}
        y2={h - padB}
        stroke="#14b8a6"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <circle cx={breakX} cy={zeroY} r="3.5" fill="#14b8a6" />
      <text
        x={breakX + 6}
        y={padT + 8}
        fill="#14b8a6"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.5"
      >
        PAYBACK
      </text>

      {[0, 5, 10, 15, 20, 25].map((y) => (
        <text
          key={`t-${y}`}
          x={toX(y)}
          y={h - 2}
          textAnchor="middle"
          fill="#64748b"
          fontSize="7"
          fontFamily="JetBrains Mono, monospace"
        >
          Y{y}
        </text>
      ))}
    </svg>
  );
}

function TerminalAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden>
      <svg width="100%" height="100%" viewBox="0 0 210 297" preserveAspectRatio="none">
        <rect width="210" height="297" fill="#111827" />
        <defs>
          <radialGradient id="qEconBloom" cx="70%" cy="80%" r="45%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="210" height="297" fill="url(#qEconBloom)" />
        {Array.from({ length: 40 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={8 + i * 7.2}
            x2="210"
            y2={8 + i * 7.2}
            stroke="rgba(255,255,255,0.015)"
            strokeWidth="0.4"
          />
        ))}
      </svg>
    </div>
  );
}

export function QuantumEconomics({ data }: QuantumEconomicsProps) {
  const brand = useQuantumBrand(data);
  const eco = data.economics;
  const gross = eco.grossInr;
  const subsidy = eco.subsidyInr;
  const net = eco.netInr;
  const payback = eco.paybackYears;
  const monthly = eco.monthlySavingsInr;
  const annual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly * 12;
  const lifetime =
    data.closing.lifetimeWealthInr || eco.lifetimeProfitInr;

  const paybackLabel =
    payback > 0
      ? `${payback.toFixed(payback % 1 ? 1 : 0)} yr`
      : "—";

  const wealthMultiple =
    net > 0 && lifetime > 0 ? (lifetime / net).toFixed(1) : null;

  const cells: {
    label: string;
    value: string;
    hint: string;
    accent?: boolean;
  }[] = [
    {
      label: "Gross CapEx",
      value: gross > 0 ? formatInr(gross) : "—",
      hint: "Plant + BOS + commissioning",
    },
    {
      label: "MNRE / State Subsidy",
      value: subsidy > 0 ? formatInr(subsidy) : "—",
      hint: "Subject to DISCOM approval",
    },
    {
      label: "Net Customer Outlay",
      value: net > 0 ? formatInr(net) : "—",
      hint: "Gross − sanctioned subsidy",
      accent: true,
    },
    {
      label: "Simple Payback",
      value: paybackLabel,
      hint: "Net ÷ modelled annual savings",
      accent: true,
    },
  ];

  return (
    <section className={styles.a4Page}>
      <TerminalAtmosphere />

      <div className={styles.econInner}>
        <header>
          <p className={styles.eyebrow}>Financial Yield Terminal</p>
          <h2 className={styles.econTitle}>
            Investment
            <br />
            Clarity
          </h2>
        </header>

        <div className={`${styles.glassPanel} ${styles.terminalFrame}`}>
          <div className={styles.terminalChrome}>
            <span>{brand.toUpperCase()}</span>
            <span className={styles.terminalLive}>RESIDENTIAL LT · INR</span>
            <span>25-YEAR MODEL</span>
          </div>

          <div className={styles.terminalBody}>
            <div className={styles.dataGrid}>
              {cells.map((cell) => (
                <div
                  key={cell.label}
                  className={`${styles.dataCell} ${styles.dataCellGlass}${
                    cell.accent ? ` ${styles.dataCellAccent}` : ""
                  }`}
                >
                  <span className={styles.dataCellCornerTL} aria-hidden />
                  <span className={styles.dataCellCornerBR} aria-hidden />
                  <div className={styles.dataCellLabel}>{cell.label}</div>
                  <div
                    className={
                      cell.accent ? styles.dataCellValueCyan : styles.dataCellValue
                    }
                  >
                    {cell.value}
                  </div>
                  <div className={styles.dataCellHint}>{cell.hint}</div>
                </div>
              ))}
            </div>

            {/* Sharp contrast: net outlay vs lifetime wealth */}
            <div className={styles.contrastStrip}>
              <div className={`${styles.contrastCard} ${styles.neoGlassCard}`}>
                <span className={styles.contrastLabel}>Net Customer Outlay</span>
                <span className={styles.contrastValueNet}>
                  {net > 0 ? formatInr(net) : "—"}
                </span>
                <span className={styles.contrastHint}>After MNRE / state subsidy</span>
              </div>
              <div className={styles.contrastArrow} aria-hidden>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M4 14 H20 M14 8 L22 14 L14 20"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className={`${styles.contrastCard} ${styles.neoGlassCard} ${styles.contrastCardLife}`}>
                <span className={styles.contrastLabel}>Lifetime Benefit</span>
                <span className={styles.contrastValueLife}>
                  {lifetime > 0 ? formatInrCompact(lifetime) : "—"}
                </span>
                <span className={styles.contrastHint}>
                  {wealthMultiple
                    ? `≈ ${wealthMultiple}× net outlay over 25 years`
                    : "25-year modelled savings"}
                </span>
              </div>
            </div>

            <div className={`${styles.glassPanel} ${styles.cashflowPanel}`}>
              <div className={styles.cashflowHeader}>
                <span>25-Year Cumulative Cash Position</span>
                <span>
                  Lifetime{" "}
                  {lifetime > 0 ? formatInrCompact(lifetime) : "—"}
                </span>
              </div>
              <CashflowSparkline
                paybackYears={payback}
                lifetimeInr={lifetime}
                netInr={net}
              />
            </div>

            <div className={styles.algoFooter}>
              <div className={styles.algoStat}>
                <div className={styles.algoStatLabel}>Monthly Savings</div>
                <div className={styles.algoStatValue}>
                  {monthly > 0 ? formatInr(monthly) : "—"}
                </div>
              </div>
              <div className={styles.algoStat}>
                <div className={styles.algoStatLabel}>Annual Savings</div>
                <div className={styles.algoStatValue}>
                  {annual > 0 ? formatInr(annual) : "—"}
                </div>
              </div>
              <div className={styles.algoStat}>
                <div className={styles.algoStatLabel}>CO₂ Avoided (25y)</div>
                <div className={styles.algoStatValue}>
                  {data.impact.co2Tons > 0
                    ? `${data.impact.co2Tons.toFixed(1)} t`
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.pageFooter}>
          <span className={styles.pageFooterAccent}>{brand.toUpperCase()}</span>
          <span>03 / 03 · ECONOMICS</span>
        </footer>
      </div>
    </section>
  );
}

export default QuantumEconomics;
