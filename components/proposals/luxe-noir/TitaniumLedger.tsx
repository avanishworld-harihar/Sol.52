"use client";

/**
 * Premium Luxe — Titanium Ledger (detailed BOM).
 * Distinct roles: modules, inverter, structure, DCDB, ACDB, LA+cable, earthing.
 * One BOM line is never reused across multiple roles.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
import { ExpertVerdict } from "./ExpertVerdict";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type TitaniumLedgerProps = {
  data: ProposalData;
};

type LedgerRow = {
  num: string;
  role: string;
  title: string;
  badge: string;
  body: string;
};

function bomBlob(b: ProposalBomItem): string {
  return `${b.name} ${b.brand} ${b.spec} ${b.description ?? ""} ${(b.technicalPoints ?? []).join(" ")}`;
}

function claimBom(
  bom: ProposalBomItem[],
  used: Set<number>,
  pattern: RegExp
): ProposalBomItem | undefined {
  const idx = bom.findIndex((b, i) => !used.has(i) && pattern.test(bomBlob(b)));
  if (idx < 0) return undefined;
  used.add(idx);
  return bom[idx];
}

function isGenericProtection(item: ProposalBomItem): boolean {
  const n = item.name.trim();
  return /protection|safety/i.test(n) && !/dcdb|acdb|earth|lightning|cable|arrest/i.test(n);
}

function buildRow(
  item: ProposalBomItem | undefined,
  base: Omit<LedgerRow, "title" | "body" | "badge"> & {
    title: string;
    badge: string;
    body: string;
  }
): LedgerRow {
  if (!item) {
    return {
      num: base.num,
      role: base.role,
      title: base.title,
      badge: base.badge,
      body: base.body,
    };
  }

  const generic = isGenericProtection(item);
  const brandBit = [item.brand].filter(Boolean).join(" · ");
  const title = generic
    ? brandBit
      ? `${brandBit} · ${base.title}`
      : base.title
    : `${item.brand} ${item.name}`.trim() || base.title;

  const detail = [
    item.spec,
    item.description,
    ...(item.technicalPoints ?? []).slice(0, 2),
  ]
    .filter(Boolean)
    .join(" · ");

  // Keep role-specific body when BOM text is a shared protection blob
  const body =
    generic || !detail
      ? base.body
      : detail.length > 220
        ? `${detail.slice(0, 210).trim()}…`
        : detail;

  return {
    num: base.num,
    role: base.role,
    title,
    badge: (item.warranty?.trim() || base.badge).toUpperCase(),
    body,
  };
}

export function TitaniumLedger({ data }: TitaniumLedgerProps) {
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const systemKw = Number(data.meta.systemKw) || 3;
  const modules = Math.max(1, Math.ceil((systemKw * 1000) / 580));
  const used = new Set<number>();

  const panel = claimBom(bom, used, /module|panel|topcon|mono|waaree|adani|dcr/i);
  const inverter = claimBom(bom, used, /inverter|mppt|on-?grid|string\s*inv/i);
  const structure = claimBom(bom, used, /mount|structure|rail|galvan|jsw/i);
  // Prefer explicit DCDB / ACDB names before a shared "Protection & Safety" line
  const dcdb = claimBom(
    bom,
    used,
    /\bdcdb\b|dc\s*distribution|dc\s*db|dc\s*box/i
  );
  const acdb = claimBom(
    bom,
    used,
    /\bacdb\b|ac\s*distribution|ac\s*db|ac\s*box/i
  );
  const cable = claimBom(bom, used, /cable|wiring|tuv|4\s*mm/i);
  const la = claimBom(bom, used, /lightning|arrestor|arrester|\bla\b|surge\s*path/i);
  const earth = claimBom(bom, used, /earth|earthing|ground\s*pit|is\s*3043/i);
  // Shared protection line — only if nothing claimed it yet; assign to DCDB gap only
  const sharedProtect = claimBom(
    bom,
    used,
    /protection|safety|spd|mcb/i
  );

  const rows: LedgerRow[] = [
    buildRow(panel, {
      num: "01",
      role: "MODULES",
      title: "N-Type TOPCon Modules",
      badge: "30-YEAR PERFORMANCE",
      body: `${modules} × 580 Wp · DCR compliant · ≥21% efficiency · ≤0.55%/yr degradation.`,
    }),
    buildRow(inverter, {
      num: "02",
      role: "INVERTER",
      title: "Grid-Tied String Inverter",
      badge: "8–10 YEAR OEM",
      body: `${formatLuxeKw(systemKw)} kW AC · Dual MPPT · IP65 · ≥97.5% export efficiency.`,
    }),
    buildRow(structure, {
      num: "03",
      role: "STRUCTURE",
      title: "Hot-Dip GI Mounting Structure",
      badge: "150 KM/H WIND",
      body: "JSW / equivalent GI rails & legs — monsoon-rated anchorage for rooftop loads.",
    }),
    buildRow(dcdb ?? sharedProtect, {
      num: "04",
      role: "DCDB",
      title: "DC Distribution Box",
      badge: "FUSE + TYPE-II SPD",
      body: "DC side protection (array → inverter): fuse / isolator + Type-II SPD for surge and over-current.",
    }),
    buildRow(acdb, {
      num: "05",
      role: "ACDB",
      title: "AC Distribution Box",
      badge: "MCB / MCCB + SPD",
      body: "AC side protection (inverter → grid/meter): MCB/MCCB isolation with Type-II surge protection.",
    }),
    buildRow(la ?? cable, {
      num: "06",
      role: "SURGE & CABLE",
      title: la ? "Lightning Arrestor" : "DC + AC Cabling",
      badge: la ? "TYPE-I/II TO EARTH" : "TUV · FIRE-RESISTANT",
      body: la
        ? "Type-I/II lightning arrestor bonded to earth — primary surge path for monsoon and grid events."
        : "TUV fire-resistant DC/AC cabling sized to string current · UV-stable outdoor runs.",
    }),
    buildRow(earth, {
      num: "07",
      role: "EARTHING",
      title: "Copper Earthing System",
      badge: "≤1 Ω · IS 3043",
      body: "Dedicated copper earth electrode & bonding for inverter, DCDB/ACDB, and LA — grid-fault and lightning safety.",
    }),
  ];

  // If LA was empty but cable used for 06, and a separate unused cable exists — already handled.
  // If both LA and cable exist and LA filled 06, surface cable detail in body when la was used:
  if (la && cable) {
    const row6 = rows[5]!;
    rows[5] = {
      ...row6,
      title: "Lightning Arrestor & Cabling",
      role: "SURGE & CABLE",
      body: `${row6.body} · ${cable.spec || cable.name || "TUV DC/AC cabling"}.`,
      badge: row6.badge,
    };
  }

  return (
    <section
      className={`${styles.a4Page} ${styles.ledgerPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>06 // BILL OF MATERIALS</span>
        <h2 className={styles.luxeHeadline}>The Silicon & Steel Ledger.</h2>
      </header>

      <p className={styles.bomLead}>
        Seven distinct layers — generation, conversion, structure, DC protection, AC
        protection, surge/cabling, and earthing. No duplicated safety line.
      </p>

      <div className={styles.ledgerListDense}>
        {rows.map((row) => (
          <div key={row.num} className={styles.ledgerItemDense}>
            <div className={styles.hugeNumberDense}>{row.num}</div>
            <div className={styles.itemContent}>
              <div className={styles.ledgerTitleRow}>
                <span className={styles.ledgerRole}>{row.role}</span>
                <span className={styles.specBadge}>{row.badge}</span>
              </div>
              <h3>{row.title}</h3>
              <p>{row.body}</p>
            </div>
          </div>
        ))}
      </div>

      <ExpertVerdict label="HARDWARE CURATOR'S VERDICT">
        DCDB, ACDB, lightning path and earthing are separate line items for a reason —
        each protects a different fault domain on this {formatLuxeKw(systemKw)} kW plant.
      </ExpertVerdict>
    </section>
  );
}

export default TitaniumLedger;
