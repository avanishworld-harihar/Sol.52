"use client";

/**
 * Premium Luxe — Titanium Ledger (detailed BOM).
 * Distinct roles: modules, inverter, structure, DCDB, ACDB, LA+cable, earthing.
 * Electrical qty/spec aligned to installer BOM sheet (boxes, 4 sqmm wire, 17mm earth, 2m LA).
 * One BOM line is never reused across multiple roles.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import { LuxeHeaderBrand, LuxePageFooter } from "./luxe-brand";
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

function brandTitle(
  item: ProposalBomItem | undefined,
  fallback: string,
  roleHint?: string
): string {
  if (!item) return fallback;
  if (isGenericProtection(item)) {
    const brandBit = item.brand?.trim();
    return brandBit ? `${brandBit} · ${fallback}` : fallback;
  }
  const raw = `${item.brand} ${item.name}`.trim();
  if (!raw) return fallback;
  // Avoid "Havells Havells" style doubles; prefer brand + role when name is generic
  let title =
    roleHint && new RegExp(roleHint, "i").test(item.name) === false
      ? item.brand?.trim()
        ? `${item.brand.trim()} · ${fallback}`
        : raw
      : raw;
  if (title.length > 56) title = `${title.slice(0, 53).trim()}…`;
  return title;
}

/** Bold quantity / material lead so BOM lines scan faster. */
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

function buildRow(
  item: ProposalBomItem | undefined,
  base: LedgerRow,
  opts?: { preferBaseBody?: boolean }
): LedgerRow {
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
    // Keep sheet qty/spec; append short brand/spec hint when useful
    if (item.brand?.trim() && !base.body.toLowerCase().includes(item.brand.trim().toLowerCase())) {
      body = `${base.body} · Make: ${item.brand.trim()}`;
    }
  } else if (!isGenericProtection(item) && detail) {
    body = detail.length <= 220 ? detail : base.body;
  }
  if (body.length > 320) {
    const cut = body.lastIndexOf(" · ", 310);
    body =
      cut > 120 ? `${body.slice(0, cut).trim()}…` : `${body.slice(0, 310).trim()}…`;
  }

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
  const la = claimBom(bom, used, /lightning|arrestor|arrester|\bla\b|surge\s*path/i);
  const earth = claimBom(bom, used, /earth|earthing|ground\s*pit|is\s*3043/i);
  const sharedProtect = claimBom(bom, used, /protection|safety|spd|mcb/i);

  const { copy, isHi } = useLuxeLang();

  const rows: LedgerRow[] = [
    buildRow(panel, {
      num: "01",
      role: isHi ? "मॉड्यूल्स" : "MODULES",
      title: isHi ? "N-Type TOPCon मॉड्यूल" : "N-Type TOPCon Modules",
      badge: isHi ? "30-वर्ष प्रदर्शन" : "30-YEAR PERFORMANCE",
      body: isHi
        ? `मात्रा ${modules} Nos · ${modules} × 580 Wp DCR TOPCon · ≥21% दक्षता · ≤0.55%/वर्ष degradation.`
        : `Qty ${modules} Nos · ${modules} × 580 Wp DCR TOPCon (N-Type) · ≥21% efficiency · ≤0.55%/yr degradation.`,
    }),
    buildRow(inverter, {
      num: "02",
      role: isHi ? "इन्वर्टर" : "INVERTER",
      title: isHi ? "ग्रिड-टाइड स्ट्रिंग इन्वर्टर" : "Grid-Tied String Inverter",
      badge: isHi ? "8–10 वर्ष OEM" : "8–10 YEAR OEM",
      body: isHi
        ? `मात्रा 1 Nos · ${formatLuxeKw(systemKw)} kW On-Grid · Dual MPPT · IP65 · ≥97.5% दक्षता.`
        : `Qty 1 Nos · ${formatLuxeKw(systemKw)} kW On-Grid String · Dual MPPT · IP65 · ≥97.5% efficiency.`,
    }),
    buildRow(structure, {
      num: "03",
      role: isHi ? "स्ट्रक्चर" : "STRUCTURE",
      title: isHi
        ? "हॉट-डिप GI माउंटिंग स्ट्रक्चर"
        : "Hot-Dip GI Mounting Structure",
      badge: isHi ? "150 किमी/घं हवा" : "150 KM/H WIND",
      body: isHi
        ? "साइट के अनुसार मात्रा · Hot-Dip GI (IS 875) · 150 km/h विंड · RCC / क्लैंप फिक्सिंग."
        : "Qty as per site · Hot-Dip GI (IS 875) · 150 km/h wind-load · RCC penetration / clamp fixing.",
    }),
    buildRow(
      dcdb ?? sharedProtect,
      {
        num: "04",
        role: "DCDB",
        title: isHi ? "DC वितरण बॉक्स" : "DC Distribution Box",
        badge: "1 NOS · HAVELLS",
        body: isHi
          ? "मात्रा 1 Nos · Havells / reputed make · Fuse / isolator + Type-II SPD (array → inverter)."
          : "Qty 1 Nos · Havells / reputed make · Fuse / isolator + Type-II SPD (array → inverter).",
      },
      { preferBaseBody: true }
    ),
    buildRow(
      acdb,
      {
        num: "05",
        role: "ACDB",
        title: isHi ? "AC वितरण बॉक्स" : "AC Distribution Box",
        badge: "1 NOS · HAVELLS",
        body: isHi
          ? "मात्रा 1 Nos · Havells / reputed make · MCB/MCCB + Type-II SPD (inverter → meter/grid)."
          : "Qty 1 Nos · Havells / reputed make · MCB/MCCB + Type-II SPD (inverter → meter/grid).",
      },
      { preferBaseBody: true }
    ),
    buildRow(
      la ?? cable,
      {
        num: "06",
        role: isHi ? "सर्ज और केबल" : "SURGE & CABLE",
        title: isHi
          ? "लाइटनिंग अरेस्टर + DC/AC केबल"
          : "Lightning Arrestor + DC/AC Cabling",
        badge: isHi ? "LA 1 SET · 4 SQMM" : "LA 1 SET · 4 SQMM",
        body: isHi
          ? "LA: 1 Set · 2 mtr. DC/AC केबल: 4 sqmm (Polycab / Anchor) — आवश्यकता अनुसार मीटर."
          : "LA: 1 Set · 2 mtr. DC/AC cable: 4 sqmm (Polycab / Anchor) — meters as required.",
      },
      { preferBaseBody: true }
    ),
    buildRow(
      earth,
      {
        num: "07",
        role: isHi ? "अर्थिंग" : "EARTHING",
        title: isHi
          ? "कॉपर अर्थिंग किट + अर्थ केबल"
          : "Copper Earthing Kit + Earth Cable",
        badge: "3 SET · 17 MM",
        body: isHi
          ? "अर्थिंग: 3 Set · 17 mm कॉपर (Best). अर्थ केबल: 4 sqmm — आवश्यकता अनुसार. INV / DCDB / ACDB / LA बॉन्डिंग."
          : "Earthing: 3 Set · 17 mm copper (Best). Earth cable: 4 sqmm as required. Bonds INV, DCDB/ACDB, and LA.",
      },
      { preferBaseBody: true }
    ),
  ];

  // If both LA and cable exist, keep sheet qty language (already in base); enrich make only
  if (la && cable) {
    const row6 = rows[5]!;
    const cableMake = cable.brand?.trim() || cable.name?.trim();
    if (cableMake && !row6.body.includes(cableMake)) {
      const enriched = `${row6.body} · ${cableMake}`;
      rows[5] = {
        ...row6,
        body: enriched.length > 180 ? `${enriched.slice(0, 170).trim()}…` : enriched,
      };
    }
  }

  return (
    <section
      className={`${styles.a4Page} ${styles.ledgerPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <div className={styles.luxeHeaderRow}>
          <div className={styles.luxeHeaderCopy}>
            <span className={styles.goldTag}>{copy.bom.tag}</span>
            <h2 className={styles.luxeHeadline}>{copy.bom.title}</h2>
          </div>
          <LuxeHeaderBrand />
        </div>
      </header>

      <div className={styles.ledgerPageStack}>
        <p className={styles.bomLead}>
          {isHi
            ? "सात परतें — मॉड्यूल, इन्वर्टर, स्ट्रक्चर, DCDB (1), ACDB (1), LA + 4 sqmm केबल, और 17 mm अर्थिंग (3 सेट)। मात्रा इंस्टॉलर BOM शीट के अनुसार।"
            : "Seven layers — modules, inverter, structure, DCDB (1), ACDB (1), LA + 4 sqmm cabling, and 17 mm earthing (3 sets). Quantities follow the installer BOM sheet."}
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
                <h3 className={styles.bomMaterialName}>{row.title}</h3>
                <p className={styles.bomMaterialBody}>
                  {formatBomBody(row.body)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ExpertVerdict label={copy.bom.verdictLabel}>
        {copy.bom.verdict}
      </ExpertVerdict>

      <LuxePageFooter pageLabel="06 / 12" />
    </section>
  );
}

export default TitaniumLedger;
