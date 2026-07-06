"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { AuroraLead, AuroraPageShell, AuroraTitle } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

export function AuroraBom({ summary, lang }: Props) {
  const isHi = lang === "hi";

  return (
    <AuroraPageShell tone="pearl" className="aurora-bom-page">
      <AuroraTitle className="aurora-bom-title">
        {isHi ? "Tier-1 कंपोनेंट" : "Tier-1 components."}
      </AuroraTitle>
      <AuroraLead className="aurora-bom-lead">
        {isHi
          ? "हर पार्ट ईमानदार स्पेक और वारंटी के साथ — कोई छुपा हुआ सामान नहीं"
          : "Every part with honest specs and warranty — no hidden items."}
      </AuroraLead>

      <div className="aurora-bom-table-wrap">
        <table className="aurora-bom-table">
          <thead>
            <tr>
              <th>{isHi ? "कंपोनेंट" : "Component"}</th>
              <th>{isHi ? "स्पेसिफिकेशन" : "Spec"}</th>
              <th>{isHi ? "ब्रांड" : "Brand"}</th>
              <th>{isHi ? "वारंटी" : "Warranty"}</th>
            </tr>
          </thead>
          <tbody>
            {summary.bom.map((item) => (
              <tr key={item.slot}>
                <td className="aurora-bom-comp">{item.title}</td>
                <td>{item.spec}</td>
                <td>{item.brand}</td>
                <td className="aurora-bom-warr">{item.warranty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuroraPageShell>
  );
}
