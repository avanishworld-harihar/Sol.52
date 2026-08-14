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
import { useEmeraldLang } from "./emerald-lang-context";
import type { EmeraldCopy } from "./emerald-copy";
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

function fallbackAnthology(
  data: ProposalData,
  copy: EmeraldCopy
): AnthologyItem[] {
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
      eyebrow: copy.hardware.panelEyebrow(panelW?.value ?? "30"),
      title: copy.hardware.panelTitle,
      desc: copy.hardware.panelDesc(modules, EMERALD_PANEL_WATT),
    },
    {
      num: "02",
      eyebrow: copy.hardware.inverterEyebrow(inverterW?.value ?? "10"),
      title: copy.hardware.inverterTitle,
      desc: copy.hardware.inverterDesc(acLabel),
    },
    {
      num: "03",
      eyebrow: copy.hardware.structureEyebrow(
        String(wind).replace(/\s+/g, " ").toUpperCase()
      ),
      title: copy.hardware.structureTitle,
      desc: copy.hardware.structureDesc,
    },
  ];
}

function fromBom(items: ProposalBomItem[], chosen: string): AnthologyItem[] {
  return items.slice(0, 3).map((item, i) => ({
    num: String(i + 1).padStart(2, "0"),
    eyebrow: (item.warranty || item.brand || "TIER-1").toUpperCase(),
    title: item.name,
    desc:
      item.description?.trim() ||
      [item.spec, item.brand, ...(item.technicalPoints ?? [])]
        .filter(Boolean)
        .join(". ") ||
      chosen,
  }));
}

export function EmeraldHardware({ data }: EmeraldHardwareProps) {
  const { copy } = useEmeraldLang();
  const live = (data.bom ?? []).filter((b) => b.name?.trim());
  const items =
    live.length >= 3
      ? fromBom(live, copy.hardware.chosen)
      : fallbackAnthology(data, copy);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>03</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.hardware.eyebrow}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.hardware.sidebarTitle[0]}
            <br />
            {copy.hardware.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.hardware.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.hardware.pageHeader}</h2>

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
