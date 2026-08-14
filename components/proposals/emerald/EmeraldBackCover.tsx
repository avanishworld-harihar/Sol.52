"use client";

/**
 * Emerald Signature — back cover (forest folio + photograph + contact).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  splitEmeraldWordmark,
  useEmeraldSurfaceBrand,
} from "./emerald-brand";
import { useEmeraldContact } from "./emerald-contact";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export const EMERALD_BACK_PHOTO = "/assets/proposals/emerald-back-golden-hour.jpg";

export type EmeraldBackCoverProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

export function EmeraldBackCover({
  data,
  installerLogoUrl,
}: EmeraldBackCoverProps) {
  const { copy } = useEmeraldLang();
  const closingBrand = useEmeraldSurfaceBrand(data, "closing", installerLogoUrl);
  const brand = closingBrand.installerName?.trim() || "";
  const logoUrl = closingBrand.showLogo ? closingBrand.logoUrl : "";
  const showWordmark = Boolean(brand) && (closingBrand.showName || !logoUrl);
  const { primary, secondary } = splitEmeraldWordmark(brand);
  const customer = data.meta.customerName?.trim() || copy.common.youFallback;
  const contact = useEmeraldContact(data);

  return (
    <section className={`${styles.a4Page} ${styles.backCoverPage}`}>
      <header className={styles.backCoverHeader}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- print A4 installer logo
          <img src={logoUrl} alt={brand || copy.common.installerFallback} className={styles.backCoverLogo} />
        ) : (
          <div className={styles.backCoverMark}>
            <div className={styles.backCoverMarkDot} />
          </div>
        )}
        {showWordmark && primary ? (
          <div>
            <span className={styles.backCoverBrand}>{primary}</span>
            {secondary ? (
              <span className={styles.backCoverBrandSub}>{secondary}</span>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className={styles.backCoverPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
        <img
          className={styles.backCoverPhotoImg}
          src={EMERALD_BACK_PHOTO}
          alt={copy.back.photoAlt}
          width={1536}
          height={1024}
        />
      </div>

      <div className={styles.backCoverCenter}>
        <span className={styles.backCoverEyebrow}>{copy.back.thankYou}</span>
        <h2 className={styles.backCoverTitle}>
          {copy.back.preparedFor}
          <br />
          {customer}.
        </h2>
        {contact.tagline ? (
          <p className={styles.backCoverLead}>{contact.tagline}</p>
        ) : (
          <p className={styles.backCoverLead}>{copy.back.lead}</p>
        )}
      </div>

      <div className={styles.backCoverContact}>
        <div>
          <span className={styles.backCoverMetaLabel}>{copy.back.installer}</span>
          <span className={styles.backCoverMetaValue}>
            {brand || copy.common.installerFallback}
          </span>
        </div>
        {contact.rows.map((row) =>
          row.href ? (
            <a
              key={row.label}
              className={styles.backCoverContactLink}
              href={row.href}
            >
              <span className={styles.backCoverMetaLabel}>{row.label}</span>
              <span className={styles.backCoverMetaValue}>{row.value}</span>
            </a>
          ) : (
            <div key={row.label}>
              <span className={styles.backCoverMetaLabel}>{row.label}</span>
              <span className={styles.backCoverMetaValue}>{row.value}</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default EmeraldBackCover;
