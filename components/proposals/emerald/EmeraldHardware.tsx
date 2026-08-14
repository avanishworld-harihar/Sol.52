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
      title: "Solar Panels",
      desc:
        modules > 0
          ? `${modules} × ${EMERALD_PANEL_WATT}W high-efficiency N-Type TOPCon panels. They work well in low light, lose less power in heat, are DCR compliant, and convert about 21% of sunlight into electricity.`
          : "High-efficiency N-Type TOPCon panels. They work well in low light, lose less power in heat, are DCR compliant, and convert about 21% of sunlight into electricity.",
    },
    {
      num: "02",
      eyebrow: `${inverterW?.value ?? "10"}-YEAR REPLACEMENT`,
      title: "Grid-Tie Inverter",
      desc: `A ${acLabel} kW string inverter that converts panel power for your home. Dual MPPT helps in shade, IP65 weather protection, and about 97.5% efficiency.`,
    },
    {
      num: "03",
      eyebrow: `${String(wind).replace(/\s+/g, " ").toUpperCase()} WIND RATING`,
      title: "Mounting Structure",
      desc: "JSW hot-dip galvanized iron (GI) structure made to hold the panels safely in heavy monsoon and wind. Includes TUV-approved fire-resistant cables and Type-II surge protection (SPD).",
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
      "Chosen for this rooftop project.",
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
            Hardware
            <br />
            List.
          </h3>
          <p className={styles.sidebarBlurb}>
            Quality panels, inverter, and steel structure built to last.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>What We Will Install</h2>

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
