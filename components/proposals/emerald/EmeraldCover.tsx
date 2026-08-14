"use client";

/**
 * Emerald Signature cover — 30% emerald sidebar + 70% ivory folio.
 * Logo from More → Brand; rooftop photograph in the ivory column.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatEmeraldDocNo,
  formatEmeraldIssueDate,
  formatEmeraldKw,
  splitEmeraldWordmark,
  useEmeraldSurfaceBrand,
} from "./emerald-brand";
import { emeraldAnnualUnits, resolveEmeraldPanelSpec } from "./emerald-live";
import styles from "./Emerald.module.css";
import { useEmeraldLang } from "./emerald-lang-context";

export const EMERALD_COVER_PHOTO = "/assets/proposals/emerald-cover-indian-rcc.jpg";

export type EmeraldCoverProps = {
  data: ProposalData;
  proposalId?: string;
  installerLogoUrl?: string;
};

function CoverWordmark({ brandName }: { brandName: string }) {
  const { primary, secondary } = splitEmeraldWordmark(brandName);
  if (!primary) return null;
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
  const { copy, lang } = useEmeraldLang();
  const coverBrand = useEmeraldSurfaceBrand(data, "cover", installerLogoUrl);
  const brand = coverBrand.installerName?.trim() || "";
  const logoUrl = coverBrand.showLogo ? coverBrand.logoUrl : "";
  const showWordmark = Boolean(brand) && (coverBrand.showName || !logoUrl);
  const customer = data.meta.customerName?.trim() || copy.common.customerFallback;
  const systemKw = Number(data.meta.systemKw) || 0;
  const { dcKwp } = resolveEmeraldPanelSpec(data);
  const acLabel = formatEmeraldKw(systemKw, 1);
  const yieldUnits = emeraldAnnualUnits(data);
  const location = data.meta.locationLine?.trim() || copy.common.homeFallback;

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- print A4 installer logo
            <img src={logoUrl} alt={brand || copy.common.installerFallback} className={styles.coverLogo} />
          ) : (
            <div className={styles.markRing}>
              <div className={styles.markDot} />
            </div>
          )}
          {showWordmark ? <CoverWordmark brandName={brand} /> : null}
        </div>

        <div>
          <div className={styles.sidebarRule} />
          <span className={styles.metaLabel}>{copy.cover.docNo}</span>
          <span className={styles.metaValueSpaced}>
            {formatEmeraldDocNo(proposalId, data.meta.generatedAt)}
          </span>
          <span className={styles.metaLabel}>{copy.cover.issueDate}</span>
          <span className={styles.metaValue}>
            {formatEmeraldIssueDate(data.meta.generatedAt, lang)}
          </span>
        </div>
      </div>

      <div className={`${styles.contentArea} ${styles.coverContent}`}>
        <div className={styles.coverPhoto}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
          <img
            className={styles.coverPhotoImg}
            src={EMERALD_COVER_PHOTO}
            alt={copy.cover.photoAlt}
            width={1536}
            height={1024}
          />
        </div>

        <div className={styles.coverBody}>
          <span className={styles.goldEyebrow}>{copy.cover.eyebrow}</span>
          <h1 className={`${styles.serifTitle} ${styles.coverTitle}`}>{customer}</h1>
          <p className={styles.coverLead}>{copy.cover.lead(location)}</p>
        </div>

        <div className={styles.coverFooter}>
          <div className={styles.valueBlock}>
            <span>{copy.cover.systemSize}</span>
            <span>{acLabel} kW</span>
          </div>
          <div className={styles.valueBlock}>
            <span>{copy.cover.solarArray}</span>
            <span>
              {dcKwp > 0 ? formatEmeraldKw(dcKwp) : "—"} kWp
            </span>
          </div>
          <div className={styles.valueBlock}>
            <span>{copy.cover.year1Units}</span>
            <span>
              {yieldUnits > 0
                ? `${yieldUnits.toLocaleString("en-IN")} ${copy.common.unitsShort}`
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldCover;
