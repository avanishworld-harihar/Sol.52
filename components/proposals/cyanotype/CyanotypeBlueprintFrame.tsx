"use client";

import type { ReactNode } from "react";
import styles from "./Cyanotype.module.css";

export function CyanotypeBlueprintFrame({ children }: { children: ReactNode }) {
  return (
    <section className={styles.a4Blueprint}>
      <div className={styles.draftGrid} />
      <div className={`${styles.crosshair} ${styles.chTL}`} />
      <div className={`${styles.crosshair} ${styles.chTR}`} />
      <div className={`${styles.crosshair} ${styles.chBL}`} />
      <div className={`${styles.crosshair} ${styles.chBR}`} />
      <div className={styles.contentWrapper}>{children}</div>
    </section>
  );
}
