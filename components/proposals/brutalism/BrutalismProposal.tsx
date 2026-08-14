"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { BrutalismCover } from "./BrutalismCover";
import { BrutalismLedgerPage } from "./BrutalismLedgerPage";
import { BrutalismClosingPage } from "./BrutalismClosingPage";
import styles from "./Brutalism.module.css";

export function BrutalismProposal({ data }: { data: ProposalData }) {
  return (
    <div className={styles.stage}>
      <BrutalismCover data={data} />
      <BrutalismLedgerPage data={data} />
      <BrutalismClosingPage data={data} />
    </div>
  );
}

export default BrutalismProposal;
