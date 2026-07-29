"use client";

/**
 * Premium Luxe — Impact page with simple English + SVG illustrations.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeUnits } from "./luxe-format";
import { resolveLuxeVendorName } from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ImpactPageProps = {
  data: ProposalData;
  generationUnits: number;
  brand?: string;
};

function IllustLeaf() {
  return (
    <svg viewBox="0 0 80 80" className={styles.impactIcon} aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(184,150,46,0.08)" />
      <path
        d="M40 62 C22 52 18 34 28 22 C42 12 58 22 56 40 C54 52 48 58 40 62 Z"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.8"
      />
      <path
        d="M34 48 C40 40 46 30 50 22"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function IllustTree() {
  return (
    <svg viewBox="0 0 80 80" className={styles.impactIcon} aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(184,150,46,0.08)" />
      <path d="M40 58 V68" stroke="#3a4250" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M40 58 C28 58 22 48 26 38 C18 38 18 26 28 24 C30 14 50 14 52 24 C62 26 62 38 54 38 C58 48 52 58 40 58 Z"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IllustSunRoof() {
  return (
    <svg viewBox="0 0 80 80" className={styles.impactIcon} aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(184,150,46,0.08)" />
      <circle cx="40" cy="28" r="8" fill="none" stroke="#B8962E" strokeWidth="1.6" />
      {[0, 45, 90, 135].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={40 + Math.cos(a) * 12}
            y1={28 + Math.sin(a) * 12}
            x2={40 + Math.cos(a) * 17}
            y2={28 + Math.sin(a) * 17}
            stroke="#B8962E"
            strokeWidth="1.2"
          />
        );
      })}
      <path
        d="M18 52 L40 40 L62 52 L62 62 L18 62 Z"
        fill="none"
        stroke="#141820"
        strokeWidth="1.5"
      />
      <rect x="28" y="46" width="10" height="7" fill="none" stroke="#B8962E" strokeWidth="1" />
      <rect x="42" y="46" width="10" height="7" fill="none" stroke="#B8962E" strokeWidth="1" />
    </svg>
  );
}

function IllustCo2() {
  return (
    <svg viewBox="0 0 120 120" className={styles.impactHeroArt} aria-hidden>
      <circle cx="60" cy="60" r="54" fill="rgba(184,150,46,0.1)" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(184,150,46,0.35)" strokeWidth="1" />
      <path
        d="M60 88 C36 74 30 50 42 34 C58 20 78 32 76 52 C74 68 68 78 60 88 Z"
        fill="none"
        stroke="#B8962E"
        strokeWidth="2"
      />
      <path
        d="M48 62 C54 52 62 42 68 34"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.4"
      />
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fill="#1e2430"
        fontSize="9"
        letterSpacing="1.5"
        fontFamily="system-ui,sans-serif"
      >
        LESS CO₂
      </text>
    </svg>
  );
}

export function ImpactPage({ data, generationUnits, brand }: ImpactPageProps) {
  const vendor = (brand?.trim() || resolveLuxeVendorName(data) || "Solar Partner").trim();
  const co2 = impactTons(data);
  const trees =
    data.impact.treesEquivalent > 0
      ? Math.round(data.impact.treesEquivalent)
      : co2 > 0
        ? Math.round(co2 * 45)
        : 0;
  const yearly = generationUnits > 0 ? generationUnits : 0;
  // Simple 5-year clean-units bars for illustration
  const yearBars = [1, 2, 3, 4, 5].map((y) => ({
    y,
    h: Math.max(18, Math.round((y / 5) * 88)),
    label: `Y${y}`,
  }));

  return (
    <section
      className={`${styles.a4Page} ${styles.impactPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>07 // CLEAN IMPACT</span>
        <h2 className={styles.luxeHeadline}>Your Clean Energy Impact.</h2>
      </header>

      <p className={styles.impactLead}>
        Solar on your roof makes clean power at home. Less coal power from the grid.
        Cleaner air for your family — for many years.
      </p>

      <div className={styles.impactHeroRow}>
        <div className={styles.impactHeroCopy}>
          <span className={styles.impactHeroLabel}>CO₂ AVOIDED · LIFETIME</span>
          <strong className={`${styles.impactHeroNum} ${styles.luxeNum}`}>
            {co2 > 0 ? `~${Math.round(co2)}` : "—"}
          </strong>
          <span className={styles.impactHeroUnit}>tonnes</span>
          <p className={styles.impactHeroNote}>
            About the same as taking a petrol car off the road for years — estimated from
            your system size and yearly generation.
          </p>
        </div>
        <IllustCo2 />
      </div>

      <div className={styles.impactCardGrid}>
        <div className={styles.impactCard}>
          <IllustTree />
          <span className={styles.impactCardLabel}>LIKE PLANTING</span>
          <strong className={`${styles.impactCardValue} ${styles.luxeNum}`}>
            {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
          </strong>
          <span className={styles.impactCardHint}>trees over the plant life</span>
        </div>
        <div className={styles.impactCard}>
          <IllustSunRoof />
          <span className={styles.impactCardLabel}>CLEAN POWER / YEAR</span>
          <strong className={`${styles.impactCardValue} ${styles.luxeNum}`}>
            {yearly > 0 ? formatLuxeUnits(yearly) : "—"}
          </strong>
          <span className={styles.impactCardHint}>units from your roof</span>
        </div>
        <div className={styles.impactCard}>
          <IllustLeaf />
          <span className={styles.impactCardLabel}>FOR YOUR HOME</span>
          <strong className={styles.impactCardValueSoft}>25 years</strong>
          <span className={styles.impactCardHint}>cleaner local air, lower bills</span>
        </div>
      </div>

      <div className={styles.impactChartBlock}>
        <div className={styles.impactChartHead}>
          <span>CLEAN UNITS — FIRST 5 YEARS</span>
          <span className={styles.luxeNum}>
            {yearly > 0 ? `~${formatLuxeUnits(yearly)} / year` : "—"}
          </span>
        </div>
        <svg
          viewBox="0 0 520 130"
          width="100%"
          height="120"
          className={styles.impactChartSvg}
          aria-hidden
        >
          <defs>
            <linearGradient id="impactBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8962E" />
              <stop offset="100%" stopColor="#8A6E22" />
            </linearGradient>
          </defs>
          {yearBars.map((b, i) => {
            const x = 48 + i * 90;
            const barH = yearly > 0 ? 20 + (i + 1) * 14 : b.h;
            const y = 100 - barH;
            return (
              <g key={b.label}>
                <rect
                  x={x}
                  y={y}
                  width="48"
                  height={barH}
                  rx="4"
                  fill="url(#impactBar)"
                  opacity={0.55 + i * 0.1}
                />
                <text
                  x={x + 24}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#141820"
                  fontSize="10"
                  fontFamily="system-ui,sans-serif"
                  fontWeight="600"
                >
                  {yearly > 0 ? formatLuxeUnits(yearly) : "—"}
                </text>
                <text
                  x={x + 24}
                  y={116}
                  textAnchor="middle"
                  fill="#1e2430"
                  fontSize="10"
                  fontFamily="system-ui,sans-serif"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
          <text
            x="16"
            y="20"
            fill="#1e2430"
            fontSize="9"
            fontFamily="system-ui,sans-serif"
            letterSpacing="0.5"
          >
            Steady clean power each year
          </text>
        </svg>
        <p className={styles.impactChartFoot}>
          Same clean units, year after year — while grid power would still burn coal.
        </p>
      </div>

      <ExpertVerdict label="SIMPLE TAKEAWAY">
        {co2 > 0
          ? `This plant can avoid about ${Math.round(co2)} tonnes of CO₂ over its life${
              trees > 0
                ? ` — like the work of about ${trees.toLocaleString("en-IN")} trees`
                : ""
            }. You save on bills. Your street gets cleaner air.`
          : `Clean power from your roof means less coal power from the grid. You save money. Your neighbourhood breathes easier.`}
      </ExpertVerdict>

      <footer className={styles.impactPageFooter}>
        <span>{vendor.toUpperCase()}</span>
        <span>07 / 11</span>
      </footer>
    </section>
  );
}

function impactTons(data: ProposalData): number {
  if (data.impact.co2Tons > 0) return data.impact.co2Tons;
  return 0;
}

export default ImpactPage;
