"use client";

/**
 * Emerald Signature cover — 30% emerald sidebar + 70% ivory folio.
 * Logo from More → Brand; new rooftop photograph in the ivory column.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  EMERALD_DEFAULT_BRAND,
  EMERALD_SPECIFIC_YIELD,
  emeraldDcKwp,
  emeraldModuleCount,
  formatEmeraldDocNo,
  formatEmeraldIssueDate,
  formatEmeraldKw,
  splitEmeraldWordmark,
  useEmeraldSurfaceBrand,
} from "./emerald-brand";
import styles from "./Emerald.module.css";

export const EMERALD_COVER_PHOTO = "/assets/proposals/emerald-cover-indian-rcc.jpg";

export type EmeraldCoverProps = {
  data: ProposalData;
  proposalId?: string;
  installerLogoUrl?: string;
};

function CoverWordmark({ brandName }: { brandName: string }) {
  const { primary, secondary } = splitEmeraldWordmark(brandName);
  return (
    <>
      <span className={styles.brandPrimary}>{primary}</span>
      {secondary ? (
        <span className={styles.brandSecondary}>{secondary}</span>
      ) : null}
    </>
  );
}

export function EmeraldCover({
  data,
  proposalId,
  installerLogoUrl,
}: EmeraldCoverProps) {
  const coverBrand = useEmeraldSurfaceBrand(data, "cover", installerLogoUrl);
  const brand = coverBrand.installerName || EMERALD_DEFAULT_BRAND;
  const logoUrl = coverBrand.showLogo ? coverBrand.logoUrl : "";
  const showWordmark = coverBrand.showName || !logoUrl;
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
  const location = data.meta.locationLine?.trim() || "your estate";

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- print A4 installer logo
            <img src={logoUrl} alt={brand} className={styles.coverLogo} />
          ) : (
            <div className={styles.markRing}>
              <div className={styles.markDot} />
            </div>
          )}
          {showWordmark ? <CoverWordmark brandName={brand} /> : null}
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

      <div className={`${styles.contentArea} ${styles.coverContent}`}>
        <div className={styles.coverPhoto}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
          <img
            className={styles.coverPhotoImg}
            src={EMERALD_COVER_PHOTO}
            alt="Elevated rooftop solar array on an Indian RCC terrace"
            width={1536}
            height={1024}
          />
        </div>

        <div className={styles.coverBody}>
          <span className={styles.goldEyebrow}>PRIVATE ROOFTOP COMMISSION</span>
          <h1 className={`${styles.serifTitle} ${styles.coverTitle}`}>{customer}</h1>
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
