"use client";

/**
 * Emerald Signature — hardware list from live BOM only.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import {
  emeraldBomLine,
  emeraldWarranty,
  resolveEmeraldPanelSpec,
} from "./emerald-live";
import { useEmeraldLang } from "./emerald-lang-context";
import type { EmeraldCopy } from "./emerald-copy";
import styles from "./Emerald.module.css";

export type EmeraldHardwareProps = {
  data: ProposalData;
  folio: string;
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
  const { modules, watt } = resolveEmeraldPanelSpec(data);
  const systemKw = Number(data.meta.systemKw) || 0;
  const acLabel = formatEmeraldKw(systemKw, 1);
  const panelW = emeraldWarranty(data, /panel|module/i);
  const inverterW = emeraldWarranty(data, /inverter/i);
  const structureW = emeraldWarranty(data, /structure|mount|work/i);

  return [
    {
      num: "01",
      eyebrow: panelW,
      title: copy.hardware.panelTitle,
      desc: copy.hardware.panelDesc(modules, watt),
    },
    {
      num: "02",
      eyebrow: inverterW,
      title: copy.hardware.inverterTitle,
      desc: copy.hardware.inverterDesc(acLabel === "—" ? "" : acLabel),
    },
    {
      num: "03",
      eyebrow: structureW,
      title: copy.hardware.structureTitle,
      desc: copy.hardware.structureDesc,
    },
  ];
}

function fromBom(items: ProposalBomItem[], chosen: string): AnthologyItem[] {
  return items.slice(0, 3).map((item, i) => ({
    num: String(i + 1).padStart(2, "0"),
    eyebrow: (item.warranty || item.brand || "").toUpperCase(),
    title: item.name,
    desc: emeraldBomLine(item) || chosen,
  }));
}

export function EmeraldHardware({ data, folio }: EmeraldHardwareProps) {
  const { copy } = useEmeraldLang();
  const live = (data.bom ?? []).filter((b) => b.name?.trim());
  const items =
    live.length > 0
      ? fromBom(live, copy.hardware.chosen)
      : fallbackAnthology(data, copy);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
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
                {item.eyebrow ? (
                  <span className={styles.goldEyebrow}>{item.eyebrow}</span>
                ) : null}
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
