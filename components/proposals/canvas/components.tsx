"use client";

/**
 * Canvas — reusable modular building blocks.
 * EvidenceCard is the primary density unit across all pages.
 */

import { useState, type CSSProperties, type ReactNode } from "react";
import type { ProposalBomItem, ProposalWealthPoint } from "@/lib/proposal-data";
import { buildWealthJourney } from "@/lib/proposal-data/build-wealth-journey";
import { resolveHardwareImageSrc } from "./hardware-assets";
import styles from "./canvas.module.css";

export { resolveHardwareImageSrc } from "./hardware-assets";

/* ── CoverPage — Page 01 Architectural Editorial ─────────────── */

export type CoverPageProps = {
  brandName: string;
  logoUrl?: string;
  customerName: string;
  locationLine?: string;
  documentTitle?: string;
  preparedForLabel?: string;
  systemKw: string;
  annualYield: string;
  impactLabel?: string;
  impactValue?: string;
  proposalDate?: string;
  pageNo?: string;
  footerBrand?: string;
};

export function CoverPage({
  brandName,
  logoUrl,
  customerName,
  locationLine,
  documentTitle = "Architectural Energy Blueprint",
  preparedForLabel = "Prepared exclusively for",
  systemKw,
  annualYield,
  impactLabel = "Clean Energy Impact",
  impactValue = "CO₂ avoided",
  proposalDate,
  pageNo = "01 / 12",
  footerBrand,
}: CoverPageProps) {
  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  const logoMark = (parts[0] || "HARIHAR").toUpperCase();
  const logoSub = (parts.slice(1).join(" ") || "SOLAR").toUpperCase();

  return (
    <section
      className={`${styles.page} ${styles.pageCover} ${styles.coverPage} ${styles.canvasTheme}`.trim()}
    >
      <div className={styles.coverHeader}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandName} className={styles.coverLogoImg} />
        ) : (
          <>
            <div className={styles.logoMark}>{logoMark}</div>
            <div className={styles.logoSub}>{logoSub}</div>
          </>
        )}
      </div>

        <div className={styles.coverCenter}>
        <span className={styles.preparedFor}>{preparedForLabel}</span>
        <h1 className={styles.clientName}>{customerName}</h1>
        <div className={styles.coverDivider} aria-hidden />
        <h2 className={styles.documentTitle}>{documentTitle}</h2>
        {locationLine ? <p className={styles.location}>{locationLine}</p> : null}
        {proposalDate ? (
          <p className={styles.coverDate}>{proposalDate}</p>
        ) : null}
      </div>

      <div className={styles.coverFooter}>
        <div className={styles.specBox}>
          <span className={styles.specLabel}>System Capacity</span>
          <span className={styles.specValue}>{systemKw}</span>
        </div>
        <div className={styles.specBox}>
          <span className={styles.specLabel}>Annual Yield</span>
          <span className={styles.specValue}>{annualYield}</span>
        </div>
        <div className={styles.specBox}>
          <span className={styles.specLabel}>{impactLabel}</span>
          <span className={styles.specValue}>{impactValue}</span>
        </div>
      </div>

      <footer className={styles.coverPageFooter}>
        <span>{footerBrand || brandName}</span>
        <span>{pageNo}</span>
      </footer>
    </section>
  );
}

/* ── ClosingPage — Page 12 Cinematic Closing ─────────────────── */

export type ClosingPageProps = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  lifetimeValue: string;
  lifetimeLabel: string;
  monthlyValue: string;
  monthlyLabel: string;
  systemValue: string;
  systemLabel: string;
  ctaTitle: string;
  ctaBody: string;
  companyName: string;
  phone?: string;
  email?: string;
  contactLine?: string;
  signatureLabel: string;
  pageNo?: string;
};

export function ClosingPage({
  eyebrow,
  titleLine1,
  titleLine2,
  subtitle,
  lifetimeValue,
  lifetimeLabel,
  monthlyValue,
  monthlyLabel,
  systemValue,
  systemLabel,
  ctaTitle,
  ctaBody,
  companyName,
  phone,
  email,
  contactLine,
  signatureLabel,
  pageNo = "12 / 12",
}: ClosingPageProps) {
  return (
    <section
      className={`${styles.page} ${styles.pageClosing} ${styles.closingPage} ${styles.canvasTheme}`.trim()}
    >
      <div className={styles.closingCard}>
        <div className={styles.closingHeader}>
          <span className={styles.closingEyebrow}>{eyebrow}</span>
          <h1 className={styles.closingTitle}>
            {titleLine1}
            <br />
            {titleLine2}
          </h1>
          <p className={styles.closingSubtitle}>{subtitle}</p>
        </div>

        <div className={styles.finalStatsGrid}>
          <div className={styles.finalStatItem}>
            <span className={styles.finalStatValue}>{lifetimeValue}</span>
            <span className={styles.finalStatLabel}>{lifetimeLabel}</span>
          </div>
          <div className={styles.finalStatDivider} aria-hidden />
          <div className={styles.finalStatItem}>
            <span className={styles.finalStatValue}>{monthlyValue}</span>
            <span className={styles.finalStatLabel}>{monthlyLabel}</span>
          </div>
          <div className={styles.finalStatDivider} aria-hidden />
          <div className={styles.finalStatItem}>
            <span className={styles.finalStatValue}>{systemValue}</span>
            <span className={styles.finalStatLabel}>{systemLabel}</span>
          </div>
        </div>

        <div className={styles.closingFooter}>
          <div className={styles.ctaBox}>
            <h3>{ctaTitle}</h3>
            <p>{ctaBody}</p>
          </div>

          <div className={styles.signatureBlock}>
            <div className={styles.contactDetails}>
              <strong>{companyName}</strong>
              {phone ? <span>{phone}</span> : null}
              {email ? <span>{email}</span> : null}
              {!phone && !email && contactLine ? (
                <span>{contactLine}</span>
              ) : null}
            </div>
            <div className={styles.authSignature}>
              <div className={styles.signLine} aria-hidden />
              <span>{signatureLabel}</span>
            </div>
          </div>
        </div>

        {pageNo ? (
          <span className={styles.closingPageNum}>{pageNo}</span>
        ) : null}
      </div>
    </section>
  );
}

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
  insight: _insight,
  evidence: _evidence,
  accent = false,
  tone = "default",
  accentValue,
}: EvidenceCardProps) {
  const heading = (title ?? label ?? "").trim();
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

/* ── InvestmentPlan — Page 03 cost equation + EMI ─────────────── */

export type InvestmentEmiOption = {
  tenureLabel: string;
  monthlyEmi: string;
  interestNote?: string;
};

export type InvestmentAssumption = {
  label: string;
  value: string;
};

export type InvestmentPlanProps = {
  costSectionLabel: string;
  grossLabel: string;
  grossValue: string;
  subsidyLabel: string;
  subsidyValue: string;
  youPayLabel: string;
  youPayValue: string;
  equationHint?: string;
  returnsSectionLabel: string;
  paybackLabel: string;
  paybackValue: string;
  lifetimeLabel: string;
  lifetimeValue: string;
  monthlyLabel: string;
  monthlyValue: string;
  financeSectionLabel: string;
  financeSectionLead?: string;
  emiUnitLabel?: string;
  emiOptions: InvestmentEmiOption[];
  assumptionsSectionLabel?: string;
  assumptions?: InvestmentAssumption[];
  insightTitle: string;
  insightBody: string;
};

export function InvestmentPlan({
  costSectionLabel,
  grossLabel,
  grossValue,
  subsidyLabel,
  subsidyValue,
  youPayLabel,
  youPayValue,
  equationHint,
  returnsSectionLabel,
  paybackLabel,
  paybackValue,
  lifetimeLabel,
  lifetimeValue,
  monthlyLabel,
  monthlyValue,
  financeSectionLabel,
  financeSectionLead,
  emiUnitLabel = "/ month",
  emiOptions,
  assumptionsSectionLabel,
  assumptions,
  insightTitle,
  insightBody,
}: InvestmentPlanProps) {
  return (
    <div className={styles.investPlan}>
      <section className={styles.investCostBlock} aria-label={costSectionLabel}>
        <div className={styles.investSectionHead}>
          <span className={styles.investSectionLabel}>{costSectionLabel}</span>
        </div>
        <div className={styles.investEquation}>
          <div className={styles.investEqTerm}>
            <span className={styles.investEqLabel}>{grossLabel}</span>
            <strong className={styles.investEqValue}>{grossValue}</strong>
          </div>
          <span className={styles.investEqOp} aria-hidden>
            −
          </span>
          <div className={`${styles.investEqTerm} ${styles.investEqSubsidy}`}>
            <span className={styles.investEqLabel}>{subsidyLabel}</span>
            <strong className={styles.investEqValue}>{subsidyValue}</strong>
          </div>
          <span className={styles.investEqOp} aria-hidden>
            =
          </span>
          <div className={`${styles.investEqTerm} ${styles.investEqResult}`}>
            <span className={styles.investEqLabel}>{youPayLabel}</span>
            <strong className={styles.investEqValue}>{youPayValue}</strong>
          </div>
        </div>
        {equationHint ? (
          <p className={styles.investEqHint}>{equationHint}</p>
        ) : null}
      </section>

      <section className={styles.investReturns} aria-label={returnsSectionLabel}>
        <div className={styles.investSectionHead}>
          <span className={styles.investSectionLabel}>{returnsSectionLabel}</span>
        </div>
        <div className={styles.investReturnsRow}>
          <div className={styles.investReturnItem}>
            <span className={styles.investReturnLabel}>{paybackLabel}</span>
            <strong className={styles.investReturnValue}>{paybackValue}</strong>
          </div>
          <div className={styles.investReturnItem}>
            <span className={styles.investReturnLabel}>{lifetimeLabel}</span>
            <strong className={styles.investReturnValue}>{lifetimeValue}</strong>
          </div>
          <div className={styles.investReturnItem}>
            <span className={styles.investReturnLabel}>{monthlyLabel}</span>
            <strong className={styles.investReturnValue}>{monthlyValue}</strong>
          </div>
        </div>
      </section>

      {emiOptions.length > 0 ? (
        <section className={styles.investFinance} aria-label={financeSectionLabel}>
          <div className={styles.investFinanceHead}>
            <h3 className={styles.investFinanceTitle}>{financeSectionLabel}</h3>
            {financeSectionLead ? (
              <p className={styles.investFinanceLead}>{financeSectionLead}</p>
            ) : null}
          </div>
          <div className={styles.investEmiGrid}>
            {emiOptions.map((opt) => (
              <article key={opt.tenureLabel} className={styles.investEmiCard}>
                <span className={styles.investEmiTenure}>{opt.tenureLabel}</span>
                <strong className={styles.investEmiValue}>{opt.monthlyEmi}</strong>
                <span className={styles.investEmiUnit}>{emiUnitLabel}</span>
                {opt.interestNote ? (
                  <span className={styles.investEmiNote}>{opt.interestNote}</span>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {assumptions && assumptions.length > 0 ? (
        <section
          className={styles.investAssumptions}
          aria-label={assumptionsSectionLabel || "Assumptions"}
        >
          {assumptionsSectionLabel ? (
            <div className={styles.investSectionHead}>
              <span className={styles.investSectionLabel}>
                {assumptionsSectionLabel}
              </span>
            </div>
          ) : null}
          <div className={styles.investAssumeGrid}>
            {assumptions.map((a) => (
              <div key={a.label} className={styles.investAssumeItem}>
                <span className={styles.investAssumeLabel}>{a.label}</span>
                <strong className={styles.investAssumeValue}>{a.value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ExpertInsights fill title={insightTitle} body={insightBody} />
    </div>
  );
}

/* ── FinancialStory — Page 05 bill drop → returns ─────────────── */

export type FinancialStoryProps = {
  billSectionLabel: string;
  todayLabel: string;
  todayValue: string;
  afterLabel: string;
  afterValue: string;
  profitLabel: string;
  profitValue: string;
  billHint?: string;
  timeSectionLabel: string;
  annualLabel: string;
  annualValue: string;
  paybackLabel: string;
  paybackValue: string;
  outcomeSectionLabel: string;
  youPayLabel: string;
  youPayValue: string;
  lifetimeLabel: string;
  lifetimeValue: string;
  outcomeHint?: string;
  insightTitle: string;
  insightBody: string;
};

export function FinancialStory({
  billSectionLabel,
  todayLabel,
  todayValue,
  afterLabel,
  afterValue,
  profitLabel,
  profitValue,
  billHint,
  timeSectionLabel,
  annualLabel,
  annualValue,
  paybackLabel,
  paybackValue,
  outcomeSectionLabel,
  youPayLabel,
  youPayValue,
  lifetimeLabel,
  lifetimeValue,
  outcomeHint,
  insightTitle,
  insightBody,
}: FinancialStoryProps) {
  return (
    <div className={styles.finStory}>
      <section className={styles.finBillBlock} aria-label={billSectionLabel}>
        <div className={styles.investSectionHead}>
          <span className={styles.investSectionLabel}>{billSectionLabel}</span>
        </div>
        <div className={styles.finBillEquation}>
          <div className={styles.finBillTerm}>
            <span className={styles.investEqLabel}>{todayLabel}</span>
            <strong className={styles.investEqValue}>{todayValue}</strong>
          </div>
          <span className={styles.investEqOp} aria-hidden>
            →
          </span>
          <div className={`${styles.finBillTerm} ${styles.finBillAfter}`}>
            <span className={styles.investEqLabel}>{afterLabel}</span>
            <strong className={styles.investEqValue}>{afterValue}</strong>
          </div>
          <span className={styles.investEqOp} aria-hidden>
            =
          </span>
          <div className={`${styles.finBillTerm} ${styles.finBillProfit}`}>
            <span className={styles.investEqLabel}>{profitLabel}</span>
            <strong className={styles.investEqValue}>{profitValue}</strong>
          </div>
        </div>
        {billHint ? <p className={styles.investEqHint}>{billHint}</p> : null}
      </section>

      <section className={styles.finTimeBlock} aria-label={timeSectionLabel}>
        <div className={styles.investSectionHead}>
          <span className={styles.investSectionLabel}>{timeSectionLabel}</span>
        </div>
        <div className={styles.finTimeRow}>
          <div className={styles.finTimeItem}>
            <span className={styles.investReturnLabel}>{annualLabel}</span>
            <strong className={`${styles.investReturnValue} ${styles.accentValue}`}>
              {annualValue}
            </strong>
          </div>
          <div className={styles.finTimeItem}>
            <span className={styles.investReturnLabel}>{paybackLabel}</span>
            <strong className={styles.investReturnValue}>{paybackValue}</strong>
          </div>
        </div>
      </section>

      <section className={styles.finOutcome} aria-label={outcomeSectionLabel}>
        <div className={styles.finOutcomeHead}>
          <h3 className={styles.finOutcomeTitle}>{outcomeSectionLabel}</h3>
          {outcomeHint ? (
            <p className={styles.finOutcomeLead}>{outcomeHint}</p>
          ) : null}
        </div>
        <div className={styles.finOutcomeRow}>
          <div className={styles.finOutcomePay}>
            <span className={styles.finOutcomeLabel}>{youPayLabel}</span>
            <strong className={styles.finOutcomeValue}>{youPayValue}</strong>
          </div>
          <span className={styles.finOutcomeArrow} aria-hidden>
            →
          </span>
          <div className={styles.finOutcomeWealth}>
            <span className={styles.finOutcomeLabel}>{lifetimeLabel}</span>
            <strong className={styles.finOutcomeValue}>{lifetimeValue}</strong>
          </div>
        </div>
      </section>

      <ExpertInsights fill title={insightTitle} body={insightBody} />
    </div>
  );
}

/* ── EcologicalImpact — Page 08 cinematic eco editorial ──────── */

export type EcologicalImpactProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  co2Value: string;
  co2Unit: string;
  co2Heading: string;
  co2Body: string;
  treesValue: string;
  treesUnit: string;
  treesHeading: string;
  treesBody: string;
  unitsLabel: string;
  unitsValue: string;
  savingsLabel: string;
  savingsValue: string;
  insightTitle: string;
  insightBody: string;
};

export function EcologicalImpact({
  eyebrow,
  title,
  subtitle,
  co2Value,
  co2Unit,
  co2Heading,
  co2Body,
  treesValue,
  treesUnit,
  treesHeading,
  treesBody,
  unitsLabel,
  unitsValue,
  savingsLabel,
  savingsValue,
  insightTitle,
  insightBody,
}: EcologicalImpactProps) {
  return (
    <div className={`${styles.ecoImpact} ${styles.canvasTheme}`.trim()}>
      <div className={styles.impactHeader}>
        <span className={styles.impactEyebrow}>{eyebrow}</span>
        <h2 className={styles.impactTitle}>{title}</h2>
        <p className={styles.impactSubtitle}>{subtitle}</p>
      </div>

      <div className={styles.impactShowcase}>
        <div className={styles.heroImpactCard}>
          <div className={styles.heroImpactData}>
            <span className={styles.heroValue}>{co2Value}</span>
            <span className={styles.heroUnit}>{co2Unit}</span>
          </div>
          <div className={styles.heroImpactContext}>
            <h3>{co2Heading}</h3>
            <p>{co2Body}</p>
          </div>
        </div>

        <div className={`${styles.heroImpactCard} ${styles.treeCard}`}>
          <div className={styles.heroImpactData}>
            <span className={styles.heroValue}>{treesValue}</span>
            <span className={styles.heroUnit}>{treesUnit}</span>
          </div>
          <div className={styles.heroImpactContext}>
            <h3>{treesHeading}</h3>
            <p>{treesBody}</p>
          </div>
        </div>
      </div>

      <div className={styles.impactMetricsBar}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>{unitsLabel}</span>
          <span className={styles.metricData}>{unitsValue}</span>
        </div>
        <div className={styles.metricDivider} aria-hidden />
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>{savingsLabel}</span>
          <span className={styles.metricData}>{savingsValue}</span>
        </div>
      </div>

      <PremiumInsight fill body={insightBody} label={insightTitle} />
    </div>
  );
}

/* ── GenerationForecast — Page 07 monthly units + savings ────── */

/** Central India seasonal share of annual generation (sums ≈ 1). */
const MP_GEN_SHARE = [
  0.072, 0.078, 0.092, 0.098, 0.105, 0.095, 0.068, 0.065, 0.082, 0.095, 0.088, 0.062,
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type GenerationForecastMonth = {
  label: string;
  units: number;
  savingsInr: number;
  barPct: number;
  isPeak?: boolean;
};

export function buildGenerationForecastMonths(
  annualUnits: number,
  annualSavingsInr: number
): GenerationForecastMonth[] {
  const shareSum = MP_GEN_SHARE.reduce((s, v) => s + v, 0);
  const maxShare = Math.max(...MP_GEN_SHARE);
  const effectiveSavingPerUnit =
    annualUnits > 0 && annualSavingsInr > 0 ? annualSavingsInr / annualUnits : 0;
  return MONTH_SHORT.map((label, i) => {
    const share = MP_GEN_SHARE[i]! / shareSum;
    const units = annualUnits > 0 ? Math.round(annualUnits * share) : 0;
    const savingsInr =
      effectiveSavingPerUnit > 0 ? Math.round(units * effectiveSavingPerUnit) : 0;
    return {
      label,
      units,
      savingsInr,
      barPct: Math.max(12, Math.round((MP_GEN_SHARE[i]! / maxShare) * 100)),
      isPeak: i >= 3 && i <= 5,
    };
  });
}

export function GenerationForecast({
  months,
  unitsLabel,
  savingsLabel,
  savingsBasis,
}: {
  months: GenerationForecastMonth[];
  unitsLabel: string;
  savingsLabel: string;
  savingsBasis?: string;
}) {
  if (months.length === 0) return null;
  return (
    <div className={styles.genForecast}>
      <div className={styles.genForecastBars} role="img" aria-label="Monthly generation">
        {months.map((m) => (
          <div
            key={m.label}
            className={`${styles.genMonthCol}${m.isPeak ? ` ${styles.genMonthPeak}` : ""}`}
          >
            <span className={styles.genMonthUnits}>
              {m.units > 0 ? m.units.toLocaleString("en-IN") : "—"}
            </span>
            <div className={styles.genBarTrack}>
              <div
                className={styles.genBarFill}
                style={{ height: `${m.barPct}%` }}
              />
            </div>
            <span className={styles.genMonthLabel}>{m.label}</span>
            <span className={styles.genMonthSave}>
              {m.savingsInr > 0
                ? `₹${Math.round(m.savingsInr / 1000)}k`
                : "—"}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.genForecastLegend}>
        <span>{unitsLabel}</span>
        <span>{savingsLabel}</span>
      </div>
      {savingsBasis ? <p className={styles.genSavingsBasis}>{savingsBasis}</p> : null}
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

/* ── PremiumInsight — one expert block per page (not per card) ── */

export function PremiumInsight({
  body,
  fill,
  label = "Expert Insight",
}: {
  body: string;
  fill?: boolean;
  label?: string;
}) {
  return (
    <aside
      className={`${styles.premiumInsight}${fill ? ` ${styles.premiumInsightFill}` : ""}`.trim()}
    >
      <strong className={styles.premiumInsightLabel}>{label}</strong>
      <p>{body}</p>
    </aside>
  );
}

/** @deprecated Prefer PremiumInsight — same chrome, keeps title support. */
export function ExpertInsights({
  title,
  body,
  fill,
}: {
  title: string;
  body: string;
  fill?: boolean;
}) {
  return (
    <aside className={`${styles.premiumInsight}${fill ? ` ${styles.premiumInsightFill}` : ""}`.trim()}>
      <strong className={styles.premiumInsightLabel}>Expert Insight</strong>
      {title ? <h3 className={styles.expertTitle}>{title}</h3> : null}
      <p>{body}</p>
    </aside>
  );
}

/* ── EngineeringBlueprint — Page 09 Advanced Roof Intelligence ─ */

export type EngineeringBlueprintProps = {
  systemKw: number;
  tiltDeg?: number;
  locationHint?: string;
  insightBody: string;
  title?: string;
  isHi?: boolean;
};

const PANEL_WATT = 580;
const M2_PER_PANEL = 2.2;
/** Keep isometric grid readable on A4; specs still show true count. */
const MAX_VISUAL_PANELS = 24;

export function EngineeringBlueprint({
  systemKw,
  tiltDeg = 20,
  locationHint,
  insightBody,
  title,
  isHi = false,
}: EngineeringBlueprintProps) {
  const size = Number.isFinite(systemKw) && systemKw > 0 ? systemKw : 5;
  const panelCount = Math.max(1, Math.ceil((size * 1000) / PANEL_WATT));
  const visualPanels = Math.min(panelCount, MAX_VISUAL_PANELS);
  const roofArea = panelCount * M2_PER_PANEL;
  const dcKw = (panelCount * PANEL_WATT) / 1000;
  const dcAcRatio = size > 0 ? (dcKw / size).toFixed(2) : "1.04";
  const heading =
    title ||
    (isHi
      ? "इंजीनियरिंग ब्लूप्रिंट (System Architecture)"
      : "Engineering Blueprint (System Architecture)");
  const locLine =
    locationHint?.trim() ||
    (isHi ? "~24.5° N (मध्य प्रदेश)" : "~24.5° N (Madhya Pradesh)");

  return (
    <div className={styles.canvasTheme}>
      <h2 className={styles.sectionHeader}>{heading}</h2>

      <div className={styles.engineeringLayout}>
        <div className={styles.roofVisualizer}>
          <div className={styles.compass} aria-hidden>
            <span className={styles.north}>N</span>
            <span className={styles.east}>E</span>
            <span className={styles.south}>S</span>
            <span className={styles.west}>W</span>
            <span className={styles.compassNeedle} />
          </div>
          <div className={styles.roofGrid}>
            <div
              className={styles.panelLayout}
              style={
                {
                  "--panel-cols": String(Math.min(6, Math.max(3, Math.ceil(Math.sqrt(visualPanels))))),
                } as CSSProperties
              }
            >
              {Array.from({ length: visualPanels }).map((_, i) => (
                <div key={i} className={styles.panelBox} />
              ))}
            </div>
          </div>
          <div className={styles.mapCaption}>
            <strong>
              {isHi ? "इष्टतम दक्षिण-मुखी ऐरे" : "Optimal South-Facing Array"}
            </strong>
            <span>
              {isHi
                ? `टिल्ट: ${tiltDeg}° | अज़ीमुथ: 180° (True South)`
                : `Tilt: ${tiltDeg}° | Azimuth: 180° (True South)`}
              {panelCount > MAX_VISUAL_PANELS
                ? isHi
                  ? ` · दृश्य ${visualPanels}/${panelCount}`
                  : ` · showing ${visualPanels}/${panelCount}`
                : ""}
            </span>
          </div>
        </div>

        <div className={styles.siteIntelligence}>
          <h3>{isHi ? "साइट और छत मेट्रिक्स" : "Site & Roof Metrics"}</h3>
          <div className={styles.techDataList}>
            <div className={styles.techItem}>
              <span>{isHi ? "अक्षांश (लोकेशन)" : "Latitude (Location)"}</span>
              <strong>{locLine}</strong>
              <small>
                {isHi
                  ? "सूर्य प्रकाश कैप्चर कोण को अनुकूल बनाता है।"
                  : "Optimizes the angle of sunlight capture."}
              </small>
            </div>
            <div className={styles.techItem}>
              <span>{isHi ? "आवश्यक छत क्षेत्र" : "Required Roof Area"}</span>
              <strong>~{Math.round(roofArea)} m²</strong>
              <small>
                {isHi
                  ? `${panelCount} × ~${M2_PER_PANEL} m²/मॉड्यूल (पैनल + रखरखाव गलियारा अनुमान)। साइट सर्वे पर अंतिम।`
                  : `${panelCount} × ~${M2_PER_PANEL} m²/module (panel + walkway estimate). Final after site survey.`}
              </small>
            </div>
            <div className={styles.techItem}>
              <span>{isHi ? "शैडो टॉलरेंस" : "Shadow Tolerance"}</span>
              <strong>{isHi ? "डुअल MPPT ट्रैकिंग" : "Dual MPPT Tracking"}</strong>
              <small>
                {isHi
                  ? "बादलों में भी इन्वर्टर गतिशील रूप से समायोजित होता है।"
                  : "Inverter adjusts dynamically to passing clouds."}
              </small>
            </div>
          </div>
        </div>
      </div>

      <h3 className={styles.subHeader}>
        {isHi ? "तकनीकी विशिष्टताएँ" : "Technical Specifications"}
      </h3>
      <div className={styles.advancedSpecsGrid}>
        <div className={styles.engSpecCard}>
          <div className={styles.engSpecValue}>{size} kW AC</div>
          <div className={styles.engSpecLabel}>
            {isHi ? "इन्वर्टर क्षमता" : "Inverter Capacity"}
          </div>
          <div className={styles.engSpecDesc}>
            {isHi
              ? "घर के ग्रिड तक पहुँचने वाली अधिकतम शक्ति।"
              : "Max power delivered to your home grid."}
          </div>
        </div>
        <div className={styles.engSpecCard}>
          <div className={styles.engSpecValue}>
            {dcKw.toFixed(2)} kWp
          </div>
          <div className={styles.engSpecLabel}>
            {isHi ? "DC ऐरे (पैनल)" : "DC Array (Panels)"}
          </div>
          <div className={styles.engSpecDesc}>
            {isHi
              ? `${panelCount} × ${PANEL_WATT} Wp TOPCon N-Type मॉड्यूल।`
              : `${panelCount} × ${PANEL_WATT} Wp TOPCon N-Type modules.`}
          </div>
        </div>
        <div className={styles.engSpecCard}>
          <div className={styles.engSpecValue}>~75%</div>
          <div className={styles.engSpecLabel}>
            {isHi ? "परफॉर्मेंस रेशियो (PR)" : "Performance Ratio (PR)"}
          </div>
          <div className={styles.engSpecDesc}>
            {isHi
              ? "तापमान और ग्रिड हानि के बाद सिस्टम दक्षता।"
              : "System efficiency after temp & grid losses."}
          </div>
        </div>
        <div className={styles.engSpecCard}>
          <div className={styles.engSpecValue}>{dcAcRatio}</div>
          <div className={styles.engSpecLabel}>
            {isHi ? "DC/AC अनुपात" : "DC/AC Ratio"}
          </div>
          <div className={styles.engSpecDesc}>
            {isHi
              ? "सुबह/शाम की उपज के लिए सुरक्षित ओवर-पैनेलिंग।"
              : "Safely over-paneled for better morning/evening yield."}
          </div>
        </div>
      </div>

      <PremiumInsight fill body={insightBody} />
    </div>
  );
}

/* ── PaymentRoadmap — Page 11 ────────────────────────────────── */

export type PaymentMilestone = {
  step: string;
  title: string;
  amountLabel: string;
  percent: string;
};

export type PaymentRoadmapProps = {
  title: string;
  milestones: PaymentMilestone[];
  bank: {
    company: string;
    accountNumber: string;
    ifsc: string;
    upiId: string;
  };
  bankTitle?: string;
  termsTitle: string;
  terms: string[];
  insightBody?: string;
};

export function PaymentRoadmap({
  title,
  milestones,
  bank,
  bankTitle = "Secure Payment Details",
  termsTitle,
  terms,
  insightBody,
}: PaymentRoadmapProps) {
  return (
    <>
      <h2 className={styles.sectionHeader}>{title}</h2>

      <div className={styles.timelineContainer}>
        {milestones.map((m) => (
          <div key={m.step} className={styles.timelineStep}>
            <div className={styles.stepNumber}>{m.step.padStart(2, "0")}</div>
            <div className={styles.stepContent}>
              <h4>{m.title}</h4>
              <span className={styles.percentBadge}>{m.percent} Share</span>
            </div>
            <div className={styles.stepAmount}>{m.amountLabel}</div>
          </div>
        ))}
      </div>

      <div className={styles.bankCard}>
        <h3>{bankTitle}</h3>
        <div className={styles.bankGrid}>
          <div className={styles.bankItem}>
            <span>A/C Name:</span>
            <strong>{bank.company}</strong>
          </div>
          <div className={styles.bankItem}>
            <span>A/C No:</span>
            <strong>{bank.accountNumber}</strong>
          </div>
          <div className={styles.bankItem}>
            <span>IFSC:</span>
            <strong>{bank.ifsc}</strong>
          </div>
          <div className={styles.bankItem}>
            <span>UPI:</span>
            <strong>{bank.upiId}</strong>
          </div>
        </div>
      </div>

      <div className={styles.termsBox}>
        <h3>{termsTitle}</h3>
        <ul className={styles.termsList}>
          {terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {insightBody ? <PremiumInsight fill body={insightBody} /> : null}
    </>
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
