import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { EditorialBomRow } from "@/lib/executive-premium-editorial/types";

type Props = {
  bomRows: EditorialBomRow[];
};

export function EpBomPage({ bomRows }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">06 / Hardware Intelligence</div>
      <h1 className="ep-gl-h1">System Parts.</h1>
      <p className="ep-gl-lead" style={{ marginBottom: "20px" }}>
        Tier-1 components with full engineering specification — make, standards, and warranty as
        quoted for your system.
      </p>

      <div className="ep-gl-manifest-list">
        {bomRows.map((row, i) => {
          const isLast = i === bomRows.length - 1;
          return (
            <div key={row.name} className="ep-gl-manifest-row">
              <div className="ep-gl-manifest-left" style={isLast ? { borderBottom: "none" } : undefined}>
                <p className="ep-gl-manifest-comp">{row.name}</p>
                <p className="ep-gl-manifest-brand">{row.brand}</p>
                <p className="ep-gl-manifest-warr">{row.warranty}</p>
              </div>
              <div className="ep-gl-manifest-right" style={isLast ? { borderBottom: "none" } : undefined}>
                <p className="ep-gl-manifest-spec">{row.spec}</p>
                <ul className="ep-gl-manifest-tech">
                  {row.technical_points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <p className="ep-gl-manifest-desc">{row.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </EpLuxuryPage>
  );
}
