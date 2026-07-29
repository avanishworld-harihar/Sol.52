"use client";

/**
 * Premium Luxe — Obsidian Cover (Page 01).
 * Typography monument: massive client name, monogram, proposal ID.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ObsidianCoverProps = {
  data: ProposalData;
};

function buildProposalId(data: ProposalData): string {
  const year = data.meta.generatedAt
    ? new Date(data.meta.generatedAt).getFullYear()
    : new Date().getFullYear();
  const seed = `${data.meta.customerName}|${data.meta.systemKw}|${data.meta.generatedAt ?? ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const serial = String((hash % 9000) + 1000);
  return `PL-${year}-${serial}`;
}

export function ObsidianCover({ data }: ObsidianCoverProps) {
  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const brandTop = brand.split(/\s+/)[0]?.toUpperCase() || "HARIHAR";
  const systemKw = Number(data.meta.systemKw) || 3;
  const client = data.meta.customerName?.trim() || "Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Madhya Pradesh";
  const proposalId = buildProposalId(data);
  const dateLabel = data.meta.generatedAt
    ? new Date(data.meta.generatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  const monogram = brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section
      className={`${styles.a4Page} ${styles.obsidianCover} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.confidentialSeal}>
        <span className={styles.sealDot} />
        STRICTLY CONFIDENTIAL
      </div>

      <div className={styles.verticalBrand}>
        <span>{brandTop}</span>
        <div className={styles.verticalLine} />
        <span>ENERGY ARCHITECTURE</span>
      </div>

      <div className={styles.heroCenter}>
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.heroSvg}
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="#B8962E"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <rect x="32" y="32" width="36" height="36" stroke="#B8962E" strokeWidth="1.2" />
          <text
            x="50"
            y="56"
            textAnchor="middle"
            fill="#B8962E"
            fontSize="18"
            fontFamily="Georgia, serif"
            letterSpacing="2"
          >
            {monogram || "HS"}
          </text>
        </svg>

        <p className={styles.heroEyebrow}>PREPARED EXCLUSIVELY FOR</p>
        <h1 className={styles.heroClient}>{client}</h1>
        <p className={styles.heroSubtitle}>Premium Grid Architecture.</p>

        <div className={styles.coverCapacity}>
          <span className={styles.capacityFigure}>
            {systemKw % 1 === 0 ? systemKw.toFixed(0) : systemKw.toFixed(1)}
          </span>
          <span className={styles.capacityUnit}>kW AC</span>
        </div>
      </div>

      <div className={styles.coverFooter}>
        <div className={styles.footerNode}>
          <span>BRIEF ID</span>
          <strong>{proposalId}</strong>
        </div>
        <div className={styles.footerNode}>
          <span>LOCATION</span>
          <strong>{location}</strong>
        </div>
        <div className={styles.footerNode}>
          <span>ISSUED</span>
          <strong>{dateLabel}</strong>
        </div>
        <div className={styles.footerNode}>
          <span>VALIDITY</span>
          <strong className={styles.goldText}>15 DAYS</strong>
        </div>
      </div>
    </section>
  );
}

export default ObsidianCover;
