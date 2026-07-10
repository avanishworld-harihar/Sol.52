"use client";

/**
 * Zenith Luxury — world-class brochure.
 * Toolbar · EN/HI · EMI · QR/WhatsApp · print A4 · hide empty · cover atmosphere
 */

import { useEffect, useMemo, useState } from "react";
import { Download, Languages, MessageCircle } from "lucide-react";
import type { ProposalData } from "@/lib/proposal-data";
import type { ProposalLang } from "@/lib/proposal-i18n";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { zenithCopy } from "@/components/proposals/zenith/zenith-i18n";
import styles from "./zenith.module.css";

export type ZenithProposalRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

function warrantyClass(warranty: string): string {
  const years = Number((warranty.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if (Number.isFinite(years) && years >= 25) return styles.textEmerald;
  if (/25|30/.test(warranty)) return styles.textEmerald;
  return styles.textGold;
}

function BrandLockup({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]!;
    const first = parts.slice(0, -1).join(" ");
    return (
      <h1 className={styles.brandHarihar}>
        {first.toUpperCase()} <span className={styles.brandSub}>{last.toUpperCase()}</span>
      </h1>
    );
  }
  return <h1 className={styles.brandHarihar}>{name.toUpperCase()}</h1>;
}

/** Digits-only WhatsApp deep link from a contact line, if a phone is present. */
function whatsappHref(contactLine: string): string | null {
  const digits = contactLine.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const phone = digits.length === 10 ? `91${digits}` : digits;
  if (phone.length < 11 || phone.length > 15) return null;
  return `https://wa.me/${phone}`;
}

export function ZenithProposalRenderer({
  data,
  installerLogoUrl,
}: ZenithProposalRendererProps) {
  const [lang, setLang] = useState<ProposalLang>("en");
  const copy = useMemo(() => zenithCopy(lang), [lang]);

  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return data?.meta.brandLogoUrl?.trim() || installerLogoUrl?.trim() || undefined;
  });

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

  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const customer = data.meta.customerName?.trim() || (lang === "hi" ? "आपके घर" : "your home");
  const lifetime =
    data.economics.lifetimeProfitInr > 0
      ? formatLifetimeBenefitInr(data.economics.lifetimeProfitInr)
      : lang === "hi"
        ? "दीर्घकालिक संपत्ति"
        : "long-term wealth";
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const eco = data.economics;
  const bill = data.bill;
  const eng = data.engineering;
  const execution = data.execution;
  const terms = data.terms;
  const closing = data.closing;
  const impact = data.impact;
  const wa = whatsappHref(closing.contactLine || "");
  const qrUrl = closing.qrUrl?.trim() || undefined;
  const showBill = bill.hasData && bill.months.length > 0;
  const showImpact = impact.co2Tons > 0 || impact.treesEquivalent > 0;
  const showEng = eng.metrics.length > 0;
  const showBom = bom.length > 0;
  const showExecution = execution.steps.length > 0 || execution.payments.length > 0;
  const showTerms = terms.conditions.length > 0 || terms.documents.length > 0;
  const showEmi = eco.emiRows.length > 0;

  return (
    <div className={styles.shell}>
      <div className={`${styles.presetZenith}${lang === "hi" ? ` ${styles.langHi}` : ""}`}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <p className={styles.toolbarLabel}>{copy.toolbar.preset}</p>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.toolbarBtnGhost}
              onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
            >
              <Languages className={styles.toolbarIcon} aria-hidden />
              {copy.toolbar.langToggle}
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
            >
              <Download className={styles.toolbarIcon} aria-hidden />
              {copy.toolbar.printPdf}
            </button>
          </div>
        </div>

        {/* Page 1 — Hero */}
        <section className={`${styles.section} ${styles.coverCentered}`}>
          <div className={styles.coverAtmosphere} aria-hidden />
          <div className={styles.coverGoldLine} aria-hidden />
          <div className={styles.coverBrand}>
            {logoUrl ? (
              <img src={logoUrl} alt={brand} className={styles.coverLogo} />
            ) : null}
            <BrandLockup name={brand} />
          </div>
          <h2 className={styles.heroTitle}>{copy.hero.title}</h2>
          <p className={styles.heroSub}>{copy.hero.sub(lifetime, customer)}</p>
          {(data.meta.systemKw > 0 || data.meta.locationLine) && (
            <p className={styles.coverMeta}>
              {data.meta.systemKw > 0 ? `${data.meta.systemKw} kW` : null}
              {data.meta.systemKw > 0 && data.meta.locationLine ? " · " : null}
              {data.meta.locationLine && data.meta.locationLine !== "—"
                ? data.meta.locationLine
                : null}
            </p>
          )}
        </section>

        {/* Bill */}
        {showBill ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{copy.bill.title}</h2>
            <p className={styles.sectionLead}>{copy.bill.lead}</p>
            <div className={styles.grid}>
              <div className={styles.techCard}>
                <p className={styles.cardLabel}>{copy.bill.yearly}</p>
                <p className={styles.cardValue}>{formatInrCompact(bill.yearlyBillInr)}</p>
              </div>
              <div className={styles.techCard}>
                <p className={styles.cardLabel}>{copy.bill.offset}</p>
                <p className={styles.cardValue}>{Math.round(bill.solarSavingsPct)}%</p>
              </div>
              <div className={styles.techCard}>
                <p className={styles.cardLabel}>{copy.bill.summer}</p>
                <p className={styles.cardValue}>{Math.round(bill.summerTrapPct)}%</p>
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
          </section>
        ) : null}

        {/* Investment Ledger + EMI */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{copy.investment.title}</h2>
          <p className={styles.sectionLead}>{copy.investment.lead}</p>
          <div className={styles.grid}>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.investment.gross}</p>
              <p className={styles.cardValue}>{formatInr(eco.grossInr)}</p>
            </div>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.investment.subsidy}</p>
              <p className={styles.cardValue}>{formatInr(eco.subsidyInr)}</p>
            </div>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.investment.net}</p>
              <p className={styles.cardValue}>{formatInr(eco.netInr)}</p>
            </div>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.investment.monthly}</p>
              <p className={styles.cardValue}>{formatInr(eco.monthlySavingsInr)}</p>
            </div>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.investment.payback}</p>
              <p className={styles.cardValue}>
                {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} Yrs` : "—"}
              </p>
            </div>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.investment.lifetime}</p>
              <p className={`${styles.cardValue} ${styles.textGold}`}>
                {formatLifetimeBenefitInr(eco.lifetimeProfitInr)}
              </p>
            </div>
          </div>
          {showEmi ? (
            <>
              <h3 className={styles.subTitle}>{copy.investment.emiTitle}</h3>
              <table className={styles.bomTable}>
                <thead>
                  <tr>
                    <th scope="col">{copy.investment.tenure}</th>
                    <th scope="col">{copy.investment.emi}</th>
                    <th scope="col">{copy.investment.interest}</th>
                  </tr>
                </thead>
                <tbody>
                  {eco.emiRows.map((row) => (
                    <tr key={row.tenureLabel}>
                      <td className={styles.bomName}>{row.tenureLabel}</td>
                      <td>{formatInr(row.monthlyEmiInr)}</td>
                      <td className={styles.bomSpec}>{formatInr(row.interestPaidInr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </section>

        {/* Impact */}
        {showImpact ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{copy.impact.title}</h2>
            <div className={styles.grid}>
              <div className={styles.techCard}>
                <p className={styles.cardLabel}>{copy.impact.co2}</p>
                <p className={styles.cardValue}>
                  {impact.co2Tons > 0 ? `${impact.co2Tons.toFixed(0)} t` : "—"}
                </p>
              </div>
              <div className={styles.techCard}>
                <p className={styles.cardLabel}>{copy.impact.trees}</p>
                <p className={styles.cardValue}>
                  {impact.treesEquivalent > 0
                    ? impact.treesEquivalent.toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
              <div className={styles.techCard}>
                <p className={styles.cardLabel}>{copy.impact.annual}</p>
                <p className={styles.cardValue}>
                  {closing.annualSavingsInr > 0
                    ? formatInrCompact(closing.annualSavingsInr)
                    : "—"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Engineering brief */}
        {showEng ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{copy.engineering.title}</h2>
            <p className={styles.sectionLead}>
              {eng.tiltNote || copy.engineering.leadFallback}
            </p>
            <div className={styles.grid}>
              {eng.metrics.map((m) => (
                <div key={m.label} className={styles.techCard}>
                  <p className={styles.cardLabel}>{m.label}</p>
                  <p className={styles.cardValue}>{m.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Merged Engineering & Assurance */}
        {showBom ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{copy.assurance.title}</h2>
            <p className={styles.sectionLead}>{copy.assurance.lead}</p>
            <table className={styles.bomTable}>
              <thead>
                <tr>
                  <th scope="col">{copy.assurance.item}</th>
                  <th scope="col">{copy.assurance.spec}</th>
                  <th scope="col">{copy.assurance.warranty}</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, i) => (
                  <tr key={`${item.name}-${i}`}>
                    <td>
                      <span className={styles.bomName}>{item.name}</span>
                      {item.brand ? (
                        <span className={styles.bomBrand}>{item.brand}</span>
                      ) : null}
                    </td>
                    <td className={styles.bomSpec}>{item.spec || "—"}</td>
                    <td className={warrantyClass(item.warranty || "")}>
                      {item.warranty || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* Execution */}
        {showExecution ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{copy.execution.title}</h2>
            <p className={styles.sectionLead}>{copy.execution.lead}</p>
            {execution.steps.length > 0 ? (
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
            ) : null}
            {execution.payments.length > 0 ? (
              <>
                <h3 className={styles.subTitle}>{copy.execution.paymentTitle}</h3>
                <div className={styles.paymentList}>
                  {execution.payments.map((p) => (
                    <div
                      key={p.label}
                      className={`${styles.paymentRow} ${p.isTotal ? styles.paymentRowTotal : ""}`}
                    >
                      <div className={styles.paymentMeta}>
                        <span className={styles.paymentStep}>{p.label}</span>
                        {p.pctLabel ? (
                          <span className={styles.paymentPct}>{p.pctLabel}</span>
                        ) : null}
                      </div>
                      <span className={styles.textGold}>{formatInr(p.amountInr)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {(execution.bank.accountNumber || execution.bank.upiId) && (
              <div className={styles.bankBlock}>
                <p className={styles.bankLabel}>{copy.execution.bank}</p>
                <p className={styles.bankLine}>{execution.bank.company}</p>
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

        {/* Terms */}
        {showTerms ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{copy.terms.title}</h2>
            {terms.conditions.length > 0 ? (
              <ul className={styles.bulletList}>
                {terms.conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : null}
            {terms.documents.length > 0 ? (
              <>
                <h3 className={styles.subTitle}>{copy.terms.documents}</h3>
                <ul className={styles.bulletList}>
                  {terms.documents.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ) : null}

        {/* Closing + CTA */}
        <section className={`${styles.section} ${styles.closingSection}`}>
          <h2 className={styles.sectionTitle}>{copy.closing.title}</h2>
          <p className={styles.sectionLead}>
            {copy.closing.prepared(closing.customerName || customer, closing.installerName || brand)}
          </p>
          <div className={styles.grid}>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.closing.annualUnits}</p>
              <p className={styles.cardValue}>
                {closing.annualUnits > 0
                  ? closing.annualUnits.toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>
            <div className={styles.techCard}>
              <p className={styles.cardLabel}>{copy.closing.wealth}</p>
              <p className={`${styles.cardValue} ${styles.textGold}`}>
                {formatLifetimeBenefitInr(
                  closing.lifetimeWealthInr || eco.lifetimeProfitInr
                )}
              </p>
            </div>
          </div>

          <div className={styles.ctaRow}>
            {wa ? (
              <a
                className={styles.ctaWhatsapp}
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className={styles.toolbarIcon} aria-hidden />
                {copy.closing.whatsapp}
              </a>
            ) : null}
            {qrUrl ? (
              <div className={styles.qrBlock}>
                <img src={qrUrl} alt={copy.closing.scanPay} className={styles.qrImg} />
                <p className={styles.qrCaption}>{copy.closing.scanPay}</p>
              </div>
            ) : null}
          </div>

          {closing.contactLine ? (
            <p className={styles.closingContact}>{closing.contactLine}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default ZenithProposalRenderer;
