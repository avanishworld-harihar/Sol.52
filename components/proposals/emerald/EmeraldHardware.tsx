"use client";

/**
 * Emerald Signature — full live BOM (all materials, spec / brand / warranty / points).
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import {
  emeraldBomDetail,
  emeraldLiveBom,
  emeraldWarranty,
  resolveEmeraldPanelSpec,
} from "./emerald-live";
import { useEmeraldLang } from "./emerald-lang-context";
import type { EmeraldCopy } from "./emerald-copy";
import styles from "./Emerald.module.css";

export type EmeraldHardwareProps = {
  data: ProposalData;
  folio: string;
  items: ProposalBomItem[];
  continued?: boolean;
  startIndex?: number;
};

function fallbackItems(data: ProposalData, copy: EmeraldCopy): ProposalBomItem[] {
  const { modules, watt } = resolveEmeraldPanelSpec(data);
  const systemKw = Number(data.meta.systemKw) || 0;
  const acLabel = formatEmeraldKw(systemKw, 1);
  return [
    {
      name: copy.hardware.panelTitle,
      brand: "",
      spec: copy.hardware.panelDesc(modules, watt),
      warranty: emeraldWarranty(data, /panel|module/i),
    },
    {
      name: copy.hardware.inverterTitle,
      brand: "",
      spec: copy.hardware.inverterDesc(acLabel === "—" ? "" : acLabel),
      warranty: emeraldWarranty(data, /inverter/i),
    },
    {
      name: copy.hardware.structureTitle,
      brand: "",
      spec: copy.hardware.structureDesc,
      warranty: emeraldWarranty(data, /structure|mount|work/i),
    },
  ];
}

export function emeraldHardwarePages(data: ProposalData): ProposalBomItem[][] {
  const live = emeraldLiveBom(data);
  if (live.length === 0) return [[]];
  const pages: ProposalBomItem[][] = [];
  for (let i = 0; i < live.length; i += 3) {
    pages.push(live.slice(i, i + 3));
  }
  return pages;
}

export function EmeraldHardware({
  data,
  folio,
  items,
  continued = false,
  startIndex = 0,
}: EmeraldHardwareProps) {
  const { copy } = useEmeraldLang();
  const rows = items.length > 0 ? items : fallbackItems(data, copy);

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
        <h2 className={styles.pageHeader}>
          {continued ? copy.hardware.pageHeaderMore : copy.hardware.pageHeader}
        </h2>

        <div className={styles.bomList}>
          {rows.map((item, i) => {
            const detail = emeraldBomDetail(item);
            const meta = [detail.brand, detail.warranty].filter(Boolean).join(" · ");
            return (
              <article key={`${detail.title}-${i}`} className={styles.bomRow}>
                <span className={styles.bomNum}>
                  {String(startIndex + i + 1).padStart(2, "0")}
                </span>
                <div className={styles.bomBody}>
                  <h3 className={styles.bomTitle}>{detail.title}</h3>
                  {meta ? <span className={styles.bomMeta}>{meta}</span> : null}
                  {detail.spec ? (
                    <p className={styles.bomSpec}>{detail.spec}</p>
                  ) : null}
                  {detail.points.length > 0 ? (
                    <ul className={styles.bomPoints}>
                      {detail.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EmeraldHardware;
