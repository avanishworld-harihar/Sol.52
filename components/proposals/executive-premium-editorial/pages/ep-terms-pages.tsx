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
    <EpLuxuryPage className="ep-gl-terms-page">
      <div className="ep-gl-terms-accent" aria-hidden />
      <div className="ep-gl-section-tag">09 / Terms & Compliance</div>
      <h2 className="ep-gl-terms-heading ep-gl-terms-heading--center">Terms &amp; Conditions</h2>

      <div className="ep-gl-terms-columns">
        <section className="ep-gl-terms-block">
          <h3 className="ep-gl-terms-subhead">General Terms</h3>
          <TermsBulletList items={data.terms_conditions} variant="diamond" />
        </section>

        <section className="ep-gl-terms-block">
          <h3 className="ep-gl-terms-subhead">Documents Required</h3>
          <TermsBulletList items={data.documents_required} variant="disc" />
        </section>

        <section className="ep-gl-terms-block">
          <h3 className="ep-gl-terms-subhead">Annual Maintenance — Scope</h3>
          <p className="ep-gl-terms-para">{data.amc_objective}</p>
          <TermsBulletList items={data.amc_scope} variant="disc" />
        </section>

        <section className="ep-gl-terms-block">
          <h3 className="ep-gl-terms-subhead">Client&apos;s Scope</h3>
          <TermsBulletList items={data.client_scope} variant="disc" />
        </section>

        <section className="ep-gl-terms-block">
          <h3 className="ep-gl-terms-subhead">Cost of Maintenance</h3>
          <p className="ep-gl-terms-para ep-gl-terms-para--emphasis">{data.amc_cost_paragraph}</p>
          <TermsBulletList items={data.amc_terms} variant="diamond" />
        </section>
      </div>

      <div className="ep-gl-terms-signoff">
        <p className="ep-gl-terms-regards">Regards,</p>
        <p className="ep-gl-terms-company">{data.installer_name}</p>
      </div>
    </EpLuxuryPage>
  );
}
