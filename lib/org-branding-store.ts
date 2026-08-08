/**
 * Server-side org branding persistence (Supabase).
 * Client cache remains localStorage; API syncs through this module.
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { resolveDefaultOrgId } from "@/lib/project-store";
import {
  finalizeBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type OrgBrandingRecord = {
  organizationId: string;
  settings: ProposalBrandingSettings;
  updatedAt: string;
};

function isMissingRelation(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("org_branding_settings")
  );
}

export async function readOrgBrandingSettings(
  organizationId?: string | null
): Promise<{ ok: true; record: OrgBrandingRecord | null } | { ok: false; error: string }> {
  const client = db();
  if (!client) return { ok: true, record: null };

  const orgId = organizationId ?? (await resolveDefaultOrgId());
  if (!orgId) return { ok: true, record: null };

  const { data, error } = await client
    .from("org_branding_settings")
    .select("organization_id, settings, updated_at")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return { ok: true, record: null };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: true, record: null };

  const raw = data.settings;
  const partial =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<ProposalBrandingSettings>)
      : {};

  return {
    ok: true,
    record: {
      organizationId: String(data.organization_id),
      settings: finalizeBrandingSettings(partial),
      updatedAt: String(data.updated_at ?? new Date().toISOString()),
    },
  };
}

export async function writeOrgBrandingSettings(
  settings: ProposalBrandingSettings,
  organizationId?: string | null
): Promise<{ ok: true; record: OrgBrandingRecord } | { ok: false; error: string }> {
  const client = db();
  if (!client) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const orgId = organizationId ?? (await resolveDefaultOrgId());
  if (!orgId) {
    return {
      ok: false,
      error: "No active organization found. Create an organization before syncing branding.",
    };
  }

  const payload = finalizeBrandingSettings(settings);
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("org_branding_settings")
    .upsert(
      {
        organization_id: orgId,
        settings: payload,
        updated_at: now,
      },
      { onConflict: "organization_id" }
    )
    .select("organization_id, settings, updated_at")
    .single();

  if (error) {
    if (isMissingRelation(error)) {
      return {
        ok: false,
        error:
          "Cloud branding table is missing. Apply migration 080_org_branding_settings.sql, then save again.",
      };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    record: {
      organizationId: String(data.organization_id),
      settings: payload,
      updatedAt: String(data.updated_at ?? now),
    },
  };
}
