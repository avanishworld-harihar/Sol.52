"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle, fmtInr } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

export function AuroraInvestment({ summary, lang, D }: Props) {
  const isHi = lang === "hi";

  return (
    <AuroraPageShell tone="pearl">
      <AuroraEyebrow className="aurora-eyebrow--amber">{isHi ? "आपका निवेश" : "Your investment"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "वाणिज्यिक सारांश" : "Commercial summary."}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? "सिस्टम कीमत, माइनस सरकारी सब्सिडी — यही आप भुगतान करते हैं"
          : "System price, minus government subsidy, is what you pay."}
      </AuroraLead>

      <div className="aurora-cost-list">
        <div className="aurora-cost-row">
          <div>
            <p className="aurora-cost-title">{isHi ? "कुल इंफ्रास्ट्रक्चर लागत" : "Gross infrastructure cost"}</p>
            <p className="aurora-cost-desc">{isHi ? "Tier-1 इंजीनियरिंग और टर्नकी डिप्लॉयमेंट" : "Tier-1 engineering and turnkey deployment."}</p>
          </div>
          <p className="aurora-cost-amt">{fmtInr(summary.grossSystemCost)}</p>
        </div>
        <div className="aurora-cost-row">
          <div>
            <p className="aurora-cost-title">PM Surya Ghar {isHi ? "अनुदान" : "grant"}</p>
            <p className="aurora-cost-desc">{isHi ? "सीधे आपके खाते में सब्सिडी" : "Direct subsidy applied to your portfolio."}</p>
          </div>
          <p className="aurora-cost-amt aurora-cost-amt--success">− {fmtInr(summary.pmSubsidy)}</p>
        </div>
      </div>

      <div className="aurora-net-box">
        <p className="aurora-net-label">{isHi ? "नेट पूंजी आवश्यकता" : "Net capital requirement"}</p>
        <p className="aurora-net-val">{fmtInr(summary.netCost)}</p>
        <p className="aurora-net-sub">
          {isHi ? "अंतिम आउट-ऑफ-पॉकेट निवेश" : "Final out-of-pocket investment to secure the asset."}
        </p>
      </div>

      {summary.emi.length > 0 ? (
        <div className="aurora-emi-box">
          <div className="aurora-emi-header">
            {isHi ? "लचीला फाइनेंसिंग (सोलर लोन)" : "Flexible financing options (solar loan)"}
          </div>
          <div className="aurora-emi-grid">
            {summary.emi.map((row) => (
              <div key={row.tenureYears} className="aurora-emi-col">
                <p className="aurora-emi-term">
                  {row.tenureYears} {isHi ? "वर्ष" : "year"} {isHi ? "अवधि" : "term"}
                </p>
                <p className="aurora-emi-amt">
                  {fmtInr(row.monthlyEmi)}
                  <span className="aurora-emi-per">/{isHi ? "माह" : "mo"}</span>
                </p>
                <p className="aurora-emi-int">
                  {D["emi.totalInterest"]}: {fmtInr(row.totalInterest)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AuroraPageShell>
  );
}
