"use client";

/**
 * Zenith — light editorial proposal (EN/HI + print).
 * Data: ProposalData only — does not import Golden transform/CSS.
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
} from "@/lib/proposal-branding-settings";
import { getZenithCopy, type ZenithLang } from "./zenith-copy";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";
import styles from "./zenith.module.css";

const ZENITH_COVER_PHOTO = "/assets/proposals/zenith-cover-luxury-rooftop.jpg";

export type ZenithProposalRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

function BrandLockup({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]!;
    const first = parts.slice(0, -1).join(" ");
    return (
      <div className={styles.brandHarihar}>
        {first.toUpperCase()} <span className={styles.brandGold}>{last.toUpperCase()}</span>
      </div>
    );
  }
  return <div className={styles.brandHarihar}>{name.toUpperCase()}</div>;
}

function Pending({ title, hint }: { title: string; hint: string }) {
  return (
    <div className={styles.pending}>
      <p className={styles.pendingLabel}>Pending</p>
      <p className={styles.pendingText}>{title}</p>
      <p className={styles.pendingHint}>{hint}</p>
    </div>
  );
}

function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.goldRule} aria-hidden />
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </>
  );
}

function metricValue(data: ProposalData, re: RegExp, fallback: string): string {
  const hit = data.engineering.metrics.find((m) => re.test(m.label));
  return hit?.value || fallback;
}

export function ZenithProposalRenderer({
  data,
  installerLogoUrl,
}: ZenithProposalRendererProps) {
  const [lang, setLang] = useState<ZenithLang>("en");
  const c = getZenithCopy(lang);
  const isHi = lang === "hi";

  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return data?.meta.brandLogoUrl?.trim() || installerLogoUrl?.trim() || undefined;
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const sync = () => {
      const fromData = data?.meta.brandLogoUrl?.trim() ?? "";
      const fromProp = installerLogoUrl?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setLogoUrl(fromData || fromProp || fromLocal || undefined);
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [data?.meta.brandLogoUrl, installerLogoUrl]);

  if (!data) {
    return <div className={styles.loading}>Loading Proposal...</div>;
  }

  const brand = data.meta.brandName?.trim() || "Solar Partner";
  const brandConfig = resolveProposalBrandConfig({
    pptInput: {
      brandDisplayMode: data.meta.brandDisplayMode,
      brandSectionConfig: data.meta.brandSectionConfig,
    },
  });
  const brandIdentity = {
    installerName: brand,
    logoUrl,
    tagline: data.meta.brandTagline,
  };
  const coverBrand = resolveProposalBrandPresentation(brandConfig, "cover", brandIdentity);
  const closingBrand = resolveProposalBrandPresentation(brandConfig, "closing", brandIdentity);
  const customer = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "";
  const eco = data.economics;
  const bill = data.bill;
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const eng = data.engineering;
  const warranty = data.warranty;
  const execution = data.execution;
  const terms = data.terms;
  const impact = data.impact;
  const closing = data.closing;

  const capacity =
    data.meta.systemKw > 0
      ? `${data.meta.systemKw} kW`
      : metricValue(data, /system\s*size|capacity/i, "—");
  const generation =
    closing.annualUnits > 0
      ? `${closing.annualUnits.toLocaleString("en-IN")} units`
      : metricValue(data, /annual|generation|units/i, "—");
  const coverage = metricValue(data, /load|coverage/i, "—");
  const showBill = bill.hasData && bill.months.length > 0;

  const hasFinancing = eco.emiRows.length > 0;
  const hasImpact =
    impact.co2Tons > 0 || impact.treesEquivalent > 0 || closing.annualSavingsInr > 0;
  const hasEngineering = eng.metrics.length > 0 || eng.standards.length > 0;
  const hasBom = bom.length > 0;
  const hasWarranty = warranty.highlights.length > 0 || warranty.rows.length > 0;
  const hasExecution = execution.steps.length > 0;
  const hasPayment =
    execution.payments.length > 0 ||
    Boolean(execution.bank.company || execution.bank.accountNumber || execution.bank.upiId);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(await buildAtelierProposalPdf({
          root: rootRef.current,
          customerName: customer,
          presetId: "residential_zenith",
          pageSelector: ":scope > section",
        }));
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  return (
    <div ref={rootRef} data-proposal-preset="residential_zenith" className={`${styles.shell}${isHi ? ` ${styles.langHi}` : ""}`}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>{brand}</span>
          <div className={styles.printBarActions}>
            <div className={styles.langToggle} role="group" aria-label="Language">
              <button
                type="button"
                className={`${styles.langBtn}${lang === "en" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                {c.print.langEn}
              </button>
              <button
                type="button"
                className={`${styles.langBtn}${lang === "hi" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("hi")}
                aria-pressed={lang === "hi"}
              >
                {c.print.langHi}
              </button>
            </div>
            <button type="button" onClick={handlePrint} className={styles.printBarBtn}>
              {c.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.presetZenith}>
        {/* 1 — Cover (brand-first; no project cost on first page) */}
        <section className={`${styles.page} ${styles.pageCover}`}>
          <div className={styles.coverStage}>
            <div className={styles.coverTop}>
              {coverBrand.showLogo && logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brand} className={styles.logo} />
              ) : (
                <span className={styles.coverBadge}>{c.cover.proposalLabel}</span>
              )}
              {coverBrand.showLogo && logoUrl ? (
                <span className={styles.coverBadge}>{c.cover.proposalLabel}</span>
              ) : null}
            </div>

            <div className={styles.coverHero}>
              {coverBrand.showName ? <BrandLockup name={brand} /> : null}
              {coverBrand.showTagline && data.meta.brandTagline ? (
                <p className={styles.heroSub}>{data.meta.brandTagline}</p>
              ) : null}
              <figure className={styles.coverVisual}>
                <div className={styles.coverPhotoFrame}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ZENITH_COVER_PHOTO}
                    alt={c.cover.photoTitle}
                    className={styles.coverPhotoImg}
                  />
                  <div className={styles.coverPhotoScrim} aria-hidden />
                </div>
                <figcaption className={styles.coverPhotoCaption}>
                  <span className={styles.coverPhotoTitle}>{c.cover.photoTitle}</span>
                  <span className={styles.coverPhotoSub}>{c.cover.photoSub}</span>
                </figcaption>
              </figure>
              <div className={styles.coverAccent} aria-hidden />
              <h1 className={styles.heroTitle}>{c.cover.hero}</h1>
              <p className={styles.heroSub}>{c.cover.sub}</p>
              {capacity !== "—" || generation !== "—" ? (
                <p className={styles.heroMeta}>
                  {[capacity !== "—" ? capacity : null, generation !== "—" ? generation : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </div>

          <div className={styles.coverClient}>
            <p className={styles.cardLabel}>{c.cover.preparedFor}</p>
            <p className={styles.coverClientName}>{customer}</p>
            {location ? <p className={styles.coverClientLoc}>{location}</p> : null}
            {data.meta.assetProfileLine ? (
              <p className={styles.coverClientLoc}>{data.meta.assetProfileLine}</p>
            ) : null}
          </div>
        </section>

        {/* 2 — Bill / Requirement */}
        <section className={styles.page}>
          {showBill ? (
            <>
              <PageHeader title={c.pages.bill} lead={c.pages.billLead} />
              <div className={styles.strip}>
                <div className={styles.stripCell}>
                  <span className={styles.stripLabel}>{c.labels.yearlyBill}</span>
                  <span className={styles.stripValue}>
                    {formatInrCompact(bill.yearlyBillInr)}
                  </span>
                </div>
                <div className={styles.stripCell}>
                  <span className={styles.stripLabel}>{c.labels.summerShare}</span>
                  <span className={`${styles.stripValue} ${styles.stripValueGold}`}>
                    {Math.round(bill.summerTrapPct)}%
                  </span>
                </div>
                <div className={styles.stripCell}>
                  <span className={styles.stripLabel}>{c.labels.solarOffset}</span>
                  <span className={styles.stripValue}>
                    {Math.round(bill.solarSavingsPct)}%
                  </span>
                </div>
              </div>
              <div className={styles.barChart} aria-hidden>
                {bill.months.map((m) => (
                  <div key={m.label} className={styles.barCol}>
                    <div
                      className={`${styles.bar} ${m.isSummerPeak ? styles.barPeak : ""}`}
                      style={{ height: `${Math.max(8, m.barHeightPct)}%` }}
                    />
                    <span className={styles.barLabel}>{m.label}</span>
                  </div>
                ))}
              </div>
              <p className={styles.ledgerNote}>
                {c.labels.totalUnits}:{" "}
                <strong>{bill.totals.units.toLocaleString("en-IN")}</strong>
                {" · "}
                {c.labels.totalNet}:{" "}
                <strong>{formatInr(bill.totals.netInr)}</strong>
                {bill.fixedChargesDisplay
                  ? ` · ${c.labels.fixedCharges}: ${bill.fixedChargesDisplay}`
                  : ""}
              </p>
            </>
          ) : (
            <>
              <PageHeader title={c.pages.requirement} lead={c.pages.requirementLead} />
              <div className={styles.strip}>
                <div className={styles.stripCell}>
                  <span className={styles.stripLabel}>{c.labels.capacity}</span>
                  <span className={styles.stripValue}>{capacity}</span>
                </div>
                <div className={styles.stripCell}>
                  <span className={styles.stripLabel}>{c.labels.annualGen}</span>
                  <span className={styles.stripValue}>{generation}</span>
                </div>
                <div className={styles.stripCell}>
                  <span className={styles.stripLabel}>{c.labels.loadCoverage}</span>
                  <span className={styles.stripValue}>{coverage}</span>
                </div>
              </div>
              {data.meta.assetProfileLine ? (
                <p className={styles.ledgerNote}>{data.meta.assetProfileLine}</p>
              ) : null}
            </>
          )}
        </section>

        {/* 3 — Investment story: Gross − Subsidy = Net */}
        <section className={styles.page}>
          <PageHeader title={c.pages.investment} lead={c.pages.investmentLead} />

          <div className={styles.ledger} aria-label={c.pages.investment}>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerTag}>{c.labels.grossCost}</span>
              <span className={styles.ledgerVal}>
                {eco.grossInr > 0 ? formatInr(eco.grossInr) : "—"}
              </span>
            </div>
            <span className={styles.ledgerOp} aria-hidden>
              {c.pages.minus}
            </span>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerTag}>{c.labels.subsidy}</span>
              <span className={`${styles.ledgerVal} ${styles.ledgerValGreen}`}>
                {eco.subsidyInr > 0 ? formatInr(eco.subsidyInr) : "—"}
              </span>
            </div>
            <span className={styles.ledgerOp} aria-hidden>
              {c.pages.equals}
            </span>
            <div className={`${styles.ledgerItem} ${styles.ledgerItemFinal}`}>
              <span className={styles.ledgerTag}>{c.pages.youPay}</span>
              <span className={styles.ledgerVal}>
                {eco.netInr > 0 ? formatInr(eco.netInr) : "—"}
              </span>
            </div>
          </div>
          <p className={styles.ledgerNote}>{c.pages.equationNote}</p>

          <h3 className={styles.subTitle} style={{ marginTop: "1.75rem" }}>
            {c.pages.outcomes}
          </h3>
          <div className={styles.strip}>
            <div className={styles.stripCell}>
              <span className={styles.stripLabel}>{c.labels.monthlySavings}</span>
              <span className={styles.stripValue}>
                {eco.monthlySavingsInr > 0 ? formatInr(eco.monthlySavingsInr) : "—"}
              </span>
            </div>
            <div className={styles.stripCell}>
              <span className={styles.stripLabel}>{c.labels.payback}</span>
              <span className={`${styles.stripValue} ${styles.stripValueGold}`}>
                {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} Yrs` : "—"}
              </span>
            </div>
            <div className={styles.stripCell}>
              <span className={styles.stripLabel}>{c.labels.lifetimeBenefit}</span>
              <span className={`${styles.stripValue} ${styles.stripValueGold}`}>
                {eco.lifetimeProfitInr > 0
                  ? formatLifetimeBenefitInr(eco.lifetimeProfitInr)
                  : "—"}
              </span>
            </div>
          </div>

          {hasFinancing ? (
            <div className={styles.sectionBlock}>
              <h3 className={styles.subTitle}>{c.pages.financing}</h3>
              <p className={styles.lead}>{c.pages.financingLead}</p>
              <table className={styles.lineTable}>
                <thead>
                  <tr>
                    <th>{c.pages.tenure}</th>
                    <th>{c.pages.monthlyEmi}</th>
                    <th>{c.labels.interestPaid}</th>
                  </tr>
                </thead>
                <tbody>
                  {eco.emiRows.map((row) => (
                    <tr key={row.tenureLabel}>
                      <td className={styles.lineName}>{row.tenureLabel}</td>
                      <td className={styles.lineEm}>{formatInr(row.monthlyEmiInr)}</td>
                      <td className={styles.lineMuted}>{formatInr(row.interestPaidInr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {hasImpact ? (
            <p className={styles.impactLine}>
              {c.pages.impact}:{" "}
              {impact.co2Tons > 0 ? (
                <>
                  <strong>
                    {impact.co2Tons.toFixed(0)} t {c.labels.co2}
                  </strong>
                  {" · "}
                </>
              ) : null}
              {impact.treesEquivalent > 0 ? (
                <>
                  <strong>{impact.treesEquivalent.toLocaleString("en-IN")}</strong>{" "}
                  {c.labels.trees}
                  {" · "}
                </>
              ) : null}
              {closing.annualSavingsInr > 0 ? (
                <>
                  <strong>{formatInrCompact(closing.annualSavingsInr)}</strong>{" "}
                  {c.labels.annualSavings}
                </>
              ) : null}
            </p>
          ) : null}
        </section>

        {/* 4 — Engineering (skip if empty) */}
        {hasEngineering ? (
          <section className={styles.page}>
            <PageHeader
              title={c.pages.engineering}
              lead={eng.tiltNote || c.pages.engineeringLead}
            />
            {eng.metrics.length > 0 ? (
              <div className={styles.strip} style={{ gridTemplateColumns: `repeat(${Math.min(eng.metrics.length, 3)}, minmax(0, 1fr))` }}>
                {eng.metrics.slice(0, 6).map((m) => (
                  <div key={m.label} className={styles.stripCell}>
                    <span className={styles.stripLabel}>{m.label}</span>
                    <span className={styles.stripValue}>{m.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {eng.standards.length > 0 ? (
              <p className={styles.standards}>
                {c.pages.standards} · {eng.standards.join(" · ")}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* 5 — BOM */}
        {hasBom ? (
          <section className={`${styles.page} ${styles.pageBom}`}>
            <PageHeader title={c.pages.assurance} lead={c.pages.assuranceLead} />
            <table className={styles.lineTable}>
              <thead>
                <tr>
                  <th>{c.pages.component}</th>
                  <th>{c.pages.brandSpec}</th>
                  <th>{c.labels.warranty}</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, i) => (
                  <tr key={`${item.name}-${i}`}>
                    <td>
                      <div className={styles.lineName}>{item.name}</div>
                      {item.description ? (
                        <div className={styles.lineMuted}>{item.description}</div>
                      ) : null}
                    </td>
                    <td className={styles.lineMuted}>
                      {[item.brand, item.spec].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className={styles.lineEm}>{item.warranty || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* 5b — Warranty Matrix (own page — avoids orphan table rows) */}
        {hasWarranty ? (
          <section className={`${styles.page} ${styles.pageWarranty}`}>
            <PageHeader title={c.pages.warranty} lead={c.pages.warrantyLead} />
            {warranty.highlights.length > 0 ? (
              <div className={styles.strip}>
                {warranty.highlights.slice(0, 3).map((h) => (
                  <div key={h.label} className={styles.stripCell}>
                    <span className={styles.stripLabel}>{h.label}</span>
                    <span className={`${styles.stripValue} ${styles.stripValueGold}`}>
                      {h.value}
                      {h.unit ? ` ${h.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            {warranty.rows.length > 0 ? (
              <table className={`${styles.lineTable} ${styles.lineTableSpaced}`}>
                <thead>
                  <tr>
                    <th>{c.pages.component}</th>
                    <th>{c.pages.coverage}</th>
                    <th>{c.labels.warranty}</th>
                  </tr>
                </thead>
                <tbody>
                  {warranty.rows.map((row) => (
                    <tr key={`${row.item}-${row.duration}`}>
                      <td className={styles.lineName}>{row.item}</td>
                      <td className={styles.lineMuted}>{row.coverage}</td>
                      <td className={styles.lineEm}>{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>
        ) : null}

        {/* 6 — Execution */}
        {hasExecution ? (
          <section className={styles.page}>
            <PageHeader title={c.pages.execution} lead={c.pages.executionLead} />
            <ol className={styles.stepList}>
              {execution.steps.map((s) => (
                <li key={s.num} className={styles.stepItem}>
                  <span className={styles.stepNum}>{s.num}</span>
                  <div>
                    <p className={styles.stepTitle}>{s.title}</p>
                    <p className={styles.stepDesc}>{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* 7 — Payment */}
        {hasPayment ? (
          <section className={styles.page}>
            <PageHeader title={c.pages.payment} lead={c.pages.paymentLead} />
            {execution.payments.length > 0 ? (
              <table className={styles.lineTable}>
                <thead>
                  <tr>
                    <th>{c.pages.milestone}</th>
                    <th>%</th>
                    <th>{c.pages.amount}</th>
                  </tr>
                </thead>
                <tbody>
                  {execution.payments.map((p) => (
                    <tr key={p.label}>
                      <td className={styles.lineName}>{p.label}</td>
                      <td className={styles.lineMuted}>{p.pctLabel || "—"}</td>
                      <td className={styles.lineEm}>{formatInr(p.amountInr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {(execution.bank.company ||
              execution.bank.accountNumber ||
              execution.bank.upiId) && (
              <div className={styles.bankCard}>
                <span className={styles.cardLabel}>{c.pages.bankDetails}</span>
                {execution.bank.company ? (
                  <p className={styles.bankLine}>{execution.bank.company}</p>
                ) : null}
                {execution.bank.accountNumber ? (
                  <p className={styles.bankLine}>A/C {execution.bank.accountNumber}</p>
                ) : null}
                {execution.bank.ifsc ? (
                  <p className={styles.bankLine}>IFSC {execution.bank.ifsc}</p>
                ) : null}
                {execution.bank.upiId ? (
                  <p className={styles.bankLine}>UPI {execution.bank.upiId}</p>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {/* Terms — clear numbered conditions */}
        <section className={styles.page}>
          <PageHeader title={c.pages.terms} lead={c.terms.validityHint} />

          <div className={styles.termsBlock}>
            <h3 className={styles.subTitle}>{c.pages.generalTerms}</h3>
            {terms.conditions.length > 0 ? (
              <ol className={styles.termsList}>
                {terms.conditions.map((item, i) => (
                  <li key={item} className={styles.termsItem}>
                    <span className={styles.termsNum}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className={styles.termsText}>{item}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <Pending
                title="Terms pending"
                hint="Proposal validity and commercial terms will appear when finalized."
              />
            )}
          </div>

          <div className={styles.termsBlock}>
            <h3 className={styles.subTitle}>{c.pages.documents}</h3>
            <p className={styles.termsHint}>{c.terms.docHint}</p>
            {terms.documents.length > 0 ? (
              <ul className={styles.docList}>
                {terms.documents.map((d) => (
                  <li key={d} className={styles.docItem}>
                    <span className={styles.docTick} aria-hidden>
                      ✓
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Pending
                title="Document checklist pending"
                hint="Identity, bill, and ownership documents will list here."
              />
            )}
          </div>

          <div className={styles.termsBlock}>
            <h3 className={styles.subTitle}>{c.pages.amcScope}</h3>
            <p className={styles.termsHint}>{c.terms.amcHint}</p>
            {terms.amcObjective ? (
              <p className={styles.amcObjective}>{terms.amcObjective}</p>
            ) : null}
            {terms.amcScope.length > 0 ? (
              <ul className={styles.docList}>
                {terms.amcScope.map((a) => (
                  <li key={a} className={styles.docItem}>
                    <span className={styles.docTick} aria-hidden>
                      ·
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {terms.amcTerms.length > 0 ? (
              <ul className={styles.docList}>
                {terms.amcTerms.map((t) => (
                  <li key={t} className={`${styles.docItem} ${styles.docItemNote}`}>
                    <span className={styles.docTick} aria-hidden>
                      !
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        {/* Closing — light last page */}
        <section className={`${styles.page} ${styles.pageClosing}`}>
          <div>
            <p className={styles.closingTag}>{c.closing.tag}</p>
            <div className={styles.goldRule} aria-hidden />
            <h2 className={styles.closingTitle}>{c.closing.title}</h2>
            <p className={styles.closingBody}>{c.closing.body}</p>
            <p className={styles.closingFor}>
              {c.pages.preparedBy(
                closing.customerName || customer,
                closing.installerName || brand
              )}
            </p>
          </div>

          <div className={styles.closingStats}>
            <div className={styles.closingStat}>
              <span className={styles.closingStatLabel}>{c.labels.annualUnits}</span>
              <span className={styles.closingStatValue}>
                {closing.annualUnits > 0
                  ? closing.annualUnits.toLocaleString("en-IN")
                  : "—"}
              </span>
            </div>
            <div className={styles.closingStat}>
              <span className={styles.closingStatLabel}>{c.labels.netPayable}</span>
              <span className={styles.closingStatValue}>
                {eco.netInr > 0 ? formatInr(eco.netInr) : "—"}
              </span>
            </div>
            <div className={`${styles.closingStat} ${styles.closingStatAccent}`}>
              <span className={styles.closingStatLabel}>{c.labels.lifetimeWealth}</span>
              <span className={styles.closingStatValue}>
                {formatLifetimeBenefitInr(
                  closing.lifetimeWealthInr || eco.lifetimeProfitInr
                )}
              </span>
            </div>
          </div>

          <div className={styles.closingFooter}>
            <div>
              <p className={styles.cardLabel}>{c.closing.contact}</p>
              {closingBrand.showLogo && logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brand} className={styles.logo} style={{ maxHeight: 36, marginBottom: 8 }} />
              ) : null}
              {closingBrand.showName ? (
                <p className={styles.closingBrand}>{closing.installerName || brand}</p>
              ) : null}
              {closingBrand.showTagline && (closing.brandTagline || data.meta.brandTagline) ? (
                <p className={styles.closingContact}>
                  {closing.brandTagline || data.meta.brandTagline}
                </p>
              ) : null}
              {closing.contactLine ? (
                <p className={styles.closingContact}>{closing.contactLine}</p>
              ) : null}
              {(closing.address || data.meta.brandAddress) ? (
                <p className={styles.closingContact}>{closing.address || data.meta.brandAddress}</p>
              ) : null}
              {(closing.gstNumber || data.meta.brandGst) ? (
                <p className={styles.closingContact}>
                  GSTIN {closing.gstNumber || data.meta.brandGst}
                </p>
              ) : null}
              {closing.contactPerson ? (
                <p className={styles.closingContact}>{closing.contactPerson}</p>
              ) : null}
            </div>
            {closing.qrUrl ? (
              <div className={styles.qrWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={closing.qrUrl} alt="Payment / contact QR" className={styles.qrImg} />
                <span className={styles.cardLabel}>{c.labels.scan}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ZenithProposalRenderer;
