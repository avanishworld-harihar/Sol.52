"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle, fmtInr } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  monthLbls: string[];
  lang: ProposalLang;
  D: ProposalDict;
};

const PEAK_MONTHS = new Set([3, 4, 5, 6]);

export function AuroraBillIntelligence({ summary, monthLbls, lang, D }: Props) {
  const isHi = lang === "hi";
  const rows = summary.auditRows;
  const maxTotal = Math.max(...rows.map((r) => r.total), 1);
  const yearly = summary.yearlyBill;
  const after = summary.afterSolar;
  const saving = summary.annualSaving;

  return (
    <AuroraPageShell tone="pearl">
      <AuroraEyebrow>{isHi ? "आपकी बिजली आज" : "Your electricity today"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "वित्तीय प्रभाव" : "The financial impact."}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? `अभी आप सालाना लगभग ${fmtInr(yearly)} देते हैं। यह लगातार बढ़ता रहता है।`
          : `Right now you pay about ${fmtInr(yearly)} every year. This keeps rising.`}
      </AuroraLead>

      <div className="aurora-audit-hero-grid">
        <div>
          <p className="aurora-audit-val aurora-audit-val--indigo">{fmtInr(yearly)}</p>
          <p className="aurora-audit-lbl">{isHi ? "वर्तमान वार्षिक लागत" : "Current annual cost"}</p>
        </div>
        <div>
          <p className="aurora-audit-val">{fmtInr(after)}</p>
          <p className="aurora-audit-lbl">{isHi ? "सोलर के बाद लागत" : "Cost after solar"}</p>
        </div>
        <div className="aurora-audit-divider">
          <p className="aurora-audit-val aurora-audit-val--emerald">{fmtInr(saving)}</p>
          <p className="aurora-audit-lbl">{isHi ? "वार्षिक बचत" : "Annual savings"}</p>
        </div>
      </div>

      <div className="aurora-chart" aria-hidden>
        {rows.map((row, i) => {
          const h = Math.max(8, Math.round((row.total / maxTotal) * 100));
          const peak = PEAK_MONTHS.has(i);
          return (
            <div key={row.label} className="aurora-chart-col">
              <div
                className={`aurora-chart-bar ${peak ? "aurora-chart-bar--amber" : "aurora-chart-bar--indigo"}`}
                style={{ height: `${h}%` }}
              />
              <span className="aurora-chart-label">{monthLbls[i]?.slice(0, 3) ?? row.label}</span>
            </div>
          );
        })}
      </div>

      <div className="aurora-table-wrap">
        <table className="aurora-table">
          <thead>
            <tr>
              <th>{D["audit.month"]}</th>
              <th>{D["audit.units"]}</th>
              <th>{D["audit.energy"]}</th>
              <th>{D["audit.fixed"]}</th>
              <th>{D["audit.dutyFuel"]}</th>
              <th>{D["audit.netBill"]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label}>
                <td>{monthLbls[i] ?? row.label}</td>
                <td>{row.units.toLocaleString("en-IN")}</td>
                <td>{row.energy.toLocaleString("en-IN")}</td>
                <td>{row.fixed.toLocaleString("en-IN")}</td>
                <td>{(row.duty + row.fuel).toLocaleString("en-IN")}</td>
                <td className={PEAK_MONTHS.has(i) ? "aurora-table-highlight" : undefined}>
                  {row.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            <tr className="aurora-table-total">
              <td>{isHi ? "कुल" : "Total"}</td>
              <td>{summary.auditTotals.units.toLocaleString("en-IN")}</td>
              <td>{summary.auditTotals.energy.toLocaleString("en-IN")}</td>
              <td>{summary.auditTotals.fixed.toLocaleString("en-IN")}</td>
              <td>{(summary.auditTotals.duty + summary.auditTotals.fuel).toLocaleString("en-IN")}</td>
              <td>{summary.auditTotals.total.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AuroraPageShell>
  );
}
