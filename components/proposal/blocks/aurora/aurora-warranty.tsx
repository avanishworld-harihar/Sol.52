"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { AuroraPageShell } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

type WarrantyRow = {
  item: string;
  duration: string;
  by: string;
  coverage: string;
};

function warrantyRows(lang: ProposalLang, amcYears: number): WarrantyRow[] {
  const isHi = lang === "hi";
  return [
    {
      item: isHi ? "सोलर पैनल — उत्पाद" : "Solar modules — product",
      duration: "10–12 years",
      by: isHi ? "निर्माता" : "Manufacturer",
      coverage: isHi ? "विनिर्माण दोष" : "Manufacturing defects",
    },
    {
      item: isHi ? "सोलर पैनल — पावर आउटपुट" : "Solar modules — power output",
      duration: "25 years",
      by: isHi ? "निर्माता" : "Manufacturer",
      coverage: isHi ? "≥80% @ वर्ष 25" : "≥80% rated @ year 25",
    },
    {
      item: isHi ? "स्ट्रिंग इन्वर्टर" : "String inverter",
      duration: "5–10 years",
      by: isHi ? "निर्माता" : "Manufacturer",
      coverage: isHi ? "उत्पाद वारंटी" : "Product warranty",
    },
    {
      item: isHi ? "माउंटिंग स्ट्रक्चर" : "Mounting structure",
      duration: "10 years",
      by: "EPC",
      coverage: isHi ? "जंग / संरचनात्मक अखंडता" : "Corrosion & structural integrity",
    },
    {
      item: isHi ? "विद्युत कार्य" : "Electrical workmanship",
      duration: "1–2 years",
      by: isHi ? "इंस्टॉलर" : "Installer",
      coverage: isHi ? "स्थापना गारंटी" : "Installation guarantee",
    },
    {
      item: isHi ? "नेट मीटरिंग सहायता" : "Net-metering support",
      duration: `${amcYears} yr AMC`,
      by: isHi ? "सर्विस डेस्क" : "Service desk",
      coverage: isHi ? "कमीशनिंग और O&M" : "Commissioning & O&M",
    },
  ];
}

export function AuroraWarranty({ summary, lang }: Props) {
  const isHi = lang === "hi";
  const rows = warrantyRows(lang, summary.amcSelectedYears ?? 1);
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "Tier-1";
  const inverterBrand = summary.brands?.inverter ?? "—";

  return (
    <AuroraPageShell tone="pearl" className="aurora-warranty-page">
      <span className="aurora-section-tag">
        {isHi ? "वारंटी और सुरक्षा" : "Warranty & assurance"}
      </span>
      <h2 className="aurora-bom-title">
        {isHi ? "वारंटी मैट्रिक्स" : "Warranty matrix"}
      </h2>
      <p className="aurora-eng-lead">
        {isHi
          ? `आपके ${summary.systemKw} kW सिस्टम पर लागू वारंटी — ${panelBrand} पैनल, ${inverterBrand} इन्वर्टर।`
          : `Warranty coverage on your ${summary.systemKw} kW system — ${panelBrand} panels, ${inverterBrand} inverter.`}
      </p>

      <div className="aurora-warranty-table-wrap">
        <table className="aurora-warranty-table">
          <thead>
            <tr>
              <th>{isHi ? "आइटम" : "Item"}</th>
              <th>{isHi ? "अवधि" : "Duration"}</th>
              <th>{isHi ? "द्वारा" : "By"}</th>
              <th>{isHi ? "कवरेज" : "Coverage"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.item}>
                <td className="aurora-warranty-item">{row.item}</td>
                <td>{row.duration}</td>
                <td>{row.by}</td>
                <td className="aurora-warranty-cov">{row.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="aurora-bom-outcomes">
        <div className="aurora-outcome-card">
          <p className="aurora-outcome-title">
            {isHi ? "दावा कैसे करें" : "How to claim"}
          </p>
          <p className="aurora-outcome-desc">
            {isHi
              ? "निर्माता दोष के लिए सेवा डेस्क से संपर्क करें। भौतिक क्षति, वैंडलिज़्म या गलत उपयोग कवर नहीं।"
              : "Contact our service desk for manufacturer defects. Physical damage, vandalism, or misuse is excluded."}
          </p>
        </div>
        <div className="aurora-outcome-card">
          <p className="aurora-outcome-title">
            {isHi ? "आपकी जिम्मेदारी" : "Your responsibility"}
          </p>
          <p className="aurora-outcome-desc">
            {isHi
              ? "नियमित पैनल सफाई, सुरक्षित छत पहुँच, और रिमोट मॉनिटरिंग के लिए इंटरनेट।"
              : "Routine panel cleaning, safe roof access, and internet for remote monitoring."}
          </p>
        </div>
      </div>
    </AuroraPageShell>
  );
}
