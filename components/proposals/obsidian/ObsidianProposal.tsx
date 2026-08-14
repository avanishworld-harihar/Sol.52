"use client";

/**
 * Obsidian — master compiler. HUD document pages.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { ObsidianEngineering } from "./ObsidianEngineering";
import styles from "./Obsidian.module.css";

export type ObsidianProposalProps = {
  data: ProposalData;
};

export function ObsidianProposal({ data }: ObsidianProposalProps) {
  return (
    <div className={styles.proposalStage}>
      <ObsidianEngineering data={data} />
    </div>
  );
}

export default ObsidianProposal;
