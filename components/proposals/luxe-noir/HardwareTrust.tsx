"use client";

/**
 * Premium Luxe — Hardware Trust (Page 06).
 * 4-quadrant Silicon & Steel Ledger.
 */

import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export function HardwareTrust() {
  return (
    <section
      className={`${styles.a4Page} ${styles.luxeHardware} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.pageHeader}>
        <span className={styles.goldEyebrow}>BILL OF MATERIALS</span>
        <h2 className={styles.pageTitle}>The Silicon & Steel Ledger.</h2>
      </div>

      <div className={styles.hardwareGrid}>
        {/* Top Left: Solar Modules */}
        <div className={styles.hardwareNode}>
          <div className={styles.nodeHeader}>
            <span className={styles.nodeNumber}>01</span>
            <h3 className={styles.nodeTitle}>N-Type TOPCon Array</h3>
          </div>
          <div className={styles.nodeSpecs}>
            <span className={styles.highlightSpec}>30-YEAR LINEAR WARRANTY</span>
            <p>
              Adani / Waaree 580Wp modules. DCR compliant with ≥21% photon conversion
              efficiency and ultra-low thermal degradation (≤0.55%/yr).
            </p>
          </div>
        </div>

        {/* Top Right: Inverter */}
        <div className={styles.hardwareNode}>
          <div className={styles.nodeHeader}>
            <span className={styles.nodeNumber}>02</span>
            <h3 className={styles.nodeTitle}>Dual-MPPT Inverter</h3>
          </div>
          <div className={styles.nodeSpecs}>
            <span className={styles.highlightSpec}>10-YEAR REPLACEMENT YIELD</span>
            <p>
              Havells / Polycab intelligent string inverter. Features independent tracking
              for shade tolerance, IP65 weatherproofing, and ≥97.5% grid-export efficiency.
            </p>
          </div>
        </div>

        {/* Bottom Left: Structure */}
        <div className={styles.hardwareNode}>
          <div className={styles.nodeHeader}>
            <span className={styles.nodeNumber}>03</span>
            <h3 className={styles.nodeTitle}>Galvanized Exoskeleton</h3>
          </div>
          <div className={styles.nodeSpecs}>
            <span className={styles.highlightSpec}>150 KM/H WIND RATING</span>
            <p>
              JSW Hot-Dip Galvanized Iron (GI) mounting structure. Engineered to anchor the
              array safely through decades of extreme monsoons and high-velocity winds.
            </p>
          </div>
        </div>

        {/* Bottom Right: Protection & Cabling */}
        <div className={styles.hardwareNode}>
          <div className={styles.nodeHeader}>
            <span className={styles.nodeNumber}>04</span>
            <h3 className={styles.nodeTitle}>Armor & Transmission</h3>
          </div>
          <div className={styles.nodeSpecs}>
            <span className={styles.highlightSpec}>LIFETIME CABLING</span>
            <p>
              TUV-approved fire-resistant DC/AC cabling, coupled with Type-II Surge
              Protection Devices (SPD) and dedicated copper earthing to guard against
              lightning strikes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HardwareTrust;
