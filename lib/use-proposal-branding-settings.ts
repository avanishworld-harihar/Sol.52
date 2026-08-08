"use client";

/**
 * Subscribe to More → Brand & Proposals settings.
 * Fast path: localStorage cache. Then sync once from Supabase org branding.
 */

import { useEffect, useState } from "react";
import { syncOrgBrandingFromCloud } from "@/lib/org-branding-client";
import {
  DEFAULT_PROPOSAL_BRANDING_SETTINGS,
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

function readClientSettings(): ProposalBrandingSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PROPOSAL_BRANDING_SETTINGS;
  }
  try {
    return readProposalBrandingSettings();
  } catch {
    return DEFAULT_PROPOSAL_BRANDING_SETTINGS;
  }
}

export function useProposalBrandingSettings(): ProposalBrandingSettings {
  const [settings, setSettings] = useState<ProposalBrandingSettings>(readClientSettings);

  useEffect(() => {
    const refresh = () => setSettings(readClientSettings());
    refresh();
    void syncOrgBrandingFromCloud().then(() => refresh());
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return settings;
}
