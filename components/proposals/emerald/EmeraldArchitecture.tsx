"use client";

/**
 * Emerald Signature — How solar generation works (clear pictorial path).
 * Live ProposalData / BOM only — no 5 kW / 615W / 9-panel / 75% PR fallbacks.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import { emeraldMetric, resolveEmeraldPanelSpec } from "./emerald-live";
import styles from "./Emerald.module.css";
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldArchitectureProps = {
  data: ProposalData;
  folio: string;
};

type StoryLabels = {
  light: string;
  dc: string;
  ac: string;
  home: string;
  grid: string;
  panels: string;
  inverter: string;
};

function visualGrid(count: number): { cols: number; rows: number; shown: number } {
  const shown = count > 0 ? Math.min(count, 10) : 6;
  const cols = shown <= 5 ? shown : Math.ceil(shown / 2);
  const rows = shown <= 5 ? 1 : 2;
  return { cols, rows, shown: count > 0 ? shown : 6 };
}

function GenerationScene({
  modules,
  watt,
  labels,
  ghost,
}: {
  modules: number;
  watt: number;
  labels: StoryLabels;
  ghost: boolean;
}) {
  const { cols, rows, shown } = visualGrid(modules);
  const roofX = 248;
  const roofY = 78;
  const roofW = 268;
  const roofH = 56;
  const cellW = (roofW - 16) / cols;
  const cellH = (roofH - 12) / rows;

  return (
    <svg
      viewBox="0 0 900 250"
      className={styles.anatomySvg}
      role="img"
      aria-label={`${labels.light} → ${labels.panels} → ${labels.inverter} → ${labels.home} / ${labels.grid}`}
    >
      <defs>
        <linearGradient id="em-gen-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D1FAE5" />
          <stop offset="55%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#FAFAF9" />
        </linearGradient>
        <linearGradient id="em-gen-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#115E59" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <marker id="em-gen-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#D4AF37" />
        </marker>
        <marker id="em-gen-arrow-ac" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#064E3B" />
        </marker>
      </defs>

      <rect width="900" height="250" fill="url(#em-gen-sky)" />
      <rect x="0" y="218" width="900" height="32" fill="#E7E5E4" />
      <rect x="0" y="218" width="900" height="3" fill="#D4AF37" />

      {/* 1. Sun + light */}
      <g>
        <circle cx="78" cy="72" r="34" fill="#D4AF37" />
        <circle cx="78" cy="72" r="22" fill="#FAFAF9" opacity="0.28" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={78 + Math.cos(r) * 40}
              y1={72 + Math.sin(r) * 40}
              x2={78 + Math.cos(r) * 52}
              y2={72 + Math.sin(r) * 52}
              stroke="#D4AF37"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        <path
          d="M112 92 C 160 108, 200 96, 248 92"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="4"
          strokeDasharray="7 6"
          markerEnd="url(#em-gen-arrow)"
        />
        <text x="78" y="148" textAnchor="middle" className={styles.storySvgLabel}>
          1 · {labels.light}
        </text>
      </g>

      {/* 2. House + rooftop array */}
      <g>
        <rect x="260" y="132" width="248" height="86" rx="3" fill="#FAFAF9" stroke="#064E3B" strokeWidth="2.5" />
        <rect x="248" y="118" width="272" height="18" fill="#064E3B" />
        <rect x={roofX} y={roofY} width={roofW} height={roofH} rx="3" fill="#E7E5E4" stroke="#064E3B" strokeWidth="2" />
        {Array.from({ length: shown }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          return (
            <rect
              key={`p-${i}`}
              x={roofX + 8 + col * cellW + 2}
              y={roofY + 6 + row * cellH + 1}
              width={cellW - 6}
              height={cellH - 4}
              rx="1.5"
              fill={ghost ? "rgba(6,78,59,0.18)" : "url(#em-gen-panel)"}
              stroke="#D4AF37"
              strokeWidth="0.8"
              opacity={ghost ? 0.7 : 1}
            />
          );
        })}
        <rect x="368" y="168" width="28" height="50" fill="#064E3B" />
        <rect x="292" y="150" width="36" height="28" fill="#A7F3D0" stroke="#064E3B" strokeWidth="1.2" />
        <rect x="432" y="150" width="36" height="28" fill="#FEF3C7" stroke="#D4AF37" strokeWidth="1.5" />
        <text x="384" y="242" textAnchor="middle" className={styles.storySvgLabel}>
          2 · {labels.panels}
          {modules > 0 && watt > 0 ? `  ${modules}×${watt}W` : ""}
        </text>
      </g>

      {/* DC drop to inverter */}
      <path
        d="M516 134 L 516 168 L 548 168"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="5"
        markerEnd="url(#em-gen-arrow)"
      />
      <rect x="500" y="146" width="28" height="16" rx="8" fill="#FAFAF9" stroke="#D4AF37" strokeWidth="1.5" />
      <text x="514" y="158" textAnchor="middle" fill="#D4AF37" fontSize="9" fontWeight="700" fontFamily="Courier New, monospace">
        {labels.dc}
      </text>

      {/* 3. Inverter */}
      <g>
        <rect x="548" y="148" width="78" height="70" rx="6" fill="#FAFAF9" stroke="#064E3B" strokeWidth="2.5" />
        <path d="M562 183 Q 576 166, 588 183 T 614 183" fill="none" stroke="#064E3B" strokeWidth="3" />
        <text x="587" y="242" textAnchor="middle" className={styles.storySvgLabel}>
          3 · {labels.inverter}
        </text>
      </g>

      {/* AC split */}
      <path
        d="M626 170 L 668 170 L 668 118 L 712 118"
        fill="none"
        stroke="#064E3B"
        strokeWidth="4"
        markerEnd="url(#em-gen-arrow-ac)"
      />
      <path
        d="M626 190 L 668 190 L 668 198 L 742 198"
        fill="none"
        stroke="#064E3B"
        strokeWidth="4"
        markerEnd="url(#em-gen-arrow-ac)"
      />
      <rect x="640" y="176" width="28" height="16" rx="8" fill="#064E3B" />
      <text x="654" y="188" textAnchor="middle" fill="#FAFAF9" fontSize="9" fontWeight="700" fontFamily="Courier New, monospace">
        {labels.ac}
      </text>

      {/* 4a Home load */}
      <g>
        <circle cx="748" cy="118" r="28" fill="#FEF3C7" stroke="#D4AF37" strokeWidth="2" />
        <path d="M748 102 L748 118 M738 118 Q748 132 758 118" fill="none" stroke="#064E3B" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="748" cy="102" r="3.5" fill="#D4AF37" />
        <text x="748" y="162" textAnchor="middle" className={styles.storySvgLabel}>
          4 · {labels.home}
        </text>
      </g>

      {/* 4b Grid */}
      <g>
        <path
          d="M768 218 L784 148 L800 218 M776 178 L792 178 M778 198 L794 198"
          fill="none"
          stroke="#064E3B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="784" y1="148" x2="818" y2="138" stroke="#D4AF37" strokeWidth="2" />
        <line x1="784" y1="148" x2="754" y2="138" stroke="#D4AF37" strokeWidth="2" />
        <text x="804" y="242" textAnchor="middle" className={styles.storySvgLabel}>
          4 · {labels.grid}
        </text>
      </g>
    </svg>
  );
}

export function EmeraldArchitecture({ data, folio }: EmeraldArchitectureProps) {
  const { copy } = useEmeraldLang();
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp, panelItem, inverterItem } =
    resolveEmeraldPanelSpec(data);
  const ratio = systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
  const acLabel = formatEmeraldKw(systemKw, 1);
  const dcLabel = dcKwp > 0 ? formatEmeraldKw(dcKwp) : "—";
  const prValue = emeraldMetric(data, /performance|pr\b/i);
  const panelBrand = panelItem?.brand?.trim() || "";
  const inverterBrand = inverterItem?.brand?.trim() || "";

  const steps = [
    { n: "01", title: copy.arch.stepSun, hint: copy.arch.stepSunHint },
    { n: "02", title: copy.arch.stepPanels, hint: copy.arch.stepPanelsHint(modules, watt) },
    { n: "03", title: copy.arch.stepInverter, hint: copy.arch.stepInverterHint },
    { n: "04", title: copy.arch.stepHome, hint: copy.arch.stepHomeHint },
  ];

  const pills = [
    {
      label: copy.arch.stepPanels,
      value:
        modules > 0 && watt > 0
          ? `${modules} × ${watt}W`
          : panelBrand || "—",
    },
    {
      label: copy.arch.totalArray,
      value: dcKwp > 0 ? `${dcLabel} kWp` : "—",
    },
    {
      label: copy.arch.acOutput,
      value: systemKw > 0 ? `${acLabel} kW` : "—",
    },
    {
      label: copy.arch.dcAcRatio,
      value: ratio > 0 ? `${ratio.toFixed(2)}x` : "—",
    },
    {
      label: copy.arch.topology,
      value: copy.arch.onGrid,
    },
  ];

  return (
    <section className={`${styles.a4Page} ${styles.anatomyPage}`}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.arch.sidebarTitle[0]}
            <br />
            {copy.arch.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.arch.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.arch.pageHeader}</h2>
        <span className={styles.anatomyKicker}>{copy.arch.storyEyebrow}</span>

        <div className={styles.anatomyPlate}>
          <GenerationScene
            modules={modules}
            watt={watt}
            ghost={modules <= 0}
            labels={{
              light: copy.arch.labelLight,
              dc: copy.arch.labelDc,
              ac: copy.arch.labelAc,
              home: copy.arch.labelHome,
              grid: copy.arch.labelGrid,
              panels: copy.arch.stepPanels,
              inverter: copy.arch.stepInverter,
            }}
          />
        </div>

        <div className={styles.storySteps}>
          {steps.map((step) => (
            <div className={styles.storyStep} key={step.n}>
              <span className={styles.storyNum}>{step.n}</span>
              <span className={styles.storyTitle}>{step.title}</span>
              <p className={styles.storyHint}>{step.hint}</p>
            </div>
          ))}
        </div>

        <span className={styles.anatomyLegendEyebrow}>{copy.arch.specEyebrow}</span>
        <div className={styles.specPills}>
          {pills.map((pill) => (
            <div className={styles.specPill} key={pill.label}>
              <span>{pill.label}</span>
              <strong>{pill.value}</strong>
            </div>
          ))}
        </div>
        {panelBrand || inverterBrand ? (
          <p className={styles.storyBrands}>
            {[panelBrand, inverterBrand].filter(Boolean).join("  ·  ")}
          </p>
        ) : null}

        <div className={styles.prMathBlock}>
          <div className={styles.prMathText}>
            <span className={styles.goldEyebrow}>{copy.arch.prDerating}</span>
            <p>
              {copy.arch.prBlurb}
              {prValue ? `  ${prValue}` : ""}
            </p>
          </div>
          <div className={styles.prMathFormula} aria-label={copy.arch.prFormulaAria}>
            <span className={styles.prEq}>PR</span>
            <span className={styles.prEqOp}>=</span>
            <span className={styles.prFrac}>
              <span className={styles.prNum}>
                E<sub>grid</sub>
              </span>
              <span className={styles.prDen}>
                P<sub>nom</sub> × H / G<sub>STC</sub>
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldArchitecture;
