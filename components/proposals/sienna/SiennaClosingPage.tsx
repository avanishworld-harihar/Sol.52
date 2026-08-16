"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Sienna.module.css";
import { useSiennaSurfaceBrand } from "./sienna-brand";
import {
  formatSiennaContactFooter,
  useSiennaContactDetails,
} from "./sienna-closing-contact";
import { useSiennaLang } from "./sienna-lang-context";
import {
  SIENNA_CLOSE_ALT,
  SIENNA_CLOSE_PHOTO,
  formatSiennaKw,
  siennaLocation,
} from "./sienna-live";

export type SiennaClosingPageProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptWebsite?: string;
};

export function SiennaClosingPage({
  data,
  installerLogoUrl,
  pptWebsite,
}: SiennaClosingPageProps) {
  const { copy } = useSiennaLang();
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const closingBrand = useSiennaSurfaceBrand(data, "closing", installerLogoUrl);
  const installer = closingBrand.installerName?.trim() || "—";
  const logo = closingBrand.showLogo ? closingBrand.logoUrl : "";
  const showName = Boolean(installer !== "—" && (closingBrand.showName || !logo));
  const location = siennaLocation(data);
  const vendorContact = useSiennaContactDetails(data, pptWebsite);
  const contactLine = formatSiennaContactFooter([
    vendorContact.phone,
    vendorContact.email,
    vendorContact.website,
  ]);
  const headLine = formatSiennaContactFooter([
    showName ? installer : "",
    location,
    "09 / 09",
  ]);

  const title =
    customer !== "—" ? copy.close.titleNamed(customer) : copy.close.titlePlain;
  const plant = systemKw > 0 ? copy.close.plantKw(formatSiennaKw(systemKw)) : copy.close.plantPlain;
  const lead = copy.close.lead(plant, location || null);

  return (
    <section className={`${styles.a4Sienna} ${styles.bleedSheet}`}>
      <div className={styles.closeSplit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SIENNA_CLOSE_PHOTO} alt={SIENNA_CLOSE_ALT} />
        <div className={styles.closeScrim} />
        <div className={styles.closeCopy}>
          <div className={styles.closeKicker}>{copy.close.kicker}</div>
          <h1 className={styles.closeTitle}>{title}</h1>
          <p className={styles.closeLead}>{lead}</p>

          <div className={styles.closeSlab}>
            {contactLine ? (
              <div className={styles.closeContact}>
                <span>{copy.close.contactTitle}</span>
                {vendorContact.phone}
                {vendorContact.phone && (vendorContact.email || vendorContact.website)
                  ? " · "
                  : ""}
                {vendorContact.email}
                {vendorContact.email && vendorContact.website ? " · " : ""}
                {vendorContact.website}
              </div>
            ) : null}

            <div className={styles.sigRow}>
              <div className={styles.sig}>
                <div className={styles.sigRule} />
                <span className={styles.sigName}>{customer}</span>
                <span className={styles.sigRole}>{copy.close.clientRole}</span>
              </div>
              <div className={styles.sig}>
                <div className={styles.sigRule} />
                <span className={styles.sigName}>{installer}</span>
                <span className={styles.sigRole}>{copy.close.officialRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.closeBar}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={installerLogoAlt(installer)}
            className={styles.closeBarLogo}
          />
        ) : null}
        <span>{headLine || "09 / 09"}</span>
      </div>
    </section>
  );
}

export default SiennaClosingPage;
