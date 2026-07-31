"use client";

/**
 * Quantum Hardware — full BOM ledger (aligned to Premium Luxe roles).
 * Modules, inverter, structure, DCDB, ACDB, LA+cable, earthing.
 * Simple English. Schematic copy only — not Design Studio / SLD.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_PANEL_WATT,
  quantumModuleCount,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumHardwareProps = {
  data: ProposalData;
};

type BomRow = {
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
  return (
    /protection|safety/i.test(n) &&
    !/dcdb|acdb|earth|lightning|cable|arrest/i.test(n)
  );
}

function brandTitle(
  item: ProposalBomItem | undefined,
  fallback: string
): string {
  if (!item) return fallback;
  if (isGenericProtection(item)) {
    const brandBit = item.brand?.trim();
    return brandBit ? `${brandBit} · ${fallback}` : fallback;
  }
  const raw = `${item.brand} ${item.name}`.trim();
  if (!raw) return fallback;
  return raw.length > 56 ? `${raw.slice(0, 53).trim()}…` : raw;
}

function buildRow(
  item: ProposalBomItem | undefined,
  base: BomRow,
  opts?: { preferBaseBody?: boolean }
): BomRow {
  if (!item) return base;

  const title = brandTitle(item, base.title);
  const detail = [
    item.spec,
    item.description,
    ...(item.technicalPoints ?? []).slice(0, 2),
  ]
    .filter(Boolean)
    .join(" · ");

  let body = base.body;
  if (opts?.preferBaseBody) {
    if (
      item.brand?.trim() &&
      !base.body.toLowerCase().includes(item.brand.trim().toLowerCase())
    ) {
      body = `${base.body} · Make: ${item.brand.trim()}`;
    }
  } else if (!isGenericProtection(item) && detail) {
    body = detail.length > 150 ? `${detail.slice(0, 140).trim()}…` : detail;
  }
  if (body.length > 180) body = `${body.slice(0, 170).trim()}…`;

  return {
    num: base.num,
    role: base.role,
    title,
    badge: (item.warranty?.trim() || base.badge).toUpperCase(),
    body,
  };
}

function formatBomBody(body: string) {
  const parts = body.split(" · ").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return body;
  const leadCount = Math.min(2, parts.length);
  const lead = parts.slice(0, leadCount).join(" · ");
  const rest = parts.slice(leadCount).join(" · ");
  return (
    <>
      <strong>{lead}</strong>
      {rest ? <> · {rest}</> : null}
    </>
  );
}

export function QuantumHardware({ data }: QuantumHardwareProps) {
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const systemKw = Number(data.meta.systemKw) || 3;
  const modules = quantumModuleCount(systemKw) || 6;
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);
  const used = new Set<number>();

  const panel = claimBom(bom, used, /module|panel|topcon|mono|waaree|adani|dcr/i);
  const inverter = claimBom(bom, used, /inverter|mppt|on-?grid|string\s*inv/i);
  const structure = claimBom(bom, used, /mount|structure|rail|galvan|jsw/i);
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
  const cable = claimBom(bom, used, /cable|wiring|tuv|4\s*mm|4\s*sq/i);
  const la = claimBom(
    bom,
    used,
    /lightning|arrestor|arrester|\bla\b|surge\s*path/i
  );
  const earth = claimBom(bom, used, /earth|earthing|ground\s*pit|is\s*3043/i);
  const sharedProtect = claimBom(bom, used, /protection|safety|spd|mcb/i);

  const rows: BomRow[] = [
    buildRow(panel, {
      num: "01",
      role: "MODULES",
      title: "N-Type TOPCon Modules",
      badge: "30-YEAR PERFORMANCE",
      body: `Qty ${modules} Nos · ${modules} × ${QUANTUM_PANEL_WATT} Wp DCR TOPCon · ≥21% efficiency · low yearly loss.`,
    }),
    buildRow(inverter, {
      num: "02",
      role: "INVERTER",
      title: "Grid-Tied String Inverter",
      badge: "8–10 YEAR OEM",
      body: `Qty 1 Nos · ${acLabel} kW on-grid · Dual MPPT · IP65 · ≥97.5% efficiency.`,
    }),
    buildRow(structure, {
      num: "03",
      role: "STRUCTURE",
      title: "Hot-Dip GI Mounting Structure",
      badge: "150 KM/H WIND",
      body: "Qty as per site · Hot-Dip GI (IS 875) · 150 km/h wind load · roof fixing as surveyed.",
    }),
    buildRow(
      dcdb ?? sharedProtect,
      {
        num: "04",
        role: "DCDB",
        title: "DC Distribution Box",
        badge: "1 NOS · HAVELLS",
        body: "Qty 1 Nos · Havells / reputed make · Fuse / isolator + Type-II SPD (array to inverter).",
      },
      { preferBaseBody: true }
    ),
    buildRow(
      acdb,
      {
        num: "05",
        role: "ACDB",
        title: "AC Distribution Box",
        badge: "1 NOS · HAVELLS",
        body: "Qty 1 Nos · Havells / reputed make · MCB/MCCB + Type-II SPD (inverter to meter).",
      },
      { preferBaseBody: true }
    ),
    buildRow(
      la ?? cable,
      {
        num: "06",
        role: "SURGE & CABLE",
        title: "Lightning Arrestor + DC/AC Cabling",
        badge: "LA 1 SET · 4 SQMM",
        body: "LA: 1 Set · 2 mtr. DC/AC cable: 4 sqmm (Polycab / Anchor) — meters as needed.",
      },
      { preferBaseBody: true }
    ),
    buildRow(
      earth,
      {
        num: "07",
        role: "EARTHING",
        title: "Copper Earthing Kit + Earth Cable",
        badge: "3 SET · 17 MM",
        body: "Earthing: 3 Set · 17 mm copper. Earth cable: 4 sqmm as needed. Bonds inverter, DCDB/ACDB, and LA.",
      },
      { preferBaseBody: true }
    ),
  ];

  if (la && cable) {
    const row6 = rows[5]!;
    const cableMake = cable.brand?.trim() || cable.name?.trim();
    if (cableMake && !row6.body.includes(cableMake)) {
      const enriched = `${row6.body} · ${cableMake}`;
      rows[5] = {
        ...row6,
        body:
          enriched.length > 180
            ? `${enriched.slice(0, 170).trim()}…`
            : enriched,
      };
    }
  }

  return (
    <section className={`${styles.a4Page} ${styles.bomPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          03 // BILL OF MATERIALS
        </span>
        <h2>What We Install.</h2>
      </div>

      <p className={styles.bomLead}>
        Seven parts — modules, inverter, structure, DCDB, ACDB, lightning
        protection with cable, and earthing. Quantities follow the installer BOM
        sheet.
      </p>

      <div className={`${styles.glass3D} ${styles.bomLedger}`}>
        {rows.map((row) => (
          <div key={row.num} className={styles.bomRow}>
            <div className={styles.bomNum}>{row.num}</div>
            <div className={styles.bomContent}>
              <div className={styles.bomTitleRow}>
                <span className={styles.bomRole}>{row.role}</span>
                <span className={styles.bomBadge}>{row.badge}</span>
              </div>
              <h3 className={styles.bomTitle}>{row.title}</h3>
              <p className={styles.bomBody}>{formatBomBody(row.body)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default QuantumHardware;
