import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { EditorialTermsModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: EditorialTermsModel;
};

function TermsBulletList({ items, variant = "diamond" }: { items: string[]; variant?: "diamond" | "disc" }) {
  return (
    <ul className={`ep-gl-terms-list ep-gl-terms-list--${variant}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function EpTermsPages({ data }: Props) {
  return (
    <>
      <EpLuxuryPage className="ep-gl-terms-page">
        <div className="ep-gl-terms-accent" aria-hidden />
        <div className="ep-gl-section-tag">06 / Terms & Compliance</div>

        <h2 className="ep-gl-terms-heading ep-gl-terms-heading--center">Terms &amp; Conditions</h2>
        <TermsBulletList items={data.terms_conditions} variant="diamond" />

        <h2 className="ep-gl-terms-heading">Documents Required</h2>
        <TermsBulletList items={data.documents_required} variant="disc" />

        <h2 className="ep-gl-terms-heading ep-gl-terms-heading--center">Annual Maintenance Service</h2>
        <p className="ep-gl-terms-subhead">Objective</p>
        <p className="ep-gl-terms-para">{data.amc_objective}</p>
        <p className="ep-gl-terms-subhead">Scope of Services</p>
        <TermsBulletList items={data.amc_scope} variant="disc" />
      </EpLuxuryPage>

      <EpLuxuryPage className="ep-gl-terms-page">
        <div className="ep-gl-terms-accent" aria-hidden />
        <div className="ep-gl-section-tag">07 / O&amp;M Agreement</div>

        <p className="ep-gl-terms-subhead">Client&apos;s Scope</p>
        <p className="ep-gl-terms-lead">The following remain in the client&apos;s scope:</p>
        <TermsBulletList items={data.client_scope} variant="disc" />

        <h2 className="ep-gl-terms-heading ep-gl-terms-heading--center">Cost of Maintenance Service</h2>
        <p className="ep-gl-terms-para ep-gl-terms-para--emphasis">{data.amc_cost_paragraph}</p>
        <TermsBulletList items={data.amc_terms} variant="diamond" />

        <div className="ep-gl-terms-signoff">
          <p className="ep-gl-terms-regards">Regards,</p>
          <p className="ep-gl-terms-company">{data.installer_name}</p>
        </div>
      </EpLuxuryPage>
    </>
  );
}
