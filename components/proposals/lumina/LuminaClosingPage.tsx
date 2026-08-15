"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { formatLuminaKw, luminaBrand } from "./lumina-live";

export function LuminaClosingPage({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const installer = data.closing.installerName?.trim() || luminaBrand(data);
  const contact = data.closing.contactLine?.trim() || "—";
  const terms = (data.terms.conditions ?? []).filter((t) => t.trim()).slice(0, 3);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea} style={{ paddingTop: 36 }}>
        <div>
          <div className={styles.dateTag}>Next step</div>
          <h2 className={styles.sectionTitle}>Ready when you are.</h2>
          <p className={styles.subText}>
            {customer !== "—" ? `${customer} is` : "You are"} invited to accept this Lumina
            proposal as the commercial specification
            {systemKw > 0 ? ` for a ${formatLuminaKw(systemKw)} kW rooftop plant` : ""}.
          </p>
        </div>

        <div className={`${styles.cardGrid} ${styles.cardGridTwo}`} style={{ marginTop: 24 }}>
          {terms.length > 0 ? (
            <div className={styles.dataCard} style={{ gridColumn: "1 / -1" }}>
              <span className={styles.cardLabel}>Key terms</span>
              <span className={styles.cardValue} style={{ fontSize: "1rem", fontWeight: 600 }}>
                {terms.join(" · ")}
              </span>
            </div>
          ) : null}
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>Client</span>
            <span className={styles.cardValue}>{customer}</span>
          </div>
          <div className={`${styles.dataCard} ${styles.dataCardAccent}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelAccent}`}>Installer</span>
            <span className={`${styles.cardValue} ${styles.cardValueAccent}`}>{installer}</span>
          </div>
          <div className={styles.dataCard} style={{ gridColumn: "1 / -1" }}>
            <span className={styles.cardLabel}>Contact</span>
            <span className={styles.cardValue} style={{ fontSize: "1.15rem" }}>
              {contact}
            </span>
          </div>
        </div>

        <div className={styles.pageFooter}>Lumina · 05 / 05 · End of proposal</div>
      </div>
    </section>
  );
}

export default LuminaClosingPage;
