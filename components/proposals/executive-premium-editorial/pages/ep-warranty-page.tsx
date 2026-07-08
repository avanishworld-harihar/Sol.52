import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type {
  EditorialWarrantyHighlightIcon,
  EditorialWarrantyModel,
} from "@/lib/executive-premium-editorial/types";

type Props = {
  data: EditorialWarrantyModel;
};

function WarrantyIcon({ name }: { name: EditorialWarrantyHighlightIcon }) {
  const common = {
    width: 34,
    height: 34,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "shield":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "panel":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="4" width="18" height="12" rx="1" />
          <path d="M3 8h18M3 12h18M9 4v12M15 4v12M12 16v4M8 20h8" />
        </svg>
      );
    case "structure":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 20h18M5 20v-8l7-4 7 4v8M9 20v-5h6v5" />
        </svg>
      );
    case "support":
    default:
      return (
        <svg {...common} aria-hidden>
          <path d="M4 12a8 8 0 0 1 16 0" />
          <rect x="2.5" y="12" width="4" height="6" rx="1.2" />
          <rect x="17.5" y="12" width="4" height="6" rx="1.2" />
          <path d="M20 18v1a3 3 0 0 1-3 3h-3" />
        </svg>
      );
  }
}

export function EpWarrantyPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">07 / Warranty &amp; Assurance</div>
      <h1 className="ep-gl-h1">Warranty Matrix.</h1>
      <p className="ep-gl-lead">{data.intro}</p>

      <div className="ep-gl-warranty-hero">
        {data.highlights.map((h) => (
          <div key={h.label} className="ep-gl-warranty-card">
            <div className="ep-gl-warranty-card-icon">
              <WarrantyIcon name={h.icon} />
            </div>
            <div className="ep-gl-warranty-card-value">
              {h.value}
              <span className="ep-gl-warranty-card-unit">{h.unit}</span>
            </div>
            <div className="ep-gl-warranty-card-label">{h.label}</div>
          </div>
        ))}
      </div>

      <table className="ep-gl-warranty-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Duration</th>
            <th>By</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.item}>
              <td className="ep-gl-warranty-item">{row.item}</td>
              <td>{row.duration}</td>
              <td>{row.by}</td>
              <td className="ep-gl-warranty-cov">{row.coverage}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ep-gl-warranty-notes">
        <p>
          <strong>Claims:</strong> Contact our service desk for manufacturer defects. Physical
          damage, vandalism, or misuse is excluded.
        </p>
        <p>
          <strong>Your care:</strong> Routine panel cleaning, safe roof access, and internet for
          remote monitoring where applicable.
        </p>
      </div>
    </EpLuxuryPage>
  );
}
