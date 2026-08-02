"use client";

/**
 * Subscribe to More → Brand & Proposals settings (localStorage).
 * Reads synchronously on the client so bank/contact appear on first paint
 * (same behavior as Golden / Atelier).
 */

import { useEffect, useState } from "react";
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
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return settings;
}
