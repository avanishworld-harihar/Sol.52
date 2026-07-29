"use client";

/**
 * Premium Luxe — Clean Impact page.
 * Clear filled SVG metaphors · equal-height 5-year chart · EN/HI.
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

/** Hero: petrol car + blocked exhaust — matches “car off the road” note. */
function IllustCo2({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 180 168" className={styles.impactHeroArt} aria-hidden>
      <defs>
        <linearGradient id="impactCarBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3140" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
        <linearGradient id="impactSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(184,150,46,0.22)" />
          <stop offset="100%" stopColor="rgba(184,150,46,0.06)" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="78" r="70" fill="url(#impactSky)" />
      <circle
        cx="90"
        cy="78"
        r="62"
        fill="none"
        stroke="rgba(184,150,46,0.4)"
        strokeWidth="1.4"
      />

      {/* Soft road */}
      <ellipse cx="90" cy="118" rx="52" ry="7" fill="rgba(20,24,32,0.1)" />

      {/* Car body */}
      <path
        d="M42 98 L52 78 L78 72 L108 72 L128 82 L138 98 Z"
        fill="url(#impactCarBody)"
        stroke="#B8962E"
        strokeWidth="1.5"
      />
      <path
        d="M58 78 L72 74 L88 74 L100 78 L92 88 L62 88 Z"
        fill="rgba(184,150,46,0.25)"
        stroke="#B8962E"
        strokeWidth="1"
      />
      {/* Wheels */}
      <circle cx="64" cy="100" r="9" fill="#1e2430" stroke="#B8962E" strokeWidth="1.3" />
      <circle cx="64" cy="100" r="3.5" fill="#B8962E" />
      <circle cx="118" cy="100" r="9" fill="#1e2430" stroke="#B8962E" strokeWidth="1.3" />
      <circle cx="118" cy="100" r="3.5" fill="#B8962E" />

      {/* Exhaust smoke (grey) + block mark */}
      <ellipse cx="148" cy="86" rx="10" ry="7" fill="rgba(90,98,110,0.35)" />
      <ellipse cx="158" cy="78" rx="8" ry="6" fill="rgba(90,98,110,0.28)" />
      <circle cx="152" cy="72" r="16" fill="none" stroke="#B8962E" strokeWidth="2.4" />
      <line
        x1="141"
        y1="83"
        x2="163"
        y2="61"
        stroke="#B8962E"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <text
        x="90"
        y="152"
        textAnchor="middle"
        fill="#141820"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1.4"
        fontFamily="system-ui,sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

/** Grove of trees — easy “planting trees” read. */
function IllustTree() {
  return (
    <svg viewBox="0 0 96 96" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(184,150,46,0.12)" />
      <ellipse cx="48" cy="80" rx="28" ry="5" fill="rgba(20,24,32,0.08)" />

      {/* Back tree */}
      <path d="M28 72 V78" stroke="#3a4250" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M28 72 C18 72 14 62 18 54 C12 54 12 42 22 40 C24 30 36 30 38 40 C46 42 46 54 38 54 C42 62 36 72 28 72 Z"
        fill="rgba(184,150,46,0.28)"
        stroke="#B8962E"
        strokeWidth="1.1"
      />

      {/* Front tree (main) */}
      <path d="M52 68 V80" stroke="#3a4250" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M52 68 C36 68 28 54 34 40 C22 40 22 22 36 20 C38 6 66 6 68 20 C82 22 82 40 68 40 C74 54 66 68 52 68 Z"
        fill="rgba(184,150,46,0.48)"
        stroke="#B8962E"
        strokeWidth="1.5"
      />
      <circle cx="44" cy="38" r="2.4" fill="#8A6E22" opacity="0.55" />
      <circle cx="60" cy="36" r="2.1" fill="#8A6E22" opacity="0.5" />
      <circle cx="52" cy="48" r="2" fill="#8A6E22" opacity="0.4" />

      {/* Small sapling */}
      <path d="M72 74 V80" stroke="#3a4250" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M72 74 C66 74 64 68 66 62 C62 62 62 54 68 54 C69 48 78 48 79 54 C84 54 84 62 80 62 C82 68 78 74 72 74 Z"
        fill="rgba(184,150,46,0.38)"
        stroke="#B8962E"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Home with solar roof + sun — clean units from roof. */
function IllustSunRoof() {
  return (
    <svg viewBox="0 0 96 96" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(184,150,46,0.12)" />

      {/* Sun */}
      <circle cx="70" cy="24" r="9" fill="rgba(184,150,46,0.5)" stroke="#B8962E" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={70 + Math.cos(a) * 12}
            y1={24 + Math.sin(a) * 12}
            x2={70 + Math.cos(a) * 17}
            y2={24 + Math.sin(a) * 17}
            stroke="#B8962E"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        );
      })}

      {/* House */}
      <path
        d="M18 58 L48 38 L78 58 L78 78 L18 78 Z"
        fill="#F8F9FB"
        stroke="#141820"
        strokeWidth="1.6"
      />
      <path d="M18 58 L48 38 L78 58" fill="none" stroke="#B8962E" strokeWidth="2" />

      {/* Two PV modules on roof */}
      <rect
        x="28"
        y="48"
        width="16"
        height="11"
        fill="#1e3550"
        stroke="#B8962E"
        strokeWidth="1"
        transform="rotate(-18 36 53.5)"
      />
      <path
        d="M31 50 L41 47 M34 54 L44 51 M37 58 L47 55"
        fill="none"
        stroke="rgba(200,220,255,0.35)"
        strokeWidth="0.7"
        transform="rotate(-18 36 53.5)"
      />
      <rect
        x="48"
        y="46"
        width="16"
        height="11"
        fill="#1e3550"
        stroke="#B8962E"
        strokeWidth="1"
        transform="rotate(-18 56 51.5)"
      />

      {/* Door + window */}
      <rect x="42" y="64" width="12" height="14" fill="none" stroke="#141820" strokeWidth="1.4" />
      <rect x="26" y="64" width="10" height="8" fill="rgba(184,150,46,0.2)" stroke="#141820" strokeWidth="1" />

      {/* Power spark */}
      <path
        d="M82 52 L78 60 L84 60 L80 70"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Calendar + home — 25 years of benefit. */
function IllustYears() {
  return (
    <svg viewBox="0 0 96 96" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(184,150,46,0.12)" />

      {/* Calendar body */}
      <rect
        x="24"
        y="28"
        width="48"
        height="46"
        rx="4"
        fill="#F8F9FB"
        stroke="#141820"
        strokeWidth="1.6"
      />
      <rect x="24" y="28" width="48" height="12" rx="4" fill="#1e2a3a" />
      <rect x="24" y="36" width="48" height="4" fill="#1e2a3a" />
      <line x1="34" y1="24" x2="34" y2="34" stroke="#B8962E" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="62" y1="24" x2="62" y2="34" stroke="#B8962E" strokeWidth="2.2" strokeLinecap="round" />

      <text
        x="48"
        y="66"
        textAnchor="middle"
        fill="#B8962E"
        fontSize="20"
        fontWeight="700"
        fontFamily="Georgia,serif"
      >
        25
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

  /** Equal height — same clean units every year (not growing). */
  const barH = yearly > 0 ? 110 : 64;
  const barW = 56;

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
        <IllustCo2 label={copy.impact.heroArtLabel} />
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
          <IllustYears />
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

          {/* Steady-level guide — same height every year */}
          <line
            x1="36"
            y1={168 - barH}
            x2="500"
            y2={168 - barH}
            stroke="rgba(184,150,46,0.35)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x="500"
            y={168 - barH - 6}
            textAnchor="end"
            fill="#8A6E22"
            fontSize="9"
            fontFamily="system-ui,sans-serif"
            fontWeight="600"
            letterSpacing="0.6"
          >
            {copy.impact.chartSameLine}
          </text>

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
            const y = 168 - barH;
            return (
              <g key={b.label}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="5"
                  fill="url(#impactBar)"
                  opacity="0.88"
                />
                <rect
                  x={x}
                  y={y}
                  width={barW * 0.28}
                  height={barH}
                  rx="5"
                  fill="url(#impactBarShade)"
                  opacity="0.5"
                />
                <text
                  x={x + barW / 2}
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
                  x={x + barW / 2}
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
