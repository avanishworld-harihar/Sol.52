/**
 * SldDiagramSvg — Single Line Diagram for Aurora preset.
 *
 * Shows the electrical flow path:
 *   PV Array → DC Cable → DCDB → Inverter → ACDB → Net Meter → Grid / Home
 *
 * Pure SVG — no external images. Print-safe, B&W-readable.
 */

import type { ProposalLang } from "@/lib/proposal-i18n";

type Props = {
  lang: ProposalLang;
  systemKw: number;
  panels: number;
};

const NODE_W = 72;
const NODE_H = 56;
const GAP = 28;
const TOTAL_W = NODE_W * 7 + GAP * 6;
const TOTAL_H = 110;

type SldNode = {
  id: string;
  label: string;
  labelHi: string;
  sub: string;
  subHi: string;
  fill: string;
  stroke: string;
  textFill: string;
  subFill: string;
};

export function SldDiagramSvg({ lang, systemKw, panels }: Props) {
  const isHi = lang === "hi";

  const nodes: SldNode[] = [
    {
      id: "pv",
      label: "PV Array",
      labelHi: "PV सरणी",
      sub: `${panels} panels`,
      subHi: `${panels} पैनल`,
      fill: "#fef3c7",
      stroke: "#f59e0b",
      textFill: "#92400e",
      subFill: "#b45309",
    },
    {
      id: "dcdb",
      label: "DCDB",
      labelHi: "DCDB",
      sub: "DC protection",
      subHi: "DC सुरक्षा",
      fill: "#ede9fe",
      stroke: "#7c3aed",
      textFill: "#4c1d95",
      subFill: "#5b21b6",
    },
    {
      id: "inv",
      label: "Inverter",
      labelHi: "इन्वर्टर",
      sub: `${systemKw} kW`,
      subHi: `${systemKw} kW`,
      fill: "#e0e7ff",
      stroke: "#4338ca",
      textFill: "#1e1b4b",
      subFill: "#3730a3",
    },
    {
      id: "acdb",
      label: "ACDB",
      labelHi: "ACDB",
      sub: "AC protection",
      subHi: "AC सुरक्षा",
      fill: "#d1fae5",
      stroke: "#059669",
      textFill: "#064e3b",
      subFill: "#065f46",
    },
    {
      id: "meter",
      label: "Net Meter",
      labelHi: "नेट मीटर",
      sub: "Bidirectional",
      subHi: "द्विदिशीय",
      fill: "#e0f2fe",
      stroke: "#0284c7",
      textFill: "#0c4a6e",
      subFill: "#0369a1",
    },
    {
      id: "home",
      label: "Your Home",
      labelHi: "आपका घर",
      sub: "Load",
      subHi: "लोड",
      fill: "#f0fdf4",
      stroke: "#16a34a",
      textFill: "#14532d",
      subFill: "#166534",
    },
    {
      id: "grid",
      label: "Grid",
      labelHi: "ग्रिड",
      sub: "Export / import",
      subHi: "एक्सपोर्ट/इम्पोर्ट",
      fill: "#f1f5f9",
      stroke: "#64748b",
      textFill: "#1e293b",
      subFill: "#475569",
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
      width="100%"
      style={{ maxWidth: TOTAL_W, minWidth: 320 }}
      aria-label={isHi ? "सोलर सिस्टम का सिंगल लाइन डायग्राम" : "Solar system single line diagram"}
      role="img"
    >
      {nodes.map((node, i) => {
        const x = i * (NODE_W + GAP);
        const y = (TOTAL_H - NODE_H) / 2;

        return (
          <g key={node.id}>
            {/* Connecting arrow (not for first node) */}
            {i > 0 && (
              <g>
                <line
                  x1={x - GAP}
                  y1={TOTAL_H / 2}
                  x2={x - 8}
                  y2={TOTAL_H / 2}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray={node.id === "home" ? "4 3" : undefined}
                />
                {/* arrowhead tip at x-1 (just before the box border) */}
                <polygon
                  points={`${x - 8},${TOTAL_H / 2 - 4} ${x - 1},${TOTAL_H / 2} ${x - 8},${TOTAL_H / 2 + 4}`}
                  fill="#94a3b8"
                />
              </g>
            )}

            {/* Node box */}
            <rect
              x={x}
              y={y}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              fill={node.fill}
              stroke={node.stroke}
              strokeWidth="1.5"
            />

            {/* Label */}
            <text
              x={x + NODE_W / 2}
              y={y + 20}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={node.textFill}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {isHi ? node.labelHi : node.label}
            </text>

            {/* Sub label */}
            <text
              x={x + NODE_W / 2}
              y={y + 34}
              textAnchor="middle"
              fontSize="8.5"
              fill={node.subFill}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {isHi ? node.subHi : node.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
