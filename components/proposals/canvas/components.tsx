"use client";

/**
 * Canvas — reusable modular building blocks.
 * EvidenceCard is the primary density unit across all pages.
 */

import { useState, type ReactNode } from "react";
import type { ProposalBomItem, ProposalWealthPoint } from "@/lib/proposal-data";
import { buildWealthJourney } from "@/lib/proposal-data/build-wealth-journey";
import { resolveHardwareImageSrc } from "./hardware-assets";
import styles from "./canvas.module.css";

export { resolveHardwareImageSrc } from "./hardware-assets";

/* ── Page chrome ─────────────────────────────────────────────── */

export function PageShell({
  children,
  variant = "sheet",
  pageNo,
  brand,
  className = "",
}: {
  children: ReactNode;
  variant?: "sheet" | "cover" | "closing";
  pageNo?: string;
  brand?: string;
  className?: string;
}) {
  const variantClass =
    variant === "cover"
      ? styles.pageCover
      : variant === "closing"
        ? styles.pageClosing
        : "";
  return (
    <section className={`${styles.page} ${variantClass} ${className}`.trim()}>
      {children}
      {pageNo ? (
        <footer className={styles.pageFooter}>
          <span>{brand || "Canvas"}</span>
          <span>{pageNo}</span>
        </footer>
      ) : null}
    </section>
  );
}

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className={styles.pageHeader}>
      <h2 className={styles.sectionHeader}>{title}</h2>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className={styles.pageBody}>{children}</div>;
}

/* ── EvidenceCard — fills density; optional inline Expert Insight ── */

export type EvidenceCardProps = {
  /** Primary heading (preferred). */
  title?: string;
  /** @deprecated Prefer `title` — kept for older call sites. */
  label?: string;
  value: string;
  /** Inline expert insight under the value. */
  insight?: string;
  /** @deprecated Prefer `insight`. */
  evidence?: string;
  /** Highlight card with accent wash. */
  accent?: boolean;
  /** Legacy tone → maps to border accents. */
  tone?: "default" | "warn" | "positive" | "accent";
  /** @deprecated Prefer `accent` — colors the value. */
  accentValue?: boolean;
};

export function EvidenceCard({
  title,
  label,
  value,
  insight,
  evidence,
  accent = false,
  tone = "default",
  accentValue,
}: EvidenceCardProps) {
  const heading = (title ?? label ?? "").trim();
  const tip = (insight ?? evidence)?.trim();
  const useAccent = accent || tone === "accent";

  const className = [
    styles.evidenceCard,
    useAccent ? styles.accentBg : "",
    tone === "warn" ? styles.evidenceWarn : "",
    tone === "positive" ? styles.evidencePositive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className}>
      {heading ? <h3 className={styles.cardTitle}>{heading}</h3> : null}
      <div
        className={`${styles.cardValue}${accentValue || useAccent ? ` ${styles.accentValue}` : ""}`}
      >
        {value}
      </div>
      {tip ? (
        <p className={styles.cardInsight}>
          <em>
            <span className={styles.cardInsightLabel}>Expert Insight:</span> {tip}
          </em>
        </p>
      ) : null}
    </article>
  );
}

export function EvidenceGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div className={cols === 3 ? styles.evidenceGrid3 : styles.evidenceGrid}>
      {children}
    </div>
  );
}

/* ── WealthJourney — flex-box bar chart (Page 04) ─────────────── */

export type WealthJourneyBar = {
  year: number;
  /** Bar height 0–100 (compounding curve). */
  percentage: number;
  /** Display value in lakhs (e.g. 4.5). */
  valueLakh: number;
  isPayback?: boolean;
};

/** Milestone years — visual summary of the 25-year path. */
const JOURNEY_YEARS = [1, 5, 10, 15, 20, 25] as const;

export function buildWealthJourneyBars(
  journey: ProposalWealthPoint[] | undefined,
  lifetimeInr: number,
  paybackYears = 0
): WealthJourneyBar[] {
  const max = Math.max(
    lifetimeInr,
    ...(journey ?? []).map((p) => p.cumulativeInr),
    1
  );
  const pb = paybackYears > 0 ? Math.round(paybackYears) : 0;

  return JOURNEY_YEARS.map((year) => {
    const hit = journey?.find((p) => p.year === year);
    const fromCurve =
      hit?.cumulativeInr ??
      (lifetimeInr > 0
        ? Math.round(lifetimeInr * (1 - Math.pow(1 - year / 25, 1.45)))
        : 0);
    const percentage = Math.max(12, Math.min(100, Math.round((fromCurve / max) * 100)));
    return {
      year,
      percentage,
      valueLakh: Math.round((fromCurve / 100000) * 10) / 10,
      isPayback: Boolean(hit?.isPayback) || (pb > 0 && year === pb),
    };
  });
}

/** CSS flex-box bar chart — no tables. */
export function WealthJourneyBars({
  bars,
  caption,
}: {
  bars: WealthJourneyBar[];
  caption?: string;
}) {
  if (bars.length === 0) {
    return (
      <div className={styles.wealthEmpty}>
        <p>—</p>
      </div>
    );
  }

  return (
    <div className={styles.wealthJourney}>
      <div className={styles.wealthBarsRow} role="img" aria-label={caption || "Wealth journey"}>
        {bars.map((m) => (
          <div
            key={m.year}
            className={`${styles.wealthBar}${m.isPayback ? ` ${styles.wealthBarPayback}` : ""}`}
          >
            <span className={styles.valLabel}>₹{m.valueLakh}L</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ height: `${m.percentage}%` }}
              />
            </div>
            <span className={styles.yearLabel}>YR {m.year}</span>
          </div>
        ))}
      </div>
      {caption ? <p className={styles.wealthCaption}>{caption}</p> : null}
    </div>
  );
}

/* ── HardwareTrust — productCard modules (Page 06) ───────────── */

export type HardwareTrustProduct = {
  imageSrc: string;
  badge: string;
  title: string;
  body: string;
  brand: string;
  alt?: string;
};

const DEFAULT_TRUST_PRODUCTS: HardwareTrustProduct[] = [
  {
    imageSrc: "/assets/waaree-panel.png",
    badge: "30 Year Performance",
    title: "Waaree TOPCon N-Type",
    body: "22%+ efficiency — highest yield in MP heat.",
    brand: "Waaree",
    alt: "Waaree solar panel",
  },
  {
    imageSrc: "/assets/havells-inverter.png",
    badge: "10 Year Warranty",
    title: "Havells String Inverter",
    body: "Dual MPPT trackers for maximum shading resilience.",
    brand: "Havells",
    alt: "Havells inverter",
  },
];

export function resolveHardwareTrustProducts(
  bom: ProposalBomItem[]
): HardwareTrustProduct[] {
  const panel = bom.find((b) => /module|panel|solar/i.test(`${b.name} ${b.brand}`));
  const inverter = bom.find((b) => /inverter|mppt/i.test(`${b.name} ${b.brand}`));

  if (!panel && !inverter) return DEFAULT_TRUST_PRODUCTS;

  const panelBrand = panel?.brand?.trim() || "Waaree";
  const inverterBrand = inverter?.brand?.trim() || "Havells";

  const panelCard: HardwareTrustProduct = {
    imageSrc: /waaree/i.test(panelBrand)
      ? "/assets/waaree-panel.png"
      : panel
        ? resolveHardwareImageSrc(panel)
        : "/assets/waaree-panel.png",
    badge: panel?.warranty?.trim() || "30 Year Performance",
    title: /waaree/i.test(panelBrand)
      ? "Waaree TOPCon N-Type"
      : [panelBrand, panel?.name].filter(Boolean).join(" · "),
    body:
      panel?.technicalPoints?.[0] ||
      panel?.description ||
      DEFAULT_TRUST_PRODUCTS[0]!.body,
    brand: panelBrand.split(/\s+/)[0] || "Panel",
    alt: "Panel",
  };

  const inverterCard: HardwareTrustProduct = {
    imageSrc: /havells/i.test(inverterBrand)
      ? "/assets/havells-inverter.png"
      : inverter
        ? resolveHardwareImageSrc(inverter)
        : "/assets/havells-inverter.png",
    badge: inverter?.warranty?.trim() || "10 Year Warranty",
    title: /havells/i.test(inverterBrand)
      ? "Havells String Inverter"
      : [inverterBrand, inverter?.name].filter(Boolean).join(" · "),
    body:
      inverter?.technicalPoints?.[0] ||
      inverter?.description ||
      DEFAULT_TRUST_PRODUCTS[1]!.body,
    brand: inverterBrand.split(/\s+/)[0] || "Inverter",
    alt: "Inverter",
  };

  return [panelCard, inverterCard];
}

function ProductCard({ product }: { product: HardwareTrustProduct }) {
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  return (
    <article className={styles.productCard}>
      <div className={styles.productImgWrap}>
        {showPlaceholder ? (
          <div className={styles.brandPlaceholder} aria-hidden>
            <span className={styles.brandPlaceholderMark}>{product.brand}</span>
            <span className={styles.brandPlaceholderHint}>Asset</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageSrc}
            alt={product.alt || product.title}
            className={styles.productImg}
            onError={() => setShowPlaceholder(true)}
          />
        )}
      </div>
      <div className={styles.badge}>{product.badge}</div>
      <p className={styles.productBrand}>{product.brand}</p>
      <h4 className={styles.productTitle}>{product.title}</h4>
      <p className={styles.productBody}>{product.body}</p>
    </article>
  );
}

export function HardwareTrustGrid({ products }: { products: HardwareTrustProduct[] }) {
  const list = products.length > 0 ? products : DEFAULT_TRUST_PRODUCTS;
  return (
    <div className={styles.hardwareGrid}>
      {list.slice(0, 2).map((p) => (
        <ProductCard key={p.title} product={p} />
      ))}
    </div>
  );
}

/* ── Expert Insights ─────────────────────────────────────────── */

export function ExpertInsights({
  title,
  body,
  fill,
}: {
  title: string;
  body: string;
  /** Push callout to bottom of page body to fill blank space. */
  fill?: boolean;
}) {
  return (
    <aside className={`${styles.expertBox}${fill ? ` ${styles.expertBoxFill}` : ""}`.trim()}>
      <span className={styles.expertLabel}>Expert Insights</span>
      <h3 className={styles.expertTitle}>{title}</h3>
      <p className={styles.expertBody}>{body}</p>
    </aside>
  );
}

/* ── HardwareCard — image from /assets/hardware/ ─────────────── */

export type HardwareCardProps = {
  item: ProposalBomItem;
  warrantyLabel?: string;
  imageSrc?: string;
};

export function HardwareCard({
  item,
  warrantyLabel = "Warranty",
  imageSrc,
}: HardwareCardProps) {
  const src = imageSrc || resolveHardwareImageSrc(item);
  return (
    <article className={styles.hardwareCard}>
      <div className={styles.hardwareImgWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={styles.hardwareImg}
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src.includes(".png")) {
              el.src = "/assets/hardware/default.svg";
            }
          }}
        />
      </div>
      <div className={styles.hardwareBody}>
        <div className={styles.hardwareTop}>
          <h3 className={styles.hardwareName}>{item.name}</h3>
          {item.warranty ? (
            <span className={styles.hardwareBadge}>
              {warrantyLabel}: {item.warranty}
            </span>
          ) : null}
        </div>
        <p className={styles.hardwareBrand}>
          {[item.brand, item.spec].filter(Boolean).join(" · ")}
        </p>
        {item.description ? (
          <p className={styles.hardwareDesc}>{item.description}</p>
        ) : null}
        {item.technicalPoints && item.technicalPoints.length > 0 ? (
          <ul className={styles.hardwarePoints}>
            {item.technicalPoints.slice(0, 3).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

/* ── WealthGraph — professional 25-year financial chart ──────── */

export type WealthMilestone = {
  year: string;
  value: number;
  amountLabel?: string;
  accent?: boolean;
};

export type WealthGraphProps = {
  /** Preferred: ProposalData.economics.wealthJourney */
  journey?: ProposalWealthPoint[];
  /** Legacy sketch API — height % bars (avoid when journey present). */
  data?: WealthMilestone[];
  lifetimeInr?: number;
  yearOneInr?: number;
  paybackYears?: number;
  yearsLabel?: string;
  cumulativeLabel?: string;
  chartTitle?: string;
  formatValue?: (n: number) => string;
  horizonYears?: number;
};

export function WealthGraph({
  journey,
  data,
  lifetimeInr = 0,
  yearOneInr,
  paybackYears = 0,
  yearsLabel = "Yrs",
  cumulativeLabel,
  chartTitle = "25-year wealth journey",
  formatValue = (n) => String(n),
  horizonYears = 25,
}: WealthGraphProps) {
  const points: ProposalWealthPoint[] =
    journey && journey.length > 0
      ? journey
      : lifetimeInr > 0
        ? buildWealthJourney({
            annualSavingsInr: yearOneInr && yearOneInr > 0 ? yearOneInr : 0,
            lifetimeProfitInr: lifetimeInr,
            paybackYears,
            horizonYears,
          })
        : [];

  /* Fallback only if caller passed raw % milestone bars with no journey. */
  if (points.length === 0 && data && data.length > 0) {
    return (
      <div className={styles.wealthContainer}>
        <div className={styles.wealthChartHead}>
          <p className={styles.wealthChartTitle}>{chartTitle}</p>
        </div>
        <p className={styles.wealthCaption}>{cumulativeLabel}</p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className={styles.wealthEmpty}>
        <p>—</p>
      </div>
    );
  }

  const maxInr = Math.max(...points.map((p) => p.cumulativeInr), 1);
  const end = points[points.length - 1]!;
  const mid = points[Math.min(points.length - 1, Math.floor(points.length / 2))]!;
  const paybackPt = points.find((p) => p.isPayback);

  const w = 640;
  const h = 200;
  const padL = 42;
  const padR = 14;
  const padT = 18;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const xy = (p: ProposalWealthPoint, index: number) => {
    const x =
      padL + (index / Math.max(points.length - 1, 1)) * plotW;
    const y = padT + plotH - (p.cumulativeInr / maxInr) * plotH;
    return { x, y };
  };

  const coords = points.map((p, i) => ({ ...p, ...xy(p, i) }));
  const pathD = coords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1]!.x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${padL} ${(padT + plotH).toFixed(1)} Z`;

  const paybackX = paybackPt
    ? coords.find((c) => c.year === paybackPt.year)?.x
    : undefined;

  const axisYears = [1, 5, 10, 15, 20, horizonYears].filter((y) => y <= points.length);

  return (
    <div
      className={styles.wealthContainer}
      role="img"
      aria-label={cumulativeLabel || chartTitle}
    >
      <div className={styles.wealthChartHead}>
        <p className={styles.wealthChartTitle}>{chartTitle}</p>
        <span className={styles.wealthChartEnd}>{formatValue(end.cumulativeInr)}</span>
      </div>
      <svg className={styles.wealthSvg} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="canvasWealthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#F97316" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            className={styles.wealthGrid}
            x1={padL}
            x2={padL + plotW}
            y1={padT + plotH * (1 - f)}
            y2={padT + plotH * (1 - f)}
          />
        ))}
        <path d={areaD} className={styles.wealthArea} />
        <path d={pathD} className={styles.wealthLine} />
        {paybackX != null ? (
          <>
            <line
              className={styles.wealthPayback}
              x1={paybackX}
              x2={paybackX}
              y1={padT}
              y2={padT + plotH}
            />
            <text
              x={paybackX + 4}
              y={padT + 10}
              className={styles.wealthPaybackTag}
            >
              PAYBACK
            </text>
          </>
        ) : null}
        <circle
          cx={coords[coords.length - 1]!.x}
          cy={coords[coords.length - 1]!.y}
          r={4}
          className={styles.wealthDot}
        />
        {axisYears.map((year) => {
          const idx = Math.min(year - 1, coords.length - 1);
          const c = coords[idx]!;
          return (
            <text
              key={year}
              x={c.x}
              y={h - 8}
              className={styles.wealthAxis}
              textAnchor={year === 1 ? "start" : year === horizonYears ? "end" : "middle"}
            >
              {year === horizonYears ? `${year} ${yearsLabel}` : `Y${year}`}
            </text>
          );
        })}
        <text
          x={mid ? xy(mid, Math.floor(points.length / 2)).x : padL + plotW / 2}
          y={Math.max(padT + 12, xy(mid, Math.floor(points.length / 2)).y - 8)}
          className={styles.wealthLabel}
          textAnchor="middle"
        >
          {formatValue(mid.cumulativeInr)}
        </text>
        <text
          x={coords[coords.length - 1]!.x - 4}
          y={Math.max(padT + 12, coords[coords.length - 1]!.y - 10)}
          className={styles.wealthLabelEnd}
          textAnchor="end"
        >
          {formatValue(end.cumulativeInr)}
        </text>
      </svg>
      {cumulativeLabel ? <p className={styles.wealthCaption}>{cumulativeLabel}</p> : null}
    </div>
  );
}

/* ── Misc ────────────────────────────────────────────────────── */

export function ProfitBadge({ children }: { children: ReactNode }) {
  return <div className={styles.profitBadge}>{children}</div>;
}

export function StepCard({
  num,
  title,
  description,
}: {
  num: string;
  title: string;
  description?: string;
}) {
  return (
    <li className={styles.stepCard}>
      <span className={styles.stepNum}>{num}</span>
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
    </li>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.bulletList}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
