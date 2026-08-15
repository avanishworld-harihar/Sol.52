"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import {
  LUMINA_CLOSE_ALT,
  LUMINA_CLOSE_PHOTO,
  formatLuminaKw,
  luminaBrand,
  luminaLocation,
} from "./lumina-live";

export function LuminaClosingPage({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const installer = data.closing.installerName?.trim() || luminaBrand(data);
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
        {installer}
        {location ? ` · ${location}` : ""}
        {contact ? ` · ${contact}` : ""}
        {" · 07 / 07"}
      </div>
    </section>
  );
}

export default LuminaClosingPage;
