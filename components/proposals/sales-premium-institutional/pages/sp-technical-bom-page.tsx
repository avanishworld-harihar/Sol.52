"use client";

import type { InstitutionalTechnicalPage } from "@/lib/sales-premium-institutional/types";
import { SpEnergyFlowSchematic } from "@/components/proposals/sales-premium-institutional/primitives/sp-energy-flow-schematic";

type Props = {
  data: InstitutionalTechnicalPage;
  pageNum: number;
  pageTotal: number;
};

function warrantyColor(tone?: "green" | "blue" | "default"): string {
  if (tone === "green") return "#059669";
  if (tone === "blue") return "#2563eb";
  return "#111827";
}

export function SpTechnicalBomPage({ data, pageNum, pageTotal }: Props) {
  return (
    <section className="sp-page">
      <div className="sp-section-tag">03 / Technical Specs</div>
      <h1 className="sp-h1">System Architecture &amp; BOM.</h1>
      <div className="sp-subtitle">Engineered for 25-year reliability. Full component transparency.</div>

      <SpEnergyFlowSchematic nodes={data.flow_nodes} />

      <div
        style={{
          fontSize: "7.5pt",
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          marginBottom: 10,
          letterSpacing: "1px",
        }}
      >
        Bill of Materials (Tier-1 Specs)
      </div>
      <table className="sp-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Component</th>
            <th style={{ textAlign: "left" }}>Specification</th>
            <th style={{ textAlign: "left" }}>Brand</th>
            <th>Warranty</th>
          </tr>
        </thead>
        <tbody>
          {data.bom_rows.map((row) => (
            <tr key={row.component}>
              <td style={{ fontWeight: 600, color: "#111827", fontFamily: "inherit" }}>
                {row.component}
              </td>
              <td style={{ textAlign: "left", fontFamily: "inherit" }}>{row.specification}</td>
              <td style={{ textAlign: "left", fontFamily: "inherit" }}>{row.brand}</td>
              <td
                style={{
                  color: warrantyColor(row.warranty_tone),
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                {row.warranty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="sp-page-num">
        {pageNum} / {pageTotal}
      </p>
    </section>
  );
}
