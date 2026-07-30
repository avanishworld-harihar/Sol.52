"use client";

/**
 * Quantum Hardware — Dual-Pillar Silicon Core (PV + Inverter + BOS).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_PANEL_WATT,
  quantumModuleCount,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumHardwareProps = {
  data: ProposalData;
};

export function QuantumHardware({ data }: QuantumHardwareProps) {
  const systemKw = Number(data.meta.systemKw) || 3;
  const modules = quantumModuleCount(systemKw) || 6;
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);

  const panelBrand =
    data.bom.find((b) => /module|panel|topcon|mono/i.test(`${b.name} ${b.brand}`))
      ?.brand?.trim() || "Adani / Waaree";
  const invBrand =
    data.bom.find((b) => /inverter|mppt/i.test(`${b.name} ${b.brand}`))?.brand
      ?.trim() || "Havells / Polycab";

  return (
    <section className={styles.a4Page}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          03 // BILL OF MATERIALS
        </span>
        <h2>The Silicon Core.</h2>
      </div>

      <div className={styles.dualPillar}>
        <div className={`${styles.glass3D} ${styles.pillarCard}`}>
          <div>
            <div className={styles.pillarIndex}>01</div>
            <span className={styles.label}>N-Type TOPCon Array</span>
            <h3 className={styles.pillarTitle}>Tier-1 PV Modules</h3>
            <div className={styles.chipRow}>
              <span className={styles.chip}>≥21% Efficiency</span>
              <span className={styles.chip}>DCR Compliant</span>
              <span className={styles.chip}>
                {modules} × {QUANTUM_PANEL_WATT} Wp
              </span>
            </div>
            <p className={styles.pillarBody}>
              Deploying {QUANTUM_PANEL_WATT} Wp ultra-high efficiency modules (
              {panelBrand}). Engineered with N-Type TOPCon technology for
              superior low-light performance and ultra-low thermal degradation
              (≤0.55%/yr). Sized for a {acLabel} kW AC plant.
            </p>
          </div>
          <div className={styles.pillarFoot}>
            <span className={styles.pillarFootLabel}>Warranty Guarantee</span>
            <span className={styles.pillarFootValue}>30 Years</span>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.pillarCard}`}>
          <div>
            <div className={styles.pillarIndex}>02</div>
            <span className={styles.label}>Grid-Tie Inverter</span>
            <h3 className={styles.pillarTitle}>Dual-MPPT Processor</h3>
            <div className={styles.chipRow}>
              <span className={styles.chip}>IP65 Rated</span>
              <span className={styles.chip}>97.5% Max Efficiency</span>
              <span className={styles.chip}>{acLabel} kW</span>
            </div>
            <p className={styles.pillarBody}>
              Intelligent string inverter ({invBrand}) acting as the brain of
              your array. Features independent tracking for shade tolerance and
              seamless grid-synchronization architecture.
            </p>
          </div>
          <div className={styles.pillarFoot}>
            <span className={styles.pillarFootLabel}>Replacement Warranty</span>
            <span className={styles.pillarFootValue}>10 Years</span>
          </div>
        </div>
      </div>

      <div className={`${styles.glass3D} ${styles.bosStrip}`}>
        <div>
          <span className={styles.label}>Galvanized Exoskeleton &amp; Armor</span>
          <p className={styles.bosCopy}>
            JSW Hot-Dip Galvanized Iron (GI) structure rated for 150 km/h wind
            loads. Equipped with TUV-approved fire-resistant DC/AC cabling and
            Type-II Surge Protection Devices (SPD).
          </p>
        </div>
        <div className={styles.bosAside}>
          <span className={styles.bosAsideValue}>Tier-1</span>
          <span className={styles.bosAsideLabel}>BOS Components</span>
        </div>
      </div>
    </section>
  );
}

export default QuantumHardware;
