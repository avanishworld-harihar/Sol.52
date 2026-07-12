/**
 * Proposal builder draft isolation — one active draft ID per preset family.
 *
 * Residential and commercial keep separate sessionStorage keys so saving a
 * commercial proposal never PATCHes a residential draft (and vice versa).
 */

const RESIDENTIAL_DRAFT_KEY = "ss_residential_proposal_draft_id";
const COMMERCIAL_DRAFT_KEY = "ss_commercial_proposal_draft_id";

export type ProposalDraftFamily = "residential" | "commercial";

function readKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(key)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

function writeKey(key: string, id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) sessionStorage.setItem(key, id);
    else sessionStorage.removeItem(key);
  } catch {
    /* private mode / quota */
  }
}

export function isCommercialPresetFamily(presetId: string | null | undefined): boolean {
  return presetId === "commercial_executive";
}

export function draftFamilyForPreset(presetId: string | null | undefined): ProposalDraftFamily {
  return isCommercialPresetFamily(presetId) ? "commercial" : "residential";
}

export function readResidentialDraftProposalId(): string | null {
  return readKey(RESIDENTIAL_DRAFT_KEY);
}

export function writeResidentialDraftProposalId(id: string | null) {
  writeKey(RESIDENTIAL_DRAFT_KEY, id);
}

export function readCommercialDraftProposalId(): string | null {
  return readKey(COMMERCIAL_DRAFT_KEY);
}

export function writeCommercialDraftProposalId(id: string | null) {
  writeKey(COMMERCIAL_DRAFT_KEY, id);
}

export function readDraftProposalIdForFamily(family: ProposalDraftFamily): string | null {
  return family === "commercial"
    ? readCommercialDraftProposalId()
    : readResidentialDraftProposalId();
}

export function writeDraftProposalIdForFamily(family: ProposalDraftFamily, id: string | null) {
  if (family === "commercial") writeCommercialDraftProposalId(id);
  else writeResidentialDraftProposalId(id);
}

/** Clear both draft pointers — use for “New proposal” / force-new. */
export function clearAllProposalDraftIds() {
  writeResidentialDraftProposalId(null);
  writeCommercialDraftProposalId(null);
}

/**
 * Bind a proposal id to the correct family key and clear the other family
 * so cross-type PATCH cannot happen from a stale pointer.
 */
export function bindProposalDraftId(presetId: string | null | undefined, id: string | null) {
  const family = draftFamilyForPreset(presetId);
  if (family === "commercial") {
    writeCommercialDraftProposalId(id);
    writeResidentialDraftProposalId(null);
  } else {
    writeResidentialDraftProposalId(id);
    writeCommercialDraftProposalId(null);
  }
}
