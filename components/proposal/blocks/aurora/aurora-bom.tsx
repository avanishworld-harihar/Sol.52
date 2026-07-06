"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle } from "./aurora-primitives";

const ICONS: Record<string, string> = {
  panels: "☀️",
  inverter: "⚡",
  structure: "🏗️",
  cables: "🔌",
  protection: "🛡️",
  netmeter: "📊",
  service: "🔧",
};

function bomIcon(slot: number, title: string): string {
  const t = title.toLowerCase();
  if (t.includes("panel") || t.includes("module")) return ICONS.panels;
  if (t.includes("inverter")) return ICONS.inverter;
  if (t.includes("structure") || t.includes("mount")) return ICONS.structure;
  if (t.includes("cable") || t.includes("wire")) return ICONS.cables;
  if (t.includes("protection") || t.includes("dcdb") || t.includes("acdb")) return ICONS.protection;
  if (t.includes("net") || t.includes("meter")) return ICONS.netmeter;
  if (t.includes("amc") || t.includes("service")) return ICONS.service;
  return ["☀️", "⚡", "🏗️", "🔌", "🛡️", "📊", "🔧"][slot % 7];
}

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

export function AuroraBom({ summary, lang }: Props) {
  const isHi = lang === "hi";

  return (
    <AuroraPageShell tone="pearl">
      <AuroraEyebrow>{isHi ? "सब कुछ शामिल" : "Everything included"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "कोई छुपा हुआ पार्ट नहीं" : "No hidden parts."}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? "आपके सिस्टम में शामिल हर Tier-1 कंपोनेंट — ईमानदार स्पेक के साथ"
          : "Here is every Tier-1 component engineered into your system."}
      </AuroraLead>

      <div className="aurora-bom-list">
        {summary.bom.map((item) => (
          <div key={item.slot} className="aurora-bom-row">
            <span className="aurora-bom-icon" aria-hidden>
              {bomIcon(item.slot, item.title)}
            </span>
            <div className="aurora-bom-body">
              <p className="aurora-bom-title">{item.title}</p>
              <p className="aurora-bom-desc">{item.spec}</p>
              {item.brand ? <span className="aurora-bom-brand">{item.brand}</span> : null}
            </div>
            <div className="aurora-bom-warr">
              <span className="aurora-warr-badge">{item.warranty}</span>
            </div>
          </div>
        ))}
      </div>
    </AuroraPageShell>
  );
}
