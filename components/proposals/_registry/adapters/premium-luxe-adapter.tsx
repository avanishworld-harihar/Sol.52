/**
 * Thin adapter — Premium Luxe (ProposalData-native).
 */

import { PremiumLuxeRenderer } from "@/components/proposals/premium-luxe/premium-luxe-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function PremiumLuxeAdapter({ data }: PresetRendererProps) {
  return <PremiumLuxeRenderer data={data} />;
}
