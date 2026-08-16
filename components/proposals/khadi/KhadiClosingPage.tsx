"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Khadi.module.css";
import { splitKhadiWordmark, useKhadiSurfaceBrand } from "./khadi-brand";
import { useKhadiContactDetails } from "./khadi-closing-contact";
import { useKhadiLang } from "./khadi-lang-context";
import {
  KHADI_CLOSE_ALT,
  KHADI_CLOSE_PHOTO,
  formatKhadiKw,
  khadiLocation,
} from "./khadi-live";

export type KhadiClosingPageProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptWebsite?: string;
};

export function KhadiClosingPage({
  data,
  installerLogoUrl,
  pptWebsite,
}: KhadiClosingPageProps) {
  const { copy } = useKhadiLang();
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const closingBrand = useKhadiSurfaceBrand(data, "closing", installerLogoUrl);
  const installer = closingBrand.installerName?.trim() || "—";
  const logo = closingBrand.showLogo ? closingBrand.logoUrl : "";
  const showWordmark = Boolean(installer !== "—" && (closingBrand.showName || !logo));
  const { head, tail } = splitKhadiWordmark(installer !== "—" ? installer : "");
  const location = khadiLocation(data);
  const vendorContact = useKhadiContactDetails(data, pptWebsite);
  const hasContact = Boolean(
    vendorContact.phone || vendorContact.email || vendorContact.website
  );

  const title =
    customer !== "—" ? copy.close.titleNamed(customer) : copy.close.titlePlain;
  const plant = systemKw > 0 ? copy.close.plantKw(formatKhadiKw(systemKw)) : copy.close.plantPlain;
  const lead = copy.close.lead(plant, location || null);

  return (
    <section className={`${styles.a4Khadi} ${styles.bleedSheet} ${styles.closeBleed}`}>
      <div className={styles.closePhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={KHADI_CLOSE_PHOTO} alt={KHADI_CLOSE_ALT} />
        <div className={styles.closePhotoScrim} />
      </div>

      <div className={styles.closeDock}>
        <div className={styles.closeDockCopy}>
          {logo || showWordmark ? (
            <div className={styles.closeBrand}>
              {logo ? (
                <div className={styles.closeLogoPlate}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt={installerLogoAlt(installer)} />
                </div>
              ) : null}
              {showWordmark ? (
                <div className={styles.closeWordmark}>
                  {head}
                  {tail ? <span className={styles.closeWordmarkTail}>{tail}</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <p className={styles.closeKicker}>{copy.close.kicker}</p>
          <h1 className={styles.closeTitle}>{title}</h1>
          <p className={styles.closeLead}>{lead}</p>
        </div>

        <div className={styles.closePanel}>
          {hasContact ? (
            <div className={styles.closeContact} aria-label={copy.close.contactTitle}>
              <span>{copy.close.contactTitle}</span>
              {vendorContact.phone ? (
                <p className={styles.closeContactRow}>
                  <em>{copy.close.contactPhone}</em>
                  <strong>{vendorContact.phone}</strong>
                </p>
              ) : null}
              {vendorContact.email ? (
                <p className={styles.closeContactRow}>
                  <em>{copy.close.contactEmail}</em>
                  <strong>{vendorContact.email}</strong>
                </p>
              ) : null}
              {vendorContact.website ? (
                <p className={styles.closeContactRow}>
                  <em>{copy.close.contactWeb}</em>
                  <strong>{vendorContact.website}</strong>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className={styles.sigStack}>
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
    </section>
  );
}

export default KhadiClosingPage;
