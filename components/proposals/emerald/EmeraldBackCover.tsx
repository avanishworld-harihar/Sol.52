"use client";

/**
 * Emerald Signature — back cover (full forest folio).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  splitEmeraldWordmark,
  useEmeraldBrand,
} from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldBackCoverProps = {
  data: ProposalData;
};

export function EmeraldBackCover({ data }: EmeraldBackCoverProps) {
  const brand = useEmeraldBrand(data);
  const { primary, secondary } = splitEmeraldWordmark(brand);
  const customer = data.meta.customerName?.trim() || "the estate";
  const contact = data.closing.contactLine?.trim() || "";
  const address = data.closing.address?.trim() || data.meta.locationLine?.trim() || "";

  return (
    <section className={`${styles.a4Page} ${styles.backCoverPage}`}>
      <div>
        <div className={styles.backCoverMark}>
          <div className={styles.backCoverMarkDot} />
        </div>
        <span className={styles.backCoverBrand}>{primary}</span>
        {secondary ? (
          <span className={styles.backCoverBrandSub}>{secondary}</span>
        ) : null}
      </div>

      <div className={styles.backCoverCenter}>
        <span className={styles.backCoverEyebrow}>END OF COMMISSION</span>
        <h2 className={styles.backCoverTitle}>
          Prepared for
          <br />
          {customer}.
        </h2>
        <p className={styles.backCoverLead}>
          A private rooftop solar architecture — engineered for yield, endurance,
          and the quiet accumulation of wealth.
        </p>
      </div>

      <div className={styles.backCoverMeta}>
        <div>
          <span className={styles.backCoverMetaLabel}>Installer</span>
          <span className={styles.backCoverMetaValue}>{brand}</span>
        </div>
        <div>
          <span className={styles.backCoverMetaLabel}>Correspondence</span>
          <span className={styles.backCoverMetaValue}>
            {contact || address || "—"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default EmeraldBackCover;
