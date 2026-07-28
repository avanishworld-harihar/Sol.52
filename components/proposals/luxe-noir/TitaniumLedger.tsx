"use client";

/**
 * Premium Luxe — Titanium Ledger (Page 06).
 * Minimalist luxury list with massive numbers — no grid boxes.
 */

import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export function TitaniumLedger() {
  return (
    <section
      className={`${styles.a4Page} ${styles.ledgerPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>02 // BILL OF MATERIALS</span>
        <h2 className={styles.luxeHeadline}>The Silicon & Steel Ledger.</h2>
      </header>

      <div className={styles.ledgerList}>
        <div className={styles.ledgerItem}>
          <div className={styles.hugeNumber}>01</div>
          <div className={styles.itemContent}>
            <h3>N-Type TOPCon Array</h3>
            <span className={styles.specBadge}>30-YEAR WARRANTY</span>
            <p>
              Adani/Waaree 580Wp modules. DCR compliant with ≥21% photon conversion
              efficiency.
            </p>
          </div>
        </div>

        <div className={styles.ledgerItem}>
          <div className={styles.hugeNumber}>02</div>
          <div className={styles.itemContent}>
            <h3>Dual-MPPT Inverter</h3>
            <span className={styles.specBadge}>10-YEAR REPLACEMENT</span>
            <p>
              Havells/Polycab intelligent string inverter. Independent tracking for shade
              tolerance.
            </p>
          </div>
        </div>

        <div className={styles.ledgerItem}>
          <div className={styles.hugeNumber}>03</div>
          <div className={styles.itemContent}>
            <h3>Galvanized Exoskeleton</h3>
            <span className={styles.specBadge}>150 KM/H WIND RATING</span>
            <p>
              JSW Hot-Dip Galvanized Iron (GI) structure. Anchored for decades of extreme
              weather.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TitaniumLedger;
