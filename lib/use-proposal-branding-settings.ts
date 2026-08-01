"use client";

/**
 * Subscribe to More → Brand & Proposals settings (localStorage).
 * Snapshot is cached by raw storage string so useSyncExternalStore stays stable.
 */

import { useSyncExternalStore } from "react";
import {
  DEFAULT_PROPOSAL_BRANDING_SETTINGS,
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

const STORAGE_KEY = "ss_proposal_branding_settings_v2";

let cache: { raw: string | null; settings: ProposalBrandingSettings } | null =
  null;

function readCachedSettings(): ProposalBrandingSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PROPOSAL_BRANDING_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (cache && cache.raw === raw) return cache.settings;
    const settings = readProposalBrandingSettings();
    cache = { raw, settings };
    return settings;
  } catch {
    return DEFAULT_PROPOSAL_BRANDING_SETTINGS;
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cache = null;
    onStoreChange();
  };
  window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getServerSnapshot(): ProposalBrandingSettings {
  return DEFAULT_PROPOSAL_BRANDING_SETTINGS;
}

export function useProposalBrandingSettings(): ProposalBrandingSettings {
  return useSyncExternalStore(subscribe, readCachedSettings, getServerSnapshot);
}
