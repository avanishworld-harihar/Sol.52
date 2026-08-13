"use client";

/**
 * Emerald Signature cover — 30% emerald sidebar + 70% ivory folio.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  EMERALD_SPECIFIC_YIELD,
  emeraldDcKwp,
  emeraldModuleCount,
  formatEmeraldDocNo,
  formatEmeraldIssueDate,
  formatEmeraldKw,
  splitEmeraldWordmark,
  useEmeraldBrand,
} from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldCoverProps = {
  data: ProposalData;
  proposalId?: string;
};

export function EmeraldCover({ data, proposalId }: EmeraldCoverProps) {
  const brand = useEmeraldBrand(data);
  const { primary, secondary } = splitEmeraldWordmark(brand);
  const customer = data.meta.customerName?.trim() || "Customer Name";
  const systemKw = Number(data.meta.systemKw) || 0;
  const modules = emeraldModuleCount(systemKw);
  const dcKwp = emeraldDcKwp(modules);
  const acLabel = formatEmeraldKw(systemKw, 1);
  const yieldUnits =
    data.closing.annualUnits > 0
      ? Math.round(data.closing.annualUnits)
      : systemKw > 0
        ? Math.round(systemKw * EMERALD_SPECIFIC_YIELD)
        : 0;
  const location =
    data.meta.locationLine?.trim() || "your estate";

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <div>
          <div className={styles.markRing}>
            <div className={styles.markDot} />
          </div>
          <span className={styles.brandPrimary}>{primary}</span>
          {secondary ? (
            <span className={styles.brandSecondary}>{secondary}</span>
          ) : null}
        </div>

        <div>
          <div className={styles.sidebarRule} />
          <span className={styles.metaLabel}>DOCUMENT NO.</span>
          <span className={styles.metaValueSpaced}>
            {formatEmeraldDocNo(proposalId, data.meta.generatedAt)}
          </span>
          <span className={styles.metaLabel}>DATE OF ISSUE</span>
          <span className={styles.metaValue}>
            {formatEmeraldIssueDate(data.meta.generatedAt)}
          </span>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.watermark} aria-hidden>
          <svg width="400" height="400" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#064E3B"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="#064E3B"
              strokeWidth="1"
            />
            <path
              d="M50 0 V100 M0 50 H100"
              stroke="#064E3B"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div className={styles.coverBody}>
          <span className={styles.goldEyebrow}>PRIVATE ROOFTOP COMMISSION</span>
          <h1 className={styles.serifTitle}>{customer}</h1>
          <p className={styles.coverLead}>
            A bespoke solar architecture blueprint engineered specifically for{" "}
            {location}. Designed for maximum yield and aesthetic integration.
          </p>
        </div>

        <div className={styles.coverFooter}>
          <div className={styles.valueBlock}>
            <span>SYSTEM ENGINE</span>
            <span>{acLabel} kW</span>
          </div>
          <div className={styles.valueBlock}>
            <span>DC ARRAY</span>
            <span>
              {dcKwp > 0 ? formatEmeraldKw(dcKwp) : "—"} kWp
            </span>
          </div>
          <div className={styles.valueBlock}>
            <span>YIELD (YR 1)</span>
            <span>
              {yieldUnits > 0 ? yieldUnits.toLocaleString("en-IN") : "—"} U
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldCover;
