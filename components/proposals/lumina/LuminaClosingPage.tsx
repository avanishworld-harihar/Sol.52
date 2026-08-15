"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Lumina.module.css";
import { useLuminaSurfaceBrand } from "./lumina-brand";
import {
  LUMINA_CLOSE_ALT,
  LUMINA_CLOSE_PHOTO,
  formatLuminaKw,
  luminaLocation,
} from "./lumina-live";

export type LuminaClosingPageProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

export function LuminaClosingPage({
  data,
  installerLogoUrl,
}: LuminaClosingPageProps) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const closingBrand = useLuminaSurfaceBrand(data, "closing", installerLogoUrl);
  const installer = closingBrand.installerName?.trim() || "—";
  const logo = closingBrand.showLogo ? closingBrand.logoUrl : "";
  const showName = Boolean(installer !== "—" && (closingBrand.showName || !logo));
  const location = luminaLocation(data);
  const contact = data.closing.contactLine?.trim();

  const title =
    customer !== "—" ? `${customer}, this roof is ready.` : "This roof is ready.";
  const lead = [
    systemKw > 0 ? `A ${formatLuminaKw(systemKw)} kW rooftop plant` : "This rooftop plant",
    location ? `for ${location}` : null,
    "— accept when you are.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.closeHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LUMINA_CLOSE_PHOTO} alt={LUMINA_CLOSE_ALT} className={styles.closeHeroImg} />
        <div className={styles.closeHeroOverlay} />
        <div className={styles.closeHeroCopy}>
          <div className={styles.closeKicker}>Execution mandate</div>
          <h1 className={styles.closeTitle}>{title}</h1>
          <p className={styles.closeLead}>{lead}</p>

          <div className={styles.closeSigDock}>
            <div className={styles.closeSigCard}>
              <div className={styles.closeSigLine} />
              <span className={styles.sigName}>{customer}</span>
              <span className={styles.sigRole}>Client authorization</span>
            </div>
            <div className={styles.closeSigCard}>
              <div className={styles.closeSigLine} />
              <span className={styles.sigName}>{installer}</span>
              <span className={styles.sigRole}>Official signatory</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.closeBrandBar}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={installerLogoAlt(installer)}
            className={styles.closeBrandLogo}
          />
        ) : null}
        <span>
          {showName ? installer : null}
          {showName && (location || contact) ? " · " : null}
          {location ? location : null}
          {location && contact ? " · " : null}
          {contact ? contact : null}
          {(showName || location || contact) ? " · " : null}
          09 / 09
        </span>
      </div>
    </section>
  );
}

export default LuminaClosingPage;
