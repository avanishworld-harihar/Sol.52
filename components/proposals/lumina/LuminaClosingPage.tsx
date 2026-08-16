"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Lumina.module.css";
import { useLuminaSurfaceBrand } from "./lumina-brand";
import {
  formatLuminaContactFooter,
  useLuminaContactDetails,
} from "./lumina-closing-contact";
import { useLuminaLang } from "./lumina-lang-context";
import {
  LUMINA_CLOSE_ALT,
  LUMINA_CLOSE_PHOTO,
  formatLuminaKw,
  luminaLocation,
} from "./lumina-live";

export type LuminaClosingPageProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptWebsite?: string;
};

export function LuminaClosingPage({
  data,
  installerLogoUrl,
  pptWebsite,
}: LuminaClosingPageProps) {
  const { copy } = useLuminaLang();
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const closingBrand = useLuminaSurfaceBrand(data, "closing", installerLogoUrl);
  const installer = closingBrand.installerName?.trim() || "—";
  const logo = closingBrand.showLogo ? closingBrand.logoUrl : "";
  const showName = Boolean(installer !== "—" && (closingBrand.showName || !logo));
  const location = luminaLocation(data);
  const vendorContact = useLuminaContactDetails(data, pptWebsite);
  const contactLine = formatLuminaContactFooter([
    vendorContact.phone,
    vendorContact.email,
    vendorContact.website,
  ]);
  const headLine = formatLuminaContactFooter([
    showName ? installer : "",
    location,
    "09 / 09",
  ]);

  const title =
    customer !== "—" ? copy.close.titleNamed(customer) : copy.close.titlePlain;
  const plant = systemKw > 0 ? copy.close.plantKw(formatLuminaKw(systemKw)) : copy.close.plantPlain;
  const lead = copy.close.lead(plant, location || null);

  return (
    <section className={`${styles.a4Lumina} ${styles.bleedSheet}`}>
      <div className={styles.closeHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LUMINA_CLOSE_PHOTO} alt={LUMINA_CLOSE_ALT} className={styles.closeHeroImg} />
        <div className={styles.closeHeroOverlay} />
        <div className={styles.closeHeroCopy}>
          <div className={styles.closeKicker}>{copy.close.kicker}</div>
          <h1 className={styles.closeTitle}>{title}</h1>
          <p className={styles.closeLead}>{lead}</p>

          <div className={styles.closeFooterStack}>
            {contactLine ? (
              <aside className={styles.closeContactCard} aria-label={copy.close.contactTitle}>
                <span className={styles.closeContactKicker}>{copy.close.contactTitle}</span>
                <p className={styles.closeContactLine}>{contactLine}</p>
              </aside>
            ) : null}

            <div className={styles.closeSigDock}>
              <div className={styles.closeSigCard}>
                <div className={styles.closeSigLine} />
                <div className={styles.closeSigMeta}>
                  <span className={styles.sigName}>{customer}</span>
                  <span className={styles.sigRole}>{copy.close.clientRole}</span>
                </div>
              </div>
              <div className={styles.closeSigCard}>
                <div className={styles.closeSigLine} />
                <div className={styles.closeSigMeta}>
                  <span className={styles.sigName}>{installer}</span>
                  <span className={styles.sigRole}>{copy.close.officialRole}</span>
                </div>
              </div>
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
        <div className={styles.closeBrandMeta}>
          {headLine ? <span className={styles.closeBrandHead}>{headLine}</span> : null}
        </div>
      </div>
    </section>
  );
}

export default LuminaClosingPage;
