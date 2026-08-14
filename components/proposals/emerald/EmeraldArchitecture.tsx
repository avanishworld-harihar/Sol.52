"use client";

/**
 * Emerald Signature — Plant Anatomy (exploded orthographic drawing).
 * Live ProposalData / BOM only — no 5 kW / 615W / 9-panel / 75% PR fallbacks.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import {
  emeraldAnnualUnits,
  emeraldMetric,
  resolveEmeraldPanelSpec,
} from "./emerald-live";
import styles from "./Emerald.module.css";
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldArchitectureProps = {
  data: ProposalData;
  folio: string;
};

const ROOF = {
  a: [268, 208],
  b: [528, 112],
  c: [768, 214],
  d: [508, 312],
} as const;

function roofPt(u: number, v: number): [number, number] {
  const { a, b, c, d } = ROOF;
  const x =
    (1 - u) * (1 - v) * a[0] + u * (1 - v) * b[0] + u * v * c[0] + (1 - u) * v * d[0];
  const y =
    (1 - u) * (1 - v) * a[1] + u * (1 - v) * b[1] + u * v * c[1] + (1 - u) * v * d[1];
  return [x, y];
}

function panelPoly(col: number, row: number, cols: number, rows: number): string {
  const gap = 0.08;
  const u0 = 0.1 + (col / cols) * 0.8;
  const u1 = 0.1 + ((col + 1 - gap) / cols) * 0.8;
  const v0 = 0.12 + (row / rows) * 0.72;
  const v1 = 0.12 + ((row + 1 - gap) / rows) * 0.72;
  const p = [roofPt(u0, v0), roofPt(u1, v0), roofPt(u1, v1), roofPt(u0, v1)];
  return p.map(([x, y]) => `${x},${y}`).join(" ");
}

function visualGrid(count: number): { cols: number; rows: number; shown: number } {
  const shown = count > 0 ? Math.min(count, 12) : 0;
  if (shown <= 0) return { cols: 3, rows: 2, shown: 0 };
  if (shown <= 4) return { cols: shown, rows: 1, shown };
  if (shown <= 8) return { cols: Math.ceil(shown / 2), rows: 2, shown };
  return { cols: 4, rows: Math.ceil(shown / 4), shown };
}

function Callout({
  n,
  from,
  to,
}: {
  n: string;
  from: [number, number];
  to: [number, number];
}) {
  return (
    <g>
      <polyline
        points={`${from[0]},${from[1]} ${to[0]},${to[1]}`}
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.4"
      />
      <circle cx={to[0]} cy={to[1]} r="12" fill="#064E3B" stroke="#D4AF37" strokeWidth="1.5" />
      <text
        x={to[0]}
        y={to[1] + 4}
        textAnchor="middle"
        fill="#FAFAF9"
        fontSize="11"
        fontFamily="Courier New, ui-monospace, monospace"
        fontWeight="700"
      >
        {n}
      </text>
    </g>
  );
}

function AnatomyDrawing({
  modules,
  watt,
  dcLabel,
  acLabel,
  tiltLabel,
  year1Label,
  plateDwg,
}: {
  modules: number;
  watt: number;
  dcLabel: string;
  acLabel: string;
  tiltLabel: string;
  year1Label: string;
  plateDwg: string;
}) {
  const { cols, rows, shown } = visualGrid(modules);
  const extra = modules > shown ? modules - shown : 0;
  const arrayPts: string[] = [];
  for (let i = 0; i < shown; i += 1) {
    arrayPts.push(panelPoly(i % cols, Math.floor(i / cols), cols, rows));
  }

  return (
    <svg
      viewBox="0 0 880 360"
      className={styles.anatomySvg}
      role="img"
      aria-label={plateDwg}
    >
      <defs>
        <linearGradient id="em-anatomy-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#FAFAF9" />
        </linearGradient>
        <linearGradient id="em-anatomy-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="55%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
        <pattern
          id="em-anatomy-iso"
          width="28"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-30)"
        >
          <path d="M0 16 L28 0" stroke="rgba(6,78,59,0.07)" strokeWidth="1" fill="none" />
        </pattern>
      </defs>

      <rect width="880" height="360" fill="url(#em-anatomy-sky)" />
      <rect width="880" height="360" fill="url(#em-anatomy-iso)" />

      <rect x="10" y="10" width="860" height="340" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1" />
      <rect x="16" y="16" width="848" height="328" fill="none" stroke="rgba(6,78,59,0.12)" strokeWidth="0.75" />

      {/* Sun + photon rays */}
      <g>
        <circle cx="92" cy="62" r="22" fill="#D4AF37" />
        <circle cx="92" cy="62" r="14" fill="#FAFAF9" opacity="0.35" />
        {[
          [118, 72, 250, 150],
          [112, 86, 290, 175],
          [104, 94, 330, 198],
        ].map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#D4AF37"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            opacity="0.85"
          />
        ))}
      </g>

      {/* Terrace slab (isometric) */}
      <polygon
        points={`${ROOF.a.join(",")} ${ROOF.b.join(",")} ${ROOF.c.join(",")} ${ROOF.d.join(",")}`}
        fill="#E7E5E4"
        stroke="#064E3B"
        strokeWidth="2"
      />
      <polygon
        points={`${ROOF.a.join(",")} ${ROOF.d.join(",")} 508,332 268,228`}
        fill="#D6D3D1"
        stroke="#064E3B"
        strokeWidth="1.5"
      />
      <polygon
        points={`${ROOF.d.join(",")} ${ROOF.c.join(",")} 768,234 508,332`}
        fill="#A8A29E"
        stroke="#064E3B"
        strokeWidth="1.5"
      />

      {/* Array envelope if no live count */}
      {shown === 0 ? (
        <polygon
          points={`${roofPt(0.12, 0.14).join(",")} ${roofPt(0.88, 0.14).join(",")} ${roofPt(0.88, 0.82).join(",")} ${roofPt(0.12, 0.82).join(",")}`}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.4"
          strokeDasharray="6 4"
        />
      ) : (
        arrayPts.map((pts, i) => (
          <polygon
            key={`pv-${i}`}
            points={pts}
            fill="url(#em-anatomy-panel)"
            stroke="#D4AF37"
            strokeWidth="0.9"
          />
        ))
      )}

      {/* Inverter — exploded isometric cube */}
      <g>
        <polygon points="168,248 228,228 228,278 168,298" fill="#FAFAF9" stroke="#064E3B" strokeWidth="2" />
        <polygon points="228,228 268,248 268,298 228,278" fill="#D6D3D1" stroke="#064E3B" strokeWidth="2" />
        <polygon points="168,248 228,228 268,248 208,268" fill="#064E3B" />
        <path d="M182 268 Q198 256, 214 268 T246 268" fill="none" stroke="#D4AF37" strokeWidth="2" />
        <path
          d="M248 258 L310 210"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeDasharray="6 3"
        />
      </g>

      {/* Home — isometric cottage */}
      <g>
        <polygon points="790,168 830,152 858,168 858,208 790,224 790,168" fill="#E7E5E4" stroke="#064E3B" strokeWidth="1.6" />
        <polygon points="790,168 824,138 858,168" fill="#064E3B" />
        <rect x="812" y="180" width="14" height="16" fill="#D4AF37" />
      </g>

      {/* Grid pylon */}
      <g>
        <path
          d="M792 292 L808 220 L824 292 M800 248 L816 248 M804 268 L820 268"
          fill="none"
          stroke="#064E3B"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <line x1="808" y1="220" x2="838" y2="208" stroke="#D4AF37" strokeWidth="1.6" />
      </g>

      {/* AC split from inverter */}
      <path
        d="M268 270 C 420 300, 620 250, 790 210"
        fill="none"
        stroke="#064E3B"
        strokeWidth="2.2"
      />
      <path
        d="M268 278 C 430 320, 640 300, 808 248"
        fill="none"
        stroke="#064E3B"
        strokeWidth="2.2"
        strokeDasharray="5 3"
      />

      <Callout n="01" from={roofPt(0.18, 0.22)} to={[86, 168]} />
      <Callout n="02" from={roofPt(0.55, 0.08)} to={[430, 48]} />
      <Callout n="03" from={[208, 268]} to={[86, 268]} />
      <Callout n="04" from={[790, 176]} to={[730, 86]} />
      <Callout n="05" from={[808, 268]} to={[730, 318]} />

      {extra > 0 ? (
        <text x="640" y="128" fill="#064E3B" fontSize="11" fontFamily="Courier New, monospace">
          +{extra}
        </text>
      ) : null}

      {tiltLabel ? (
        <text
          x="640"
          y="300"
          fill="#78716C"
          fontSize="10"
          fontFamily="Courier New, ui-monospace, monospace"
          letterSpacing="1.4"
        >
          {tiltLabel}
        </text>
      ) : null}

      <text
        x="28"
        y="338"
        fill="#78716C"
        fontSize="9"
        fontFamily="Courier New, ui-monospace, monospace"
        letterSpacing="1.6"
      >
        {plateDwg}
        {dcLabel !== "—" ? `  ·  ${dcLabel} kWp DC` : ""}
        {acLabel !== "—" ? `  ·  ${acLabel} kW AC` : ""}
        {year1Label ? `  ·  ${year1Label}` : ""}
        {watt > 0 ? `  ·  ${watt} Wp` : ""}
      </text>
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
  const tiltDeg = Number(data.engineering.tiltDeg);
  const tiltLabel =
    Number.isFinite(tiltDeg) && tiltDeg > 0 ? copy.arch.tiltDim(Math.round(tiltDeg)) : "";
  const year1 = emeraldAnnualUnits(data);
  const year1Label =
    year1 > 0 ? copy.arch.year1Dim(year1.toLocaleString("en-IN")) : "";
  const panelBrand = panelItem?.brand?.trim() || "";
  const inverterBrand = inverterItem?.brand?.trim() || "";

  const legend = [
    {
      n: "01",
      label: copy.arch.callModule,
      value: watt > 0 ? `${watt} W` : "—",
      hint: panelBrand || "—",
    },
    {
      n: "02",
      label: copy.arch.callArray,
      value:
        modules > 0 && watt > 0
          ? `${modules} × ${watt}W`
          : dcKwp > 0
            ? `${dcLabel} kWp`
            : "—",
      hint: dcKwp > 0 ? `${dcLabel} kWp DC` : "—",
    },
    {
      n: "03",
      label: copy.arch.callInverter,
      value: systemKw > 0 ? `${acLabel} kW` : "—",
      hint: inverterBrand || copy.arch.mpptSuffix,
    },
    {
      n: "04",
      label: copy.arch.callHome,
      value: copy.arch.callHomeHint,
      hint: ratio > 0 ? `${ratio.toFixed(2)}x DC/AC` : "—",
    },
    {
      n: "05",
      label: copy.arch.callGrid,
      value: copy.arch.onGrid,
      hint: copy.arch.callGridHint,
    },
  ];

  const cascade = [
    { k: "sun", title: copy.arch.photonSun, value: copy.arch.photonSunHint, tone: "gold" as const },
    {
      k: "dc",
      title: copy.arch.photonDc,
      value: dcKwp > 0 ? `${dcLabel} kWp` : "—",
      tone: "forest" as const,
    },
    {
      k: "ac",
      title: copy.arch.photonAc,
      value: systemKw > 0 ? `${acLabel} kW AC` : "—",
      tone: "forest" as const,
    },
    {
      k: "out",
      title: copy.arch.photonOut,
      value: prValue || copy.arch.callGridHint,
      tone: "ivory" as const,
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
        <span className={styles.anatomyKicker}>{copy.arch.plateEyebrow}</span>

        <div className={styles.anatomyPlate}>
          <AnatomyDrawing
            modules={modules}
            watt={watt}
            dcLabel={dcLabel}
            acLabel={acLabel}
            tiltLabel={tiltLabel}
            year1Label={year1Label}
            plateDwg={copy.arch.plateDwg}
          />
        </div>

        <span className={styles.anatomyLegendEyebrow}>{copy.arch.legendEyebrow}</span>
        <div className={styles.anatomyLegend}>
          {legend.map((item) => (
            <div className={styles.anatomyItem} key={item.n}>
              <span className={styles.anatomyNum}>{item.n}</span>
              <span className={styles.anatomyItemLabel}>{item.label}</span>
              <span className={styles.anatomyItemValue}>{item.value}</span>
              <span className={styles.anatomyItemHint}>{item.hint}</span>
            </div>
          ))}
        </div>

        <span className={styles.anatomyLegendEyebrow}>{copy.arch.photonEyebrow}</span>
        <div className={styles.photonPath}>
          {cascade.map((stage, i) => (
            <div key={stage.k} className={styles.photonStageWrap}>
              {i > 0 ? <span className={styles.photonChevron} aria-hidden /> : null}
              <div
                className={`${styles.photonStage} ${
                  stage.tone === "gold"
                    ? styles.photonGold
                    : stage.tone === "ivory"
                      ? styles.photonIvory
                      : styles.photonForest
                }`}
              >
                <span>{stage.title}</span>
                <strong>{stage.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.prMathBlock}>
          <div className={styles.prMathText}>
            <span className={styles.goldEyebrow}>{copy.arch.prDerating}</span>
            <p>{copy.arch.prBlurb}</p>
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
