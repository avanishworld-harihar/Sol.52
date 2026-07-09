"use client";

import type { ReactNode } from "react";
import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
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

function TermsPageChrome({
  continued,
  children,
}: {
  continued?: boolean;
  children: ReactNode;
}) {
  const { copy } = useEpGoldenLang();
  return (
    <>
      <div className="ep-gl-terms-accent" aria-hidden />
      <div className="ep-gl-section-tag">{continued ? copy.terms.tagContinued : copy.terms.tag}</div>
      <h2 className="ep-gl-terms-heading ep-gl-terms-heading--center">{copy.terms.heading}</h2>
      {children}
    </>
  );
}

/** Split across two fixed pages so content is not clipped by the 260mm sheet. */
export function EpTermsPages({ data }: Props) {
  const { copy } = useEpGoldenLang();

  return (
    <>
      <EpLuxuryPage className="ep-gl-terms-page">
        <TermsPageChrome>
          <div className="ep-gl-terms-columns">
            <section className="ep-gl-terms-block">
              <h3 className="ep-gl-terms-subhead">{copy.terms.general}</h3>
              <TermsBulletList items={data.terms_conditions} variant="diamond" />
            </section>

            <section className="ep-gl-terms-block">
              <h3 className="ep-gl-terms-subhead">{copy.terms.documents}</h3>
              <TermsBulletList items={data.documents_required} variant="disc" />
            </section>

            <section className="ep-gl-terms-block">
              <h3 className="ep-gl-terms-subhead">{copy.terms.amcScope}</h3>
              <p className="ep-gl-terms-para">{data.amc_objective}</p>
              <TermsBulletList items={data.amc_scope} variant="disc" />
            </section>
          </div>
        </TermsPageChrome>
      </EpLuxuryPage>

      <EpLuxuryPage className="ep-gl-terms-page ep-gl-terms-page--continued">
        <TermsPageChrome continued>
          <div className="ep-gl-terms-columns ep-gl-terms-columns--single-focus">
            <section className="ep-gl-terms-block">
              <h3 className="ep-gl-terms-subhead">{copy.terms.clientScope}</h3>
              <TermsBulletList items={data.client_scope} variant="disc" />
            </section>

            <section className="ep-gl-terms-block">
              <h3 className="ep-gl-terms-subhead">{copy.terms.amcCost}</h3>
              <p className="ep-gl-terms-para ep-gl-terms-para--emphasis">{data.amc_cost_paragraph}</p>
              <TermsBulletList items={data.amc_terms} variant="diamond" />
            </section>
          </div>

          <div className="ep-gl-terms-signoff">
            <p className="ep-gl-terms-regards">{copy.terms.regards}</p>
            <p className="ep-gl-terms-company">{data.installer_name}</p>
          </div>
        </TermsPageChrome>
      </EpLuxuryPage>
    </>
  );
}
