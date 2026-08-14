"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./WallStreet.module.css";
import {
  wallStreetEditionLine,
  wallStreetIssueDate,
  wallStreetMastheadTitle,
} from "./wall-street-live";

export function WallStreetMasthead({ data }: { data: ProposalData }) {
  return (
    <header className={styles.masthead}>
      <h1 className={styles.mastheadTitle}>{wallStreetMastheadTitle(data)}</h1>
      <div className={styles.mastheadSub}>
        <span>{wallStreetEditionLine(data)}</span>
        <span>{wallStreetIssueDate(data.meta.generatedAt)}</span>
        <span>ASSET CLASS: UTILITY INFRASTRUCTURE</span>
      </div>
    </header>
  );
}
