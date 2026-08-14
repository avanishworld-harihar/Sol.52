"use client";

/**
 * Obsidian — full material list from live BOM (spec, brand, warranty, points).
 */

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Obsidian.module.css";

export type ObsidianMaterialsProps = {
  data: ProposalData;
};

export function ObsidianMaterials({ data }: ObsidianMaterialsProps) {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());

  return (
    <section className={styles.a4TechSpec}>
      <div className={styles.viewfinder}>
        <div className={styles.vfCornerTR} />
        <div className={styles.vfCornerBL} />
      </div>

      <div className={styles.contentArea}>
        <div className={styles.techHeader}>
          <div>
            <span className={styles.systemCode}>
              [ SYS_ARCH_02 ] :: MATERIAL_MANIFEST
            </span>
            <h2 className={styles.mainTitle}>
              Hardware
              <br />
              Manifest.
            </h2>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.systemCode}>BOM LIVE</span>
            <div className={styles.headerMeta}>
              {items.length > 0 ? `${items.length} LINE ITEMS` : "NO BOM ROWS"}
            </div>
          </div>
        </div>

        {items.length > 0 ? (
          <div className={styles.bomStack}>
            {items.map((item, i) => {
              const points = (item.technicalPoints ?? [])
                .map((p) => p.trim())
                .filter(Boolean)
                .slice(0, 3);
              const meta = [item.brand, item.warranty].filter(Boolean).join(" · ");
              return (
                <article key={`${item.name}-${i}`} className={styles.bomCard}>
                  <span className={styles.bomIndex}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={styles.bomCopy}>
                    <h3 className={styles.bomTitle}>{item.name}</h3>
                    {meta ? <span className={styles.bomMeta}>{meta}</span> : null}
                    {item.spec ? <p className={styles.bomSpec}>{item.spec}</p> : null}
                    {points.length > 0 ? (
                      <ul className={styles.bomPoints}>
                        {points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className={styles.dataHint}>
            Material list will appear here when this proposal has a live BOM.
          </p>
        )}
      </div>
    </section>
  );
}

export default ObsidianMaterials;
