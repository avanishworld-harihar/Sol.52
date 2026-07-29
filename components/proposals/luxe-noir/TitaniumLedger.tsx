"use client";

/**
 * Premium Luxe — Titanium Ledger (Page 06).
 * Massive-number BOM list bound to live ProposalData.bom with luxury fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type TitaniumLedgerProps = {
  data: ProposalData;
};

type LedgerRow = {
  num: string;
  title: string;
  badge: string;
  body: string;
};

const FALLBACKS: LedgerRow[] = [
  {
    num: "01",
    title: "N-Type TOPCon Array",
    badge: "30-YEAR WARRANTY",
    body: "Adani / Waaree 580Wp modules. DCR compliant with ≥21% photon conversion efficiency.",
  },
  {
    num: "02",
    title: "Dual-MPPT Inverter",
    badge: "10-YEAR REPLACEMENT",
    body: "Havells / Polycab intelligent string inverter. Independent tracking for shade tolerance.",
  },
  {
    num: "03",
    title: "Galvanized Exoskeleton",
    badge: "150 KM/H WIND RATING",
    body: "JSW Hot-Dip Galvanized Iron (GI) structure. Anchored for decades of extreme weather.",
  },
  {
    num: "04",
    title: "Armor & Transmission",
    badge: "LIFETIME CABLING",
    body: "TUV fire-resistant DC/AC cabling, Type-II SPD, and dedicated copper earthing.",
  },
];

function findBom(
  bom: ProposalBomItem[],
  pattern: RegExp
): ProposalBomItem | undefined {
  return bom.find((b) => pattern.test(`${b.name} ${b.brand} ${b.spec}`));
}

function rowFromBom(
  item: ProposalBomItem | undefined,
  fallback: LedgerRow,
  num: string
): LedgerRow {
  if (!item) return { ...fallback, num };
  const title =
    `${item.brand} ${item.name}`.trim() || fallback.title;
  const badge = item.warranty?.trim() || fallback.badge;
  const body =
    [item.spec, item.description, ...(item.technicalPoints ?? []).slice(0, 1)]
      .filter(Boolean)
      .join(" · ") || fallback.body;
  return { num, title, badge: badge.toUpperCase(), body };
}

export function TitaniumLedger({ data }: TitaniumLedgerProps) {
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const panel = findBom(bom, /module|panel|solar|topcon|mono/i);
  const inverter = findBom(bom, /inverter|mppt/i);
  const structure = findBom(bom, /mount|structure|rail|gi |galvan/i);
  const protection = findBom(bom, /cable|acdb|dcdb|spd|earthing|protection/i);

  const used = new Set(
    [panel, inverter, structure, protection].filter(Boolean) as ProposalBomItem[]
  );
  const extras = bom.filter((b) => !used.has(b)).slice(0, 1);

  const rows: LedgerRow[] = [
    rowFromBom(panel, FALLBACKS[0]!, "01"),
    rowFromBom(inverter, FALLBACKS[1]!, "02"),
    rowFromBom(structure, FALLBACKS[2]!, "03"),
  ];

  if (protection || extras[0]) {
    rows.push(rowFromBom(protection ?? extras[0], FALLBACKS[3]!, "04"));
  } else {
    rows.push({ ...FALLBACKS[3]!, num: "04" });
  }

  return (
    <section
      className={`${styles.a4Page} ${styles.ledgerPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>06 // BILL OF MATERIALS</span>
        <h2 className={styles.luxeHeadline}>The Silicon & Steel Ledger.</h2>
      </header>

      <div className={styles.ledgerList}>
        {rows.slice(0, 4).map((row) => (
          <div key={row.num} className={styles.ledgerItem}>
            <div className={styles.hugeNumber}>{row.num}</div>
            <div className={styles.itemContent}>
              <h3>{row.title}</h3>
              <span className={styles.specBadge}>{row.badge}</span>
              <p>{row.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TitaniumLedger;
