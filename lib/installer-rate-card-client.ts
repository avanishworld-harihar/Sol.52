/**
 * Client cache + API sync for installer rate card (master pricing).
 */

import type { InstallerRateCard } from "@/lib/installer-rate-card-schema";
import { defaultBrandCatalog, type ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
import { residentialBrandCatalogSchema } from "@/lib/residential-requirements-schema";
import type { CommercialPanelRateOverride } from "@/lib/installer-rate-card-schema";

const CACHE_KEY = "ss_installer_rate_card_v1";
const LEGACY_RESIDENTIAL_KEY = "ss_residential_brand_catalog_v1";

export const INSTALLER_RATE_CARD_UPDATED_EVENT = "ss-installer-rate-card-updated";

let memoryCard: InstallerRateCard | null = null;

function readLocalCache(): InstallerRateCard | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InstallerRateCard;
    const cat = residentialBrandCatalogSchema.safeParse(parsed.residentialCatalog);
    if (!cat.success || !cat.data.entries?.length) return null;
    return {
      scopeKey: parsed.scopeKey ?? "default",
      residentialCatalog: cat.data,
      commercialPanelRates: Array.isArray(parsed.commercialPanelRates)
        ? parsed.commercialPanelRates
        : [],
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function readLegacyResidentialCatalog(): ResidentialBrandCatalog | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_RESIDENTIAL_KEY);
    if (!raw) return null;
    const parsed = residentialBrandCatalogSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.entries?.length ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeLocalCache(card: InstallerRateCard) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(card));
    if (card.residentialCatalog) {
      localStorage.setItem(LEGACY_RESIDENTIAL_KEY, JSON.stringify(card.residentialCatalog));
    }
    window.dispatchEvent(new Event(INSTALLER_RATE_CARD_UPDATED_EVENT));
  } catch {
    /* quota */
  }
}

export function getCachedInstallerRateCard(): InstallerRateCard | null {
  return memoryCard ?? readLocalCache();
}

export function getCachedResidentialBrandCatalog(): ResidentialBrandCatalog | null {
  const card = getCachedInstallerRateCard();
  if (card?.residentialCatalog?.entries?.length) return card.residentialCatalog;
  return readLegacyResidentialCatalog();
}

export function getCachedCommercialPanelRates(): CommercialPanelRateOverride[] {
  return getCachedInstallerRateCard()?.commercialPanelRates ?? [];
}

export async function loadInstallerRateCard(force = false): Promise<InstallerRateCard> {
  if (!force && memoryCard?.residentialCatalog?.entries?.length) {
    return memoryCard;
  }

  const legacy = readLegacyResidentialCatalog();
  let fallback: InstallerRateCard = {
    scopeKey: "default",
    residentialCatalog: legacy ?? defaultBrandCatalog(),
    commercialPanelRates: [],
  };

  try {
    const res = await fetch("/api/installer-rate-card", { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; data?: InstallerRateCard };
    if (res.ok && json.ok && json.data?.residentialCatalog?.entries?.length) {
      memoryCard = json.data;
      writeLocalCache(json.data);
      return json.data;
    }
  } catch {
    /* offline */
  }

  const cached = readLocalCache();
  if (cached?.residentialCatalog?.entries?.length) {
    memoryCard = cached;
    return cached;
  }

  memoryCard = fallback;
  writeLocalCache(fallback);

  if (legacy && typeof window !== "undefined") {
    void saveInstallerRateCard({ residentialCatalog: legacy }).catch(() => undefined);
  }

  return fallback;
}

export async function saveInstallerRateCard(
  patch: Partial<Pick<InstallerRateCard, "residentialCatalog" | "commercialPanelRates">>
): Promise<InstallerRateCard> {
  const current = memoryCard ?? readLocalCache() ?? (await loadInstallerRateCard());
  const merged: InstallerRateCard = {
    scopeKey: "default",
    residentialCatalog: patch.residentialCatalog ?? current.residentialCatalog ?? defaultBrandCatalog(),
    commercialPanelRates: patch.commercialPanelRates ?? current.commercialPanelRates ?? [],
    updatedAt: new Date().toISOString(),
  };

  memoryCard = merged;
  writeLocalCache(merged);

  try {
    const res = await fetch("/api/installer-rate-card", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        residentialCatalog: merged.residentialCatalog,
        commercialPanelRates: merged.commercialPanelRates,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; data?: InstallerRateCard; error?: string };
    if (res.ok && json.ok && json.data) {
      memoryCard = json.data;
      writeLocalCache(json.data);
      return json.data;
    }
  } catch {
    /* saved locally */
  }

  return merged;
}

export async function saveInstallerResidentialCatalog(catalog: ResidentialBrandCatalog) {
  return saveInstallerRateCard({ residentialCatalog: catalog });
}
