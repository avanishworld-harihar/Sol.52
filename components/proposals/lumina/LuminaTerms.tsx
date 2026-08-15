"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { luminaTermCards } from "./lumina-live";

export function LuminaTerms({ data }: { data: ProposalData }) {
  const cards = luminaTermCards(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Legal framework</div>
        <h1 className={styles.clientTitle}>Clear Terms.</h1>
        <p className={styles.subText}>
          Conditions below are the live terms on this proposal — not a generic Harihar script.
        </p>

        {cards.length > 0 ? (
          <div className={styles.termsGrid}>
            {cards.map((card, i) => (
              <div key={`${card.title}-${i}`} className={styles.termCard}>
                <div className={styles.termNum}>{String(i + 1).padStart(2, "0")}</div>
                <div className={styles.termText}>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.termCard}>
            <div className={styles.termNum}>—</div>
            <div className={styles.termText}>
              <h4>Terms not on file</h4>
              <p>Smart cards appear here when conditions or warranty highlights exist on this proposal.</p>
            </div>
          </div>
        )}
      </div>
      <div className={styles.pageFooter}>Lumina · 06 / 07</div>
    </section>
  );
}

export default LuminaTerms;
