"use client";

/**
 * Premium Luxe — bottom-of-page expert advice / verdict strip.
 */

import type { ReactNode } from "react";
import styles from "./luxe.module.css";

export type ExpertVerdictProps = {
  /** e.g. "CHIEF ENGINEER'S VERDICT" */
  label: string;
  children: ReactNode;
};

export function ExpertVerdict({ label, children }: ExpertVerdictProps) {
  return (
    <aside className={styles.expertVerdict}>
      <span className={styles.verdictLabel}>{label}</span>
      <p>{children}</p>
    </aside>
  );
}

export default ExpertVerdict;
