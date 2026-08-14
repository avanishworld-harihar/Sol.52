"use client";

/**
 * Obsidian — master compiler. HUD document pages.
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { ObsidianEngineering } from "./ObsidianEngineering";
import styles from "./Obsidian.module.css";

export type ObsidianProposalProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
};

export function ObsidianProposal({ data, pptInput }: ObsidianProposalProps) {
  return (
    <div className={styles.proposalStage}>
      <ObsidianEngineering data={data} pptInput={pptInput} />
    </div>
  );
}

export default ObsidianProposal;
