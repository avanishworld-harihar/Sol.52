"use client";

/**
 * Quantum renderer — Cinematic Neo-Glass residential proposal.
 * Preset id: residential_quantum
 * Pages: Cover → Telemetry → Economics → Hardware → Impact → Authorization
 */

import type { ProposalData } from "@/lib/proposal-data";
import { QuantumCover } from "./QuantumCover";
import { QuantumTelemetry } from "./QuantumTelemetry";
import { QuantumEconomics } from "./QuantumEconomics";
import { QuantumHardware } from "./QuantumHardware";
import { QuantumImpact } from "./QuantumImpact";
import { QuantumAuthorization } from "./QuantumAuthorization";
import styles from "./Quantum.module.css";

export type QuantumRendererProps = {
  data: ProposalData;
};

export function QuantumRenderer({ data }: QuantumRendererProps) {
  if (!data) {
    return <div className={styles.loading}>INITIALIZING QUANTUM…</div>;
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className={styles.root}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Sol.52 · Quantum</span>
          <button type="button" className={styles.printBarBtn} onClick={handlePrint}>
            Download PDF
          </button>
        </div>
      </div>

      <QuantumCover data={data} />
      <QuantumTelemetry data={data} />
      <QuantumEconomics data={data} />
      <QuantumHardware data={data} />
      <QuantumImpact data={data} />
      <QuantumAuthorization data={data} />
    </div>
  );
}

export default QuantumRenderer;
