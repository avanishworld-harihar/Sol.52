"use client";

/**
 * Premium Luxe — Titanium Ledger (detailed BOM).
 * Modules, inverter, structure, DCDB, ACDB, lightning arrestor, earthing.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
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

function findBom(
  bom: ProposalBomItem[],
  pattern: RegExp
): ProposalBomItem | undefined {
  return bom.find((b) => pattern.test(`${b.name} ${b.brand} ${b.spec} ${b.description ?? ""}`));
}

function fromBom(
  item: ProposalBomItem | undefined,
  fallback: LedgerRow
): LedgerRow {
  if (!item) return fallback;
  return {
    ...fallback,
    title: `${item.brand} ${item.name}`.trim() || fallback.title,
    badge: (item.warranty?.trim() || fallback.badge).toUpperCase(),
    body:
      [item.spec, item.description, ...(item.technicalPoints ?? []).slice(0, 2)]
        .filter(Boolean)
        .join(" · ") || fallback.body,
  };
}

export function TitaniumLedger({ data }: TitaniumLedgerProps) {
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const systemKw = Number(data.meta.systemKw) || 3;
  const modules = Math.max(1, Math.ceil((systemKw * 1000) / 580));

  const panel = findBom(bom, /module|panel|solar|topcon|mono/i);
  const inverter = findBom(bom, /inverter|mppt/i);
  const structure = findBom(bom, /mount|structure|rail|gi |galvan/i);
  const dcdb = findBom(bom, /dcdb|dc\s*distribution|dc\s*db/i);
  const acdb = findBom(bom, /acdb|ac\s*distribution|ac\s*db/i);
  const la = findBom(bom, /lightning|arrestor|arrester|la\b/i);
  const earth = findBom(bom, /earth|earthing|ground/i);
  const cable = findBom(bom, /cable|wiring|tuv/i);

  const rows: LedgerRow[] = [
    fromBom(panel, {
      num: "01",
      title: "N-Type TOPCon Modules",
      badge: "30-YEAR PERFORMANCE",
      body: `${modules} × 580 Wp · DCR compliant · ≥21% efficiency · ≤0.55%/yr degradation.`,
    }),
    fromBom(inverter, {
      num: "02",
      title: "Grid-Tied String Inverter",
      badge: "8–10 YEAR OEM",
      body: `${formatLuxeKw(systemKw)} kW AC · Dual MPPT · IP65 · ≥97.5% export efficiency.`,
    }),
    fromBom(structure, {
      num: "03",
      title: "Hot-Dip GI Mounting Structure",
      badge: "150 KM/H WIND",
      body: "JSW / equivalent GI rails & legs — monsoon-rated anchorage for rooftop loads.",
    }),
    fromBom(dcdb, {
      num: "04",
      title: "DCDB · DC Distribution Box",
      badge: "FUSE + TYPE-II SPD",
      body: "Protects the DC side (array → inverter) from surge and over-current. Isolator for safe maintenance.",
    }),
    fromBom(acdb, {
      num: "05",
      title: "ACDB · AC Distribution Box",
      badge: "MCB / MCCB + SPD",
      body: "Protects the AC side (inverter → grid/meter) with isolation and Type-II surge protection.",
    }),
    fromBom(la ?? cable, {
      num: "06",
      title: "Lightning Arrestor & Cabling",
      badge: "SURGE PATH TO EARTH",
      body: "Type-I/II lightning arrestor path plus TUV fire-resistant DC/AC cabling sized to string current.",
    }),
    fromBom(earth, {
      num: "07",
      title: "Copper Earthing System",
      badge: "≤1 Ω · IS 3043",
      body: "Dedicated copper earth electrode & bonding for inverter, ACDB/DCDB, and LA — grid-fault and lightning safety.",
    }),
  ];

  return (
    <section
      className={`${styles.a4Page} ${styles.ledgerPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>06 // BILL OF MATERIALS</span>
        <h2 className={styles.luxeHeadline}>The Silicon & Steel Ledger.</h2>
      </header>

      <p className={styles.bomLead}>
        Complete rooftop stack — generation, conversion, and full electrical protection
        (DCDB, ACDB, lightning arrestor, earthing).
      </p>

      <div className={styles.ledgerListDense}>
        {rows.map((row) => (
          <div key={row.num} className={styles.ledgerItemDense}>
            <div className={styles.hugeNumberDense}>{row.num}</div>
            <div className={styles.itemContent}>
              <div className={styles.ledgerTitleRow}>
                <h3>{row.title}</h3>
                <span className={styles.specBadge}>{row.badge}</span>
              </div>
              <p>{row.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TitaniumLedger;
