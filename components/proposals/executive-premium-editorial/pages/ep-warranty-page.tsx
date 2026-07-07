import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { EditorialWarrantyModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: EditorialWarrantyModel;
};

export function EpWarrantyPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">07 / Warranty &amp; Assurance</div>
      <h1 className="ep-gl-h1">Warranty Matrix.</h1>
      <p className="ep-gl-lead">{data.intro}</p>

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
