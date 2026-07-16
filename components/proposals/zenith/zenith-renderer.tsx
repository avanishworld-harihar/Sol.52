"use client";

/**
 * Zenith — light editorial proposal (EN/HI + print).
 * Data: ProposalData only — does not import Golden transform/CSS.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { getZenithCopy, type ZenithLang } from "./zenith-copy";
import styles from "./zenith.module.css";

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

function warrantyTone(warranty: string): string {
  const years = Number((warranty.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if ((Number.isFinite(years) && years >= 25) || /25|30/.test(warranty)) {
    return styles.cardValueEmerald;
  }
  return styles.cardValueGold;
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
  const hasEngineering = eng.metrics.length > 0 || eng.phases.length > 0;
  const hasBom = bom.length > 0;
  const hasWarranty = warranty.highlights.length > 0 || warranty.rows.length > 0;
  const hasExecution = execution.steps.length > 0;
  const hasPayment =
    execution.payments.length > 0 ||
    Boolean(execution.bank.company || execution.bank.accountNumber || execution.bank.upiId);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className={`${styles.shell}${isHi ? ` ${styles.langHi}` : ""}`}>
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
        {/* 1 — Cover */}
        <section className={`${styles.page} ${styles.pageCover}`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brand} className={styles.logo} />
          ) : null}
          <BrandLockup name={brand} />
          <h1 className={styles.heroTitle}>{c.cover.hero}</h1>
          <p className={styles.heroSub}>
            {c.cover.subPrefix}
            {eco.lifetimeProfitInr > 0
              ? c.cover.subSaving(formatLifetimeBenefitInr(eco.lifetimeProfitInr))
              : ""}
            .
          </p>
          <div className={styles.coverClient}>
            <p className={styles.cardLabel}>{c.cover.preparedFor}</p>
            <p className={styles.coverClientName}>{customer}</p>
            {location ? <p className={styles.coverClientLoc}>{location}</p> : null}
            {data.meta.assetProfileLine ? (
              <p className={styles.coverClientLoc}>{data.meta.assetProfileLine}</p>
            ) : null}
          </div>
          <p className={styles.heroMeta}>
            {capacity !== "—" ? capacity : null}
            {capacity !== "—" && generation !== "—" ? " · " : null}
            {generation !== "—" ? generation : null}
          </p>
        </section>

        {/* 2 — Bill / Requirement */}
        <section className={styles.page}>
          {showBill ? (
            <>
              <PageHeader title={c.pages.bill} lead={c.pages.billLead} />
              <div className={styles.heroMetrics}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.yearlyBill}</span>
                  <h3 className={styles.cardValue}>
                    {formatInrCompact(bill.yearlyBillInr)}
                  </h3>
                </div>
                <div className={`${styles.card} ${styles.cardHighlight}`}>
                  <span className={styles.cardLabel}>{c.labels.summerShare}</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                    {Math.round(bill.summerTrapPct)}%
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.solarOffset}</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueEmerald}`}>
                    {Math.round(bill.solarSavingsPct)}%
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.fixedCharges}</span>
                  <h3 className={styles.cardValue}>{bill.fixedChargesDisplay || "—"}</h3>
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
              <div className={`${styles.sectionBlock} ${styles.monthGrid}`}>
                {bill.months.map((m) => (
                  <div
                    key={`m-${m.label}`}
                    className={`${styles.card} ${m.isSummerPeak ? styles.cardHighlight : ""}`}
                  >
                    <span className={styles.cardLabel}>{m.label}</span>
                    <h3 className={styles.cardValue} style={{ fontSize: "1.15rem" }}>
                      {formatInr(m.netInr)}
                    </h3>
                    <p className={styles.cardBody}>
                      {m.units} units · Energy {formatInr(m.energyInr)}
                    </p>
                  </div>
                ))}
              </div>
              <div className={`${styles.sectionBlock} ${styles.heroMetrics}`}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.totalUnits}</span>
                  <h3 className={styles.cardValue}>
                    {bill.totals.units.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.totalNet}</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                    {formatInr(bill.totals.netInr)}
                  </h3>
                </div>
              </div>
            </>
          ) : (
            <>
              <PageHeader title={c.pages.requirement} lead={c.pages.requirementLead} />
              <div className={styles.heroMetrics}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.capacity}</span>
                  <h3 className={styles.cardValue}>{capacity}</h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.annualGen}</span>
                  <h3 className={styles.cardValue}>{generation}</h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.loadCoverage}</span>
                  <h3 className={styles.cardValue}>{coverage}</h3>
                </div>
                <div className={`${styles.card} ${styles.cardHighlight}`}>
                  <span className={styles.cardLabel}>{c.labels.assetProfile}</span>
                  <p className={styles.cardBody}>
                    {data.meta.assetProfileLine || "Residential rooftop solar"}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 3 — Investment (+ financing + impact when present — no empty pages) */}
        <section className={styles.page}>
          <PageHeader title={c.pages.investment} lead={c.pages.investmentLead} />
          <div className={styles.financialGrid}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>{c.labels.grossCost}</span>
              <h3 className={styles.cardValue}>
                {eco.grossInr > 0 ? formatInr(eco.grossInr) : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>{c.labels.subsidy}</span>
              <h3 className={styles.cardValue}>
                {eco.subsidyInr > 0 ? formatInr(eco.subsidyInr) : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>{c.labels.netPayable}</span>
              <h3 className={styles.cardValue}>
                {eco.netInr > 0 ? formatInr(eco.netInr) : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>{c.labels.monthlySavings}</span>
              <h3 className={styles.cardValue}>
                {eco.monthlySavingsInr > 0 ? formatInr(eco.monthlySavingsInr) : "—"}
              </h3>
            </div>
            <div className={`${styles.card} ${styles.cardHighlight}`}>
              <span className={styles.cardLabel}>{c.labels.payback}</span>
              <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} Yrs` : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>{c.labels.lifetimeBenefit}</span>
              <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                {eco.lifetimeProfitInr > 0
                  ? formatLifetimeBenefitInr(eco.lifetimeProfitInr)
                  : "—"}
              </h3>
            </div>
          </div>

          {hasFinancing ? (
            <div className={styles.sectionBlock}>
              <h3 className={styles.subTitle}>{c.pages.financing}</h3>
              <p className={styles.lead}>{c.pages.financingLead}</p>
              <div className={styles.financialGrid}>
                {eco.emiRows.map((row) => (
                  <div key={row.tenureLabel} className={styles.card}>
                    <span className={styles.cardLabel}>{row.tenureLabel}</span>
                    <h3 className={styles.cardValue}>{formatInr(row.monthlyEmiInr)}</h3>
                    <p className={styles.cardBody}>
                      {c.labels.interestPaid} {formatInr(row.interestPaidInr)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasImpact ? (
            <div className={styles.sectionBlock}>
              <h3 className={styles.subTitle}>{c.pages.impact}</h3>
              <p className={styles.lead}>{c.pages.impactLead}</p>
              <div className={styles.impactGrid}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.co2}</span>
                  <h3 className={styles.cardValue}>
                    {impact.co2Tons > 0 ? `${impact.co2Tons.toFixed(0)} t` : "—"}
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>{c.labels.trees}</span>
                  <h3 className={styles.cardValue}>
                    {impact.treesEquivalent > 0
                      ? impact.treesEquivalent.toLocaleString("en-IN")
                      : "—"}
                  </h3>
                </div>
                <div className={`${styles.card} ${styles.cardHighlight}`}>
                  <span className={styles.cardLabel}>{c.labels.annualSavings}</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                    {closing.annualSavingsInr > 0
                      ? formatInrCompact(closing.annualSavingsInr)
                      : "—"}
                  </h3>
                </div>
              </div>
            </div>
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
              <div className={styles.metricGrid}>
                {eng.metrics.map((m) => (
                  <div key={m.label} className={styles.card}>
                    <span className={styles.cardLabel}>{m.label}</span>
                    <h3 className={styles.cardValue}>{m.value}</h3>
                  </div>
                ))}
              </div>
            ) : null}
            {eng.phases.length > 0 ? (
              <div className={styles.sectionBlock}>
                <h3 className={styles.subTitle}>{c.pages.phases}</h3>
                <ol className={styles.stepList}>
                  {eng.phases.map((p) => (
                    <li key={p.num} className={styles.stepItem}>
                      <span className={styles.stepNum}>{p.num}</span>
                      <div>
                        <p className={styles.stepTitle}>{p.title}</p>
                        <p className={styles.stepDesc}>{p.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
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
          <section className={styles.page}>
            <PageHeader title={c.pages.assurance} lead={c.pages.assuranceLead} />
            <div className={styles.assuranceGrid}>
              {bom.map((item, i) => (
                <article key={`${item.name}-${i}`} className={styles.card}>
                  <span className={styles.cardLabel}>{item.brand || "Component"}</span>
                  <h3 className={styles.cardHeader}>{item.name}</h3>
                  <p className={styles.cardBody}>{item.spec || "—"}</p>
                  {item.description ? (
                    <p className={styles.cardBody}>{item.description}</p>
                  ) : null}
                  {item.technicalPoints && item.technicalPoints.length > 0 ? (
                    <ul className={styles.techPoints}>
                      {item.technicalPoints.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p
                    className={`${styles.cardValue} ${warrantyTone(item.warranty || "")}`}
                    style={{ fontSize: "1.05rem", marginTop: "1rem" }}
                  >
                    {item.warranty || "—"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* 6 — Warranty */}
        {hasWarranty ? (
          <section className={styles.page}>
            <PageHeader
              title={c.pages.warranty}
              lead={warranty.intro || c.pages.warrantyLead}
            />
            {warranty.highlights.length > 0 ? (
              <div className={styles.warrantyGrid}>
                {warranty.highlights.map((h) => (
                  <div key={h.label} className={`${styles.card} ${styles.cardHighlight}`}>
                    <span className={styles.cardLabel}>{h.label}</span>
                    <h3 className={styles.cardValue}>
                      {h.value}
                      <span className={styles.unitSuffix}>{h.unit}</span>
                    </h3>
                  </div>
                ))}
              </div>
            ) : null}
            {warranty.rows.length > 0 ? (
              <div className={`${styles.sectionBlock} ${styles.assuranceGrid}`}>
                {warranty.rows.map((row) => (
                  <div key={`${row.item}-${row.duration}`} className={styles.card}>
                    <span className={styles.cardLabel}>{row.by || "Coverage"}</span>
                    <h3 className={styles.cardHeader}>{row.item}</h3>
                    <p
                      className={`${styles.cardValue} ${warrantyTone(row.duration)}`}
                      style={{ fontSize: "1.1rem" }}
                    >
                      {row.duration}
                    </p>
                    <p className={styles.cardBody}>{row.coverage}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 7 — Execution */}
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

        {/* 8 — Payment */}
        {hasPayment ? (
          <section className={styles.page}>
            <PageHeader title={c.pages.payment} lead={c.pages.paymentLead} />
            {execution.payments.length > 0 ? (
              <div className={styles.paymentGrid}>
                {execution.payments.map((p) => (
                  <div
                    key={p.label}
                    className={`${styles.card} ${p.isTotal ? styles.cardHighlight : ""}`}
                  >
                    <span className={styles.cardLabel}>{p.pctLabel || "Milestone"}</span>
                    <h3 className={styles.cardHeader}>{p.label}</h3>
                    <p className={`${styles.cardValue} ${styles.cardValueGold}`}>
                      {formatInr(p.amountInr)}
                    </p>
                  </div>
                ))}
              </div>
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

        {/* 9 — Terms + Closing */}
        <section className={styles.page}>
          <PageHeader title={c.pages.terms} lead={c.pages.termsLead} />

          <div className={styles.sectionBlock}>
            <h3 className={styles.subTitle}>{c.pages.generalTerms}</h3>
            {terms.conditions.length > 0 ? (
              <ul className={styles.bulletList}>
                {terms.conditions.map((item) => (
                  <li key={item} className={styles.bulletItem}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <Pending
                title="Terms pending"
                hint="Proposal validity and commercial terms will appear when finalized."
              />
            )}
          </div>

          <div className={styles.sectionBlock}>
            <h3 className={styles.subTitle}>{c.pages.documents}</h3>
            {terms.documents.length > 0 ? (
              <ul className={styles.bulletList}>
                {terms.documents.map((d) => (
                  <li key={d} className={styles.bulletItem}>
                    {d}
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

          <div className={styles.sectionBlock}>
            <h3 className={styles.subTitle}>{c.pages.amcScope}</h3>
            {terms.amcObjective ? <p className={styles.lead}>{terms.amcObjective}</p> : null}
            {terms.amcScope.length > 0 ? (
              <ul className={styles.bulletList}>
                {terms.amcScope.map((a) => (
                  <li key={a} className={styles.bulletItem}>
                    {a}
                  </li>
                ))}
              </ul>
            ) : null}
            {terms.amcTerms.length > 0 ? (
              <ul className={`${styles.bulletList} ${styles.sectionBlock}`}>
                {terms.amcTerms.map((t) => (
                  <li key={t} className={styles.bulletItem}>
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={`${styles.sectionBlock} ${styles.closingBlock}`}>
            <h3 className={styles.subTitle}>{c.pages.ready}</h3>
            <p className={styles.lead}>
              {c.pages.preparedBy(closing.customerName || customer, closing.installerName || brand)}
            </p>
            <div className={styles.heroMetrics}>
              <div className={styles.card}>
                <span className={styles.cardLabel}>{c.labels.annualUnits}</span>
                <h3 className={styles.cardValue}>
                  {closing.annualUnits > 0
                    ? closing.annualUnits.toLocaleString("en-IN")
                    : "—"}
                </h3>
              </div>
              <div className={`${styles.card} ${styles.cardHighlight}`}>
                <span className={styles.cardLabel}>{c.labels.lifetimeWealth}</span>
                <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                  {formatLifetimeBenefitInr(
                    closing.lifetimeWealthInr || eco.lifetimeProfitInr
                  )}
                </h3>
              </div>
            </div>
            {closing.contactLine ? (
              <p className={styles.closingContact}>{closing.contactLine}</p>
            ) : null}
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
