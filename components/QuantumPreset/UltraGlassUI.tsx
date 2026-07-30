"use client";

/**
 * UltraGlassUI — 3D glassmorphism benefits + net outlay display.
 * Use `embed` inside A4 Quantum pages; omit for a full-stage demo.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import {
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
} from "./quantum-brand";
import styles from "./Glassmorphism.module.css";

export type UltraGlassUIProps = {
  data?: ProposalData;
  /** Override net outlay label amount when data is absent. */
  netOutlayLabel?: string;
  /** Compact layout for A4 proposal pages (default true when data is passed). */
  embed?: boolean;
};

const DEFAULT_PILLS = [
  "Zero Maintenance Cost",
  "25-Year Warranty",
  "Net-Metering Ready",
  "1.16 Over-paneling Ratio",
] as const;

export function UltraGlassUI({
  data,
  netOutlayLabel,
  embed = Boolean(data),
}: UltraGlassUIProps) {
  const systemKw = Number(data?.meta.systemKw) || 3;
  const modules = quantumModuleCount(systemKw);
  const dcKwp = quantumDcKwp(modules);
  const dcAc = quantumDcAcRatio(dcKwp, systemKw);
  const ratioLabel =
    dcAc > 0 ? `${dcAc.toFixed(2)} Over-paneling Ratio` : DEFAULT_PILLS[3];

  const pills = [
    DEFAULT_PILLS[0],
    DEFAULT_PILLS[1],
    DEFAULT_PILLS[2],
    ratioLabel,
  ];

  const net = data?.economics.netInr ?? 0;
  const priceText =
    netOutlayLabel || (net > 0 ? formatInrCompact(net) : "₹1.22L");

  return (
    <div
      className={embed ? styles.ultraGlassEmbed : styles.ultraGlassContainer}
    >
      {/* Central 3D Panel */}
      <div
        className={styles.glassPanel3D}
        style={embed ? { padding: "24px" } : undefined}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: embed ? "12px" : "20px",
            justifyContent: "center",
            marginBottom: embed ? 0 : "40px",
          }}
        >
          {pills.map((label) => (
            <div key={label} className={styles.glassPill}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Big Call to Action / Price Display */}
      <div
        className={styles.glassPriceDisplay}
        style={embed ? { alignSelf: "center" } : undefined}
      >
        <div
          style={{
            fontSize: "0.8rem",
            color: "#89c4f4",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "5px",
          }}
        >
          Net Investment Outlay
        </div>
        <div className={styles.priceNumber}>{priceText}</div>
      </div>
    </div>
  );
}

export default UltraGlassUI;
