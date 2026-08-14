"use client";

/**
 * Adapter — Field Engineering (survey drawing sheets) · preset id residential_field
 */

import { FieldRenderer } from "@/components/proposals/field-engineering/field-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function FieldEngineeringAdapter({
  data,
  installerLogoUrl,
  proposalId,
  siteImages,
}: PresetRendererProps) {
  return (
    <FieldRenderer
      data={data}
      installerLogoUrl={installerLogoUrl}
      proposalId={proposalId}
      siteImages={siteImages}
    />
  );
}
