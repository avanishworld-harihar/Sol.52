"use client";

import type { InstitutionalFlowNode } from "@/lib/sales-premium-institutional/types";

type Props = {
  nodes: InstitutionalFlowNode[];
};

export function SpEnergyFlowSchematic({ nodes }: Props) {
  return (
    <div className="sp-schematic-box">
      <div
        style={{
          fontSize: "7.5pt",
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          marginBottom: 20,
          letterSpacing: "1px",
        }}
      >
        Energy Flow Schematic
      </div>
      <div className="sp-flow-container">
        {nodes.map((node, i) => (
          <div key={node.title} className="sp-flow-node">
            <div
              className={`sp-node-content${node.highlight ? " sp-node-content--highlight" : ""}`}
            >
              {node.title}
              <span className="sp-node-sub">{node.sub}</span>
            </div>
            {i < nodes.length - 1 ? <div className="sp-flow-line" aria-hidden /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
