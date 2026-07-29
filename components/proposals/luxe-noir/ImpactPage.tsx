"use client";

/**
 * Premium Luxe — Clean Impact page.
 * Stacked bands: CO₂ hero + metric columns + tall 5-year chart.
 * Filled SVG illustrations · print-safe · EN/HI via useLuxeLang.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeUnits } from "./luxe-format";
import { resolveLuxeVendorName } from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ImpactPageProps = {
  data: ProposalData;
  generationUnits: number;
  brand?: string;
};

function IllustLeaf() {
  return (
    <svg viewBox="0 0 96 96" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(184,150,46,0.12)" />
      <circle
        cx="48"
        cy="48"
        r="38"
        fill="none"
        stroke="rgba(184,150,46,0.28)"
        strokeWidth="1.2"
      />
      <path
        d="M48 74 C26 62 20 40 32 26 C48 14 68 26 66 48 C64 62 58 70 48 74 Z"
        fill="rgba(184,150,46,0.35)"
        stroke="#B8962E"
        strokeWidth="1.6"
      />
      <path
        d="M40 58 C48 48 56 36 62 26"
        fill="none"
        stroke="#8A6E22"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M44 52 C38 46 34 40 32 34M50 56 C54 48 58 42 60 36"
        fill="none"
        stroke="rgba(138,110,34,0.55)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IllustTree() {
  return (
    <svg viewBox="0 0 96 96" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(184,150,46,0.12)" />
      <ellipse cx="48" cy="78" rx="22" ry="5" fill="rgba(20,24,32,0.08)" />
      <path
        d="M48 70 V80"
        stroke="#3a4250"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M48 70 C34 70 26 58 30 46 C20 46 20 30 32 28 C34 14 60 14 62 28 C74 30 74 46 62 46 C66 58 60 70 48 70 Z"
        fill="rgba(184,150,46,0.4)"
        stroke="#B8962E"
        strokeWidth="1.5"
      />
      <path
        d="M36 48 C40 40 44 34 48 30 C52 34 56 40 60 48"
        fill="none"
        stroke="rgba(138,110,34,0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="40" cy="42" r="2.2" fill="#8A6E22" opacity="0.5" />
      <circle cx="56" cy="40" r="2" fill="#8A6E22" opacity="0.45" />
    </svg>
  );
}

function IllustSunRoof() {
  return (
    <svg viewBox="0 0 96 96" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(184,150,46,0.12)" />
      <circle cx="48" cy="28" r="10" fill="rgba(184,150,46,0.45)" stroke="#B8962E" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={48 + Math.cos(a) * 14}
            y1={28 + Math.sin(a) * 14}
            x2={48 + Math.cos(a) * 20}
            y2={28 + Math.sin(a) * 20}
            stroke="#B8962E"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        );
      })}
      <path
        d="M16 58 L48 42 L80 58 L80 76 L16 76 Z"
        fill="#F8F9FB"
        stroke="#141820"
        strokeWidth="1.6"
      />
      <path d="M16 58 L48 42 L80 58" fill="none" stroke="#B8962E" strokeWidth="1.8" />
      <rect x="28" y="52" width="14" height="10" fill="rgba(30,53,80,0.85)" stroke="#B8962E" strokeWidth="0.9" />
      <rect x="46" y="50" width="14" height="10" fill="rgba(30,53,80,0.85)" stroke="#B8962E" strokeWidth="0.9" />
      <rect x="42" y="64" width="12" height="12" fill="none" stroke="#141820" strokeWidth="1.3" />
    </svg>
  );
}

function IllustCo2() {
  return (
    <svg viewBox="0 0 160 160" className={styles.impactHeroArt} aria-hidden>
      <defs>
        <linearGradient id="impactLeafFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(184,150,46,0.55)" />
          <stop offset="100%" stopColor="rgba(138,110,34,0.35)" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="76" r="68" fill="rgba(184,150,46,0.14)" />
      <circle
        cx="80"
        cy="76"
        r="56"
        fill="none"
        stroke="rgba(184,150,46,0.4)"
        strokeWidth="1.4"
      />
      <circle
        cx="80"
        cy="76"
        r="46"
        fill="none"
        stroke="rgba(184,150,46,0.22)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <path
        d="M80 112 C48 94 40 62 56 40 C76 22 102 36 100 62 C98 84 90 100 80 112 Z"
        fill="url(#impactLeafFill)"
        stroke="#B8962E"
        strokeWidth="2"
      />
      <path
        d="M64 78 C72 64 82 50 92 40"
        fill="none"
        stroke="#8A6E22"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M70 72 C62 64 56 56 54 48M78 80 C84 68 90 58 94 52"
        fill="none"
        stroke="rgba(138,110,34,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <text
        x="80"
        y="148"
        textAnchor="middle"
        fill="#141820"
        fontSize="12"
        fontWeight="700"
        letterSpacing="2"
        fontFamily="system-ui,sans-serif"
      >
        LESS CO₂
      </text>
    </svg>
  );
}

export function ImpactPage({ data, generationUnits, brand }: ImpactPageProps) {
  const { copy, isHi } = useLuxeLang();
  const vendor = (
    brand?.trim() ||
    resolveLuxeVendorName(data) ||
    (isHi ? "सोलर पार्टनर" : "Solar Partner")
  ).trim();
  const co2 = impactTons(data);
  const trees =
    data.impact.treesEquivalent > 0
      ? Math.round(data.impact.treesEquivalent)
      : co2 > 0
        ? Math.round(co2 * 45)
        : 0;
  const yearly = generationUnits > 0 ? generationUnits : 0;

  const yearBars = [1, 2, 3, 4, 5].map((y) => ({
    y,
    label: isHi ? `वर्ष ${y}` : `Y${y}`,
  }));

  return (
    <section
      className={`${styles.a4Page} ${styles.impactPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>{copy.impact.tag}</span>
        <h2 className={styles.luxeHeadline}>{copy.impact.title}</h2>
      </header>

      <p className={styles.impactLead}>{copy.impact.lead}</p>

      <div className={styles.impactHeroRow}>
        <div className={styles.impactHeroCopy}>
          <span className={styles.impactHeroLabel}>{copy.impact.co2Label}</span>
          <div className={styles.impactHeroValueRow}>
            <strong className={`${styles.impactHeroNum} ${styles.luxeNum}`}>
              {co2 > 0 ? `~${Math.round(co2)}` : "—"}
            </strong>
            <span className={styles.impactHeroUnit}>{copy.impact.tonnes}</span>
          </div>
          <p className={styles.impactHeroNote}>{copy.impact.co2Note}</p>
        </div>
        <IllustCo2 />
      </div>

      <div className={styles.impactCardGrid}>
        <div className={styles.impactCard}>
          <IllustTree />
          <span className={styles.impactCardLabel}>{copy.impact.likePlanting}</span>
          <strong className={`${styles.impactCardValue} ${styles.luxeNum}`}>
            {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
          </strong>
          <span className={styles.impactCardHint}>{copy.impact.treesHint}</span>
        </div>
        <div className={styles.impactCard}>
          <IllustSunRoof />
          <span className={styles.impactCardLabel}>{copy.impact.cleanPower}</span>
          <strong className={`${styles.impactCardValue} ${styles.luxeNum}`}>
            {yearly > 0 ? formatLuxeUnits(yearly) : "—"}
          </strong>
          <span className={styles.impactCardHint}>{copy.impact.unitsHint}</span>
        </div>
        <div className={styles.impactCard}>
          <IllustLeaf />
          <span className={styles.impactCardLabel}>{copy.impact.forHome}</span>
          <strong className={styles.impactCardValueSoft}>{copy.impact.years25}</strong>
          <span className={styles.impactCardHint}>{copy.impact.homeHint}</span>
        </div>
      </div>

      <div className={styles.impactChartBlock}>
        <div className={styles.impactChartHead}>
          <span>{copy.impact.chartHead}</span>
          <span className={styles.luxeNum}>
            {yearly > 0
              ? `~${formatLuxeUnits(yearly)} / ${isHi ? "वर्ष" : "year"}`
              : "—"}
          </span>
        </div>
        <p className={styles.impactChartSteady}>{copy.impact.chartSteady}</p>
        <svg
          viewBox="0 0 520 200"
          width="100%"
          height="188"
          className={styles.impactChartSvg}
          aria-hidden
        >
          <defs>
            <linearGradient id="impactBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84A" />
              <stop offset="55%" stopColor="#B8962E" />
              <stop offset="100%" stopColor="#8A6E22" />
            </linearGradient>
            <linearGradient id="impactBarShade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
            </linearGradient>
          </defs>

          {/* Baseline */}
          <line
            x1="36"
            y1="168"
            x2="500"
            y2="168"
            stroke="#E2E6EC"
            strokeWidth="1.5"
          />

          {yearBars.map((b, i) => {
            const x = 52 + i * 92;
            const barH = yearly > 0 ? 72 + i * 16 : 48 + i * 18;
            const y = 168 - barH;
            const w = 56;
            return (
              <g key={b.label}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={barH}
                  rx="5"
                  fill="url(#impactBar)"
                  opacity={0.72 + i * 0.06}
                />
                <rect
                  x={x}
                  y={y}
                  width={w * 0.28}
                  height={barH}
                  rx="5"
                  fill="url(#impactBarShade)"
                  opacity="0.5"
                />
                <text
                  x={x + w / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fill="#141820"
                  fontSize="13"
                  fontFamily="system-ui,sans-serif"
                  fontWeight="700"
                >
                  {yearly > 0 ? formatLuxeUnits(yearly) : "—"}
                </text>
                <text
                  x={x + w / 2}
                  y={186}
                  textAnchor="middle"
                  fill="#1e2430"
                  fontSize="12"
                  fontFamily="system-ui,sans-serif"
                  fontWeight="600"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
        <p className={styles.impactChartFoot}>{copy.impact.chartFoot}</p>
      </div>

      <ExpertVerdict label={copy.impact.verdictLabel}>
        {co2 > 0
          ? isHi
            ? `यह प्लांट जीवनकाल में लगभग ${Math.round(co2)} टन CO₂ बचा सकता है${
                trees > 0
                  ? ` — लगभग ${trees.toLocaleString("en-IN")} पेड़ों के काम जितना`
                  : ""
              }. आप बिल बचाते हैं। आपके इलाके में साफ़ हवा।`
            : `This plant can avoid about ${Math.round(co2)} tonnes of CO₂ over its life${
                trees > 0
                  ? ` — like the work of about ${trees.toLocaleString("en-IN")} trees`
                  : ""
              }. You save on bills. Your street gets cleaner air.`
          : isHi
            ? "आपकी छत से स्वच्छ बिजली मतलब ग्रिड से कम कोयला बिजली। आप पैसे बचाते हैं। पड़ोस साँस लेता है।"
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
