"use client";

/**
 * Subscribe to More → Brand & Proposals settings (localStorage).
 * Prefers live installer banking/contact over frozen proposal snapshots.
 */

import { useSyncExternalStore } from "react";
import {
  DEFAULT_PROPOSAL_BRANDING_SETTINGS,
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getClientSnapshot(): ProposalBrandingSettings {
  return readProposalBrandingSettings();
}

function getServerSnapshot(): ProposalBrandingSettings {
  return DEFAULT_PROPOSAL_BRANDING_SETTINGS;
}

export function useProposalBrandingSettings(): ProposalBrandingSettings {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
