/**
 * Browser helpers: sync Brand & Proposals between localStorage cache and Supabase.
 */

import {
  brandingIdentityScore,
  finalizeBrandingSettings,
  readProposalBrandingSettings,
  writeProposalBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

export type OrgBrandingSyncResult = {
  ok: boolean;
  settings: ProposalBrandingSettings;
  source: "cloud" | "local" | "default";
  cloudSynced: boolean;
  error?: string;
  seededCloud?: boolean;
};

type CloudPayload = {
  ok?: boolean;
  settings?: Partial<ProposalBrandingSettings> | null;
  updatedAt?: string | null;
  error?: string;
};

let syncInFlight: Promise<OrgBrandingSyncResult> | null = null;

export async function fetchOrgBrandingFromApi(): Promise<{
  ok: boolean;
  settings: ProposalBrandingSettings | null;
  updatedAt: string | null;
  error?: string;
}> {
  try {
    const res = await fetch("/api/org-branding", { method: "GET", cache: "no-store" });
    const payload = (await res.json()) as CloudPayload;
    if (!res.ok || !payload.ok) {
      return {
        ok: false,
        settings: null,
        updatedAt: null,
        error: payload.error || `Cloud branding load failed (${res.status}).`,
      };
    }
    if (!payload.settings) {
      return { ok: true, settings: null, updatedAt: payload.updatedAt ?? null };
    }
    return {
      ok: true,
      settings: finalizeBrandingSettings(payload.settings),
      updatedAt: payload.updatedAt ?? null,
    };
  } catch (e) {
    return {
      ok: false,
      settings: null,
      updatedAt: null,
      error: e instanceof Error ? e.message : "Cloud branding load failed.",
    };
  }
}

export async function pushOrgBrandingToApi(
  settings: ProposalBrandingSettings
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/org-branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const payload = (await res.json()) as CloudPayload;
    if (!res.ok || !payload.ok) {
      return { ok: false, error: payload.error || `Cloud branding save failed (${res.status}).` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Cloud branding save failed.",
    };
  }
}

/**
 * Pull org branding from Supabase into localStorage (cloud wins when populated).
 * If cloud is empty and local has data, seed cloud once.
 */
export async function syncOrgBrandingFromCloud(): Promise<OrgBrandingSyncResult> {
  if (typeof window === "undefined") {
    return {
      ok: false,
      settings: finalizeBrandingSettings({}),
      source: "default",
      cloudSynced: false,
      error: "sync only runs in the browser",
    };
  }

  if (syncInFlight) return syncInFlight;

  const promise: Promise<OrgBrandingSyncResult> = (async () => {
    const local = readProposalBrandingSettings();
    const localScore = brandingIdentityScore(local);
    const remote = await fetchOrgBrandingFromApi();

    if (!remote.ok) {
      const source: OrgBrandingSyncResult["source"] = localScore > 0 ? "local" : "default";
      return {
        ok: false,
        settings: local,
        source,
        cloudSynced: false,
        error: remote.error,
      };
    }

    if (remote.settings && brandingIdentityScore(remote.settings) > 0) {
      writeProposalBrandingSettings(remote.settings);
      return {
        ok: true,
        settings: readProposalBrandingSettings(),
        source: "cloud",
        cloudSynced: true,
      };
    }

    if (localScore > 0) {
      const seeded = await pushOrgBrandingToApi(local);
      return {
        ok: seeded.ok,
        settings: local,
        source: "local",
        cloudSynced: seeded.ok,
        seededCloud: true,
        error: seeded.ok ? undefined : seeded.error,
      };
    }

    return {
      ok: true,
      settings: local,
      source: "default",
      cloudSynced: true,
    };
  })();

  syncInFlight = promise;
  void promise.finally(() => {
    if (syncInFlight === promise) syncInFlight = null;
  });
  return promise;
}

/** Save to localStorage then push the merged result to Supabase. */
export async function persistOrgBranding(
  snapshot: Partial<ProposalBrandingSettings>
): Promise<{
  ok: boolean;
  settings?: ProposalBrandingSettings;
  error?: string;
  cloudError?: string;
}> {
  const localWrite = writeProposalBrandingSettings(snapshot);
  if (!localWrite.ok) {
    return { ok: false, error: localWrite.error };
  }
  const settings = readProposalBrandingSettings();
  const cloud = await pushOrgBrandingToApi(settings);
  if (!cloud.ok) {
    return {
      ok: true,
      settings,
      cloudError: cloud.error || "Saved on this device, but cloud sync failed.",
    };
  }
  return { ok: true, settings };
}
