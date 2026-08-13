"use client";

/**
 * Emerald Signature — Material Anthology (cascading left/right BOM).
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import {
  EMERALD_PANEL_WATT,
  emeraldModuleCount,
  formatEmeraldKw,
} from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldHardwareProps = {
  data: ProposalData;
};

type AnthologyItem = {
  num: string;
  eyebrow: string;
  title: string;
  desc: string;
};

function fallbackAnthology(data: ProposalData): AnthologyItem[] {
  const systemKw = Number(data.meta.systemKw) || 0;
  const modules = emeraldModuleCount(systemKw);
  const acLabel = formatEmeraldKw(systemKw, 1);
  const panelW = data.warranty.highlights.find((h) =>
    /panel|module/i.test(h.label)
  );
  const inverterW = data.warranty.highlights.find((h) =>
    /inverter/i.test(h.label)
  );
  const wind =
    data.engineering.metrics.find((m) => /wind/i.test(m.label))?.value ||
    "150 km/h";

  return [
    {
      num: "01",
      eyebrow: `${panelW?.value ?? "30"}-YEAR PERFORMANCE`,
      title: "N-Type TOPCon Array",
      desc:
        modules > 0
          ? `Deploying ${modules} × ${EMERALD_PANEL_WATT}Wp ultra-high efficiency modules. Engineered with N-Type technology for superior low-light performance and ultra-low thermal degradation. DCR compliant and rated at ≥21% photon conversion efficiency.`
          : "Ultra-high efficiency N-Type TOPCon modules. Engineered for superior low-light performance and ultra-low thermal degradation. DCR compliant and rated at ≥21% photon conversion efficiency.",
    },
    {
      num: "02",
      eyebrow: `${inverterW?.value ?? "10"}-YEAR REPLACEMENT`,
      title: "Grid-Tie Inverter",
      desc: `Intelligent ${acLabel} kW string inverter acting as the brain of your array. Features independent Dual-MPPT tracking for shade tolerance, IP65 weatherproofing, and a seamless 97.5% grid-synchronization architecture.`,
    },
    {
      num: "03",
      eyebrow: `${String(wind).replace(/\s+/g, " ").toUpperCase()} WIND RATING`,
      title: "Galvanized Exoskeleton",
      desc: "JSW Hot-Dip Galvanized Iron (GI) mounting structure engineered to anchor the array safely through extreme monsoons. Equipped with TUV-approved fire-resistant cabling and Type-II Surge Protection Devices (SPD).",
    },
  ];
}

function fromBom(items: ProposalBomItem[]): AnthologyItem[] {
  return items.slice(0, 3).map((item, i) => ({
    num: String(i + 1).padStart(2, "0"),
    eyebrow: (item.warranty || item.brand || "TIER-1").toUpperCase(),
    title: item.name,
    desc:
      item.description?.trim() ||
      [item.spec, item.brand, ...(item.technicalPoints ?? [])]
        .filter(Boolean)
        .join(". ") ||
      "Specified for this rooftop commission.",
  }));
}

export function EmeraldHardware({ data }: EmeraldHardwareProps) {
  const live = (data.bom ?? []).filter((b) => b.name?.trim());
  const items = live.length >= 3 ? fromBom(live) : fallbackAnthology(data);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>03</span>
        <div>
          <span className={styles.goldEyebrow}>SECTION THREE</span>
          <h3 className={styles.sidebarTitle}>
            Material
            <br />
            Anthology.
          </h3>
          <p className={styles.sidebarBlurb}>
            Tier-1 silicon, smart processors, and galvanized steel curated for
            decades of endurance.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Bill of Materials</h2>

        <div className={styles.cascadeWrapper}>
          {items.map((item) => (
            <div key={item.num} className={styles.cascadeItem}>
              <span className={styles.cascadeNumber}>{item.num}</span>
              <div className={styles.cascadeContent}>
                <span className={styles.goldEyebrow}>{item.eyebrow}</span>
                <h3 className={styles.cascadeTitle}>{item.title}</h3>
                <p className={styles.cascadeDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EmeraldHardware;
