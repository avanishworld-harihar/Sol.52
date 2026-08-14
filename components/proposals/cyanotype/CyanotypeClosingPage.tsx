"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { CyanotypeBlueprintFrame } from "./CyanotypeBlueprintFrame";
import styles from "./Cyanotype.module.css";
import { cyanotypeBrand, formatCyanotypeKw } from "./cyanotype-live";

export function CyanotypeClosingPage({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const installer = data.closing.installerName?.trim() || cyanotypeBrand(data);
  const contact = data.closing.contactLine?.trim() || "—";
  const terms = (data.terms.conditions ?? []).filter((t) => t.trim()).slice(0, 4);

  return (
    <CyanotypeBlueprintFrame>
      <div className={styles.dimensionLine}>
        <span className={styles.dimArrow}>|←</span>
        <span className={styles.dimText}>ACCEPTANCE &amp; ISSUANCE</span>
        <span className={styles.dimArrow}>→|</span>
      </div>

      <h2 className={styles.sectionTitle}>Closing Sheet</h2>

      <p className={styles.bodyCopy}>
        <strong>{customer}</strong> is invited to accept this cyanotype issue as the commercial
        specification for the proposed rooftop plant
        {systemKw > 0 ? ` (${formatCyanotypeKw(systemKw)} kW AC)` : ""}.
      </p>

      {terms.length > 0 ? (
        <p className={styles.bodyCopy}>Key terms: {terms.join(" · ")}</p>
      ) : null}

      <p className={styles.bodyCopy}>
        Issued by <strong>{installer}</strong>
        {contact !== "—" ? ` · ${contact}` : ""}.
      </p>

      <div className={`${styles.dataGrid} ${styles.dataGridSingle}`} style={{ marginTop: "6mm" }}>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>CLIENT / DATE</span>
          <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>{customer}</span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>ISSUER / DATE</span>
          <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>{installer}</span>
        </div>
      </div>

      <footer className={styles.pageFooter}>END OF CYANOTYPE ISSUE · SHEET 03 / 03</footer>
    </CyanotypeBlueprintFrame>
  );
}

export default CyanotypeClosingPage;
