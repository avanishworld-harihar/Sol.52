"use client";

import type { InstitutionalTechnicalPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalTechnicalPage;
};

const ARCH_NODES: Array<{ title: string; desc: string; grid?: boolean }> = [
  { title: "Array", desc: "Solar Panels" },
  { title: "DC Sys", desc: "DCDB & Cabling" },
  { title: "Inverter", desc: "On-Grid Unit" },
  { title: "AC Sys", desc: "ACDB & Cabling" },
  { title: "Load", desc: "Your Home" },
  { title: "Grid", desc: "Net Meter", grid: true },
];

function warrantyClass(tone: "green" | "blue" | "default"): string {
  if (tone === "blue") return "sp-col-warr blue";
  if (tone === "green") return "sp-col-warr";
  return "sp-col-warr default";
}

export function SpTechnicalBomPage({ data }: Props) {
  return (
    <section className="sp-page">
      <p className="sp-eyebrow">The Architecture</p>
      <h1>Built for 25 years.</h1>
      <p className="sp-lead">
        We focus on outcomes. Your system uses uncompromising infrastructure to secure your home.
      </p>

      <div className="sp-plan-wrapper">
        <div className="sp-arch-grid">
          <div className="sp-arch-row">
            {ARCH_NODES.map((node) => (
              <div key={node.title} className="sp-arch-cell">
                <div className={`sp-arch-card${node.grid ? " grid" : ""}`}>
                  <p className={`sp-arch-title${node.grid ? " green" : ""}`}>{node.title}</p>
                  <p className={`sp-arch-desc${node.grid ? " green" : ""}`}>{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <table className="sp-bom-table">
          <thead>
            <tr>
              <th className="sp-col-num">#</th>
              <th className="sp-col-comp">Component</th>
              <th className="sp-col-spec">Specification</th>
              <th className="sp-col-brand">Brand</th>
              <th className="sp-col-warr">Warranty</th>
            </tr>
          </thead>
          <tbody>
            {data.bom_rows.map((row) => (
              <tr key={row.index}>
                <td className="sp-col-num">{row.index}</td>
                <td className="sp-col-comp">{row.component}</td>
                <td className="sp-col-spec">{row.specification}</td>
                <td className="sp-col-brand">{row.brand}</td>
                <td className={warrantyClass(row.warranty_tone)}>{row.warranty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sp-warranty-cards">
          <div className="sp-warr-cell">
            <div className="sp-warr-card green-accent">
              <div>
                <p className="sp-warr-text">25 years Panel Warranty</p>
                <p className="sp-warr-sub">Performance ≥ 80% at year 25</p>
              </div>
            </div>
          </div>
          <div className="sp-warr-cell">
            <div className="sp-warr-card blue-accent">
              <div>
                <p className="sp-warr-text">10 years Inverter Warranty</p>
                <p className="sp-warr-sub">String inverter, MPPT, IP65 protection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sp-env-block">
        <p className="sp-env-eyebrow">Your Impact</p>
        <p className="sp-env-num">{Math.round(data.co2_tons)} Tons</p>
        <p className="sp-env-headline">of CO₂ eliminated.</p>
        <p className="sp-env-copy">
          Over 25 years, your system prevents emissions equivalent to planting over{" "}
          {data.trees.toLocaleString("en-IN")} trees. Pure, clean energy.
        </p>
      </div>
    </section>
  );
}
