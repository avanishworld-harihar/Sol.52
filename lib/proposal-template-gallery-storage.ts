import {
  galleryItemByKey,
  resolveActiveGalleryKey,
  type ProposalTemplateGalleryKey,
} from "@/lib/proposal-template-gallery";
import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";
import { normalizeSalesPremiumStyle, type SalesPremiumStyleId } from "@/lib/sales-premium-styles";

const STORAGE_KEY = "ss_default_proposal_template_gallery_key_v1";

export const PROPOSAL_TEMPLATE_GALLERY_KEY_UPDATED_EVENT =
  "ss-proposal-template-gallery-key-updated";

export function readDefaultGalleryKey(): ProposalTemplateGalleryKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY)?.trim();
    const normalized = raw === "apple_pro" ? "slate" : raw === "aurora" ? "solstice" : raw;
    if (normalized && galleryItemByKey(normalized as ProposalTemplateGalleryKey)) {
      return normalized as ProposalTemplateGalleryKey;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeDefaultGalleryKey(key: ProposalTemplateGalleryKey): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, key);
  window.dispatchEvent(
    new CustomEvent(PROPOSAL_TEMPLATE_GALLERY_KEY_UPDATED_EVENT, { detail: { key } })
  );
}

/** Active theme card — prefers saved gallery key when it still matches preset/style. */
export function resolveActiveTemplateGalleryKey(
  presetId: ResidentialTemplatePresetId,
  salesPremiumStyle?: SalesPremiumStyleId
): ProposalTemplateGalleryKey {
  const saved = readDefaultGalleryKey();
  if (saved) {
    const item = galleryItemByKey(saved);
    if (item && item.category === "residential" && item.presetId === presetId) {
      if (!item.salesPremiumStyle || item.salesPremiumStyle === normalizeSalesPremiumStyle(salesPremiumStyle)) {
        return saved;
      }
    }
  }
  return resolveActiveGalleryKey(presetId, salesPremiumStyle);
}
