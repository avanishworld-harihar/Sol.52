"use client";

/**
 * Zenith Luxury — 11 pages with Golden-equivalent content.
 * Design: Midnight Onyx · modular cards (not Golden editorial layout).
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

/**
 * Golden content map → Zenith pages:
 * 1 Cover · 2 Bill/Requirement · 3 Investment · 4 Financing · 5 Impact
 * 6 Engineering · 7 BOM · 8 Warranty · 9 Execution · 10 Payment · 11 Terms+Closing
 */
export function ZenithProposalRenderer({
  data,
  installerLogoUrl,
}: ZenithProposalRendererProps) {
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

  return (
    <div className={styles.shell}>
      <div className={styles.presetZenith}>
        {/* 1 — Cover (Golden cover content) */}
        <section className={`${styles.page} ${styles.pageCover}`}>
          <div className={styles.coverGlow} aria-hidden />
          {logoUrl ? <img src={logoUrl} alt={brand} className={styles.logo} /> : null}
          <BrandLockup name={brand} />
          <h1 className={styles.heroTitle}>Your home, energy independent.</h1>
          <p className={styles.heroSub}>
            Generating your own power for 25 years
            {eco.lifetimeProfitInr > 0
              ? ` — saving you ${formatLifetimeBenefitInr(eco.lifetimeProfitInr)}`
              : ""}
            .
          </p>
          <div className={styles.coverClient}>
            <p className={styles.cardLabel}>Prepared for</p>
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

        {/* 2 — Bill Intelligence OR Requirement (Golden page 2) */}
        <section className={styles.page}>
          {showBill ? (
            <>
              <PageHeader
                title="Bill Intelligence"
                lead="Your annual electricity pattern — and where summer quietly takes the most."
              />
              <div className={styles.heroMetrics}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Yearly bill</span>
                  <h3 className={styles.cardValue}>
                    {formatInrCompact(bill.yearlyBillInr)}
                  </h3>
                </div>
                <div className={`${styles.card} ${styles.cardHighlight}`}>
                  <span className={styles.cardLabel}>Summer share</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                    {Math.round(bill.summerTrapPct)}%
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Solar offset</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueEmerald}`}>
                    {Math.round(bill.solarSavingsPct)}%
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Fixed charges</span>
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
                    <h3 className={styles.cardValue} style={{ fontSize: "1.25rem" }}>
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
                  <span className={styles.cardLabel}>Total units</span>
                  <h3 className={styles.cardValue}>
                    {bill.totals.units.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Total net</span>
                  <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                    {formatInr(bill.totals.netInr)}
                  </h3>
                </div>
              </div>
            </>
          ) : (
            <>
              <PageHeader
                title="System Requirement"
                lead="Sized to your declared load — generation, coverage, and asset profile."
              />
              <div className={styles.heroMetrics}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Capacity</span>
                  <h3 className={styles.cardValue}>{capacity}</h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Annual generation</span>
                  <h3 className={styles.cardValue}>{generation}</h3>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Load coverage</span>
                  <h3 className={styles.cardValue}>{coverage}</h3>
                </div>
                <div className={`${styles.card} ${styles.cardHighlight}`}>
                  <span className={styles.cardLabel}>Asset profile</span>
                  <p className={styles.cardBody}>
                    {data.meta.assetProfileLine || "Residential rooftop solar"}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 3 — Investment Ledger (Golden economics) */}
        <section className={styles.page}>
          <PageHeader
            title="Investment Ledger"
            lead="Capital, subsidy, payback, and lifetime benefit — the same economics Golden shows, in Zenith cards."
          />
          <div className={styles.financialGrid}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Gross cost</span>
              <h3 className={styles.cardValue}>
                {eco.grossInr > 0 ? formatInr(eco.grossInr) : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>PM Surya Ghar subsidy</span>
              <h3 className={styles.cardValue}>
                {eco.subsidyInr > 0 ? formatInr(eco.subsidyInr) : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Net payable</span>
              <h3 className={styles.cardValue}>
                {eco.netInr > 0 ? formatInr(eco.netInr) : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Monthly savings</span>
              <h3 className={styles.cardValue}>
                {eco.monthlySavingsInr > 0 ? formatInr(eco.monthlySavingsInr) : "—"}
              </h3>
            </div>
            <div className={`${styles.card} ${styles.cardHighlight}`}>
              <span className={styles.cardLabel}>Payback</span>
              <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} Yrs` : "—"}
              </h3>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Lifetime benefit</span>
              <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                {eco.lifetimeProfitInr > 0
                  ? formatLifetimeBenefitInr(eco.lifetimeProfitInr)
                  : "—"}
              </h3>
            </div>
          </div>
        </section>

        {/* 4 — Financing */}
        <section className={styles.page}>
          <PageHeader
            title="Financing"
            lead="Bank tenure options with monthly EMI and total interest."
          />
          {eco.emiRows.length > 0 ? (
            <div className={styles.financialGrid}>
              {eco.emiRows.map((row) => (
                <div key={row.tenureLabel} className={styles.card}>
                  <span className={styles.cardLabel}>{row.tenureLabel}</span>
                  <h3 className={styles.cardValue}>{formatInr(row.monthlyEmiInr)}</h3>
                  <p className={styles.cardBody}>
                    Interest paid {formatInr(row.interestPaidInr)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Pending
              title="Financing options pending"
              hint="Loan tenures will appear once EMI configuration is complete."
            />
          )}
        </section>

        {/* 5 — Ecological Impact */}
        <section className={styles.page}>
          <PageHeader
            title="Ecological Impact"
            lead="Clean generation measured in carbon avoided and trees equivalent."
          />
          {impact.co2Tons > 0 || impact.treesEquivalent > 0 || closing.annualSavingsInr > 0 ? (
            <div className={styles.impactGrid}>
              <div className={styles.card}>
                <span className={styles.cardLabel}>CO₂ avoided</span>
                <h3 className={styles.cardValue}>
                  {impact.co2Tons > 0 ? `${impact.co2Tons.toFixed(0)} t` : "—"}
                </h3>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Trees equivalent</span>
                <h3 className={styles.cardValue}>
                  {impact.treesEquivalent > 0
                    ? impact.treesEquivalent.toLocaleString("en-IN")
                    : "—"}
                </h3>
              </div>
              <div className={`${styles.card} ${styles.cardHighlight}`}>
                <span className={styles.cardLabel}>Annual savings</span>
                <h3 className={`${styles.cardValue} ${styles.cardValueGold}`}>
                  {closing.annualSavingsInr > 0
                    ? formatInrCompact(closing.annualSavingsInr)
                    : "—"}
                </h3>
              </div>
            </div>
          ) : (
            <Pending
              title="Impact metrics pending"
              hint="CO₂ and tree-equivalent figures will populate from generation data."
            />
          )}
        </section>

        {/* 6 — Engineering Brief (+ install phases) */}
        <section className={styles.page}>
          <PageHeader
            title="Engineering Brief"
            lead={
              eng.tiltNote ||
              "Site-tuned metrics for generation, tilt, and compliance — same engineering story as Golden."
            }
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
          ) : (
            <Pending
              title="Engineering metrics pending"
              hint="System size, tilt, and generation metrics will appear after design."
            />
          )}
          {eng.phases.length > 0 ? (
            <div className={styles.sectionBlock}>
              <h3 className={styles.subTitle}>Design & install phases</h3>
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
            <p className={styles.standards}>Standards · {eng.standards.join(" · ")}</p>
          ) : null}
        </section>

        {/* 7 — BOM / Architecture (Golden BOM + tech points) */}
        <section className={styles.page}>
          <PageHeader
            title="Engineering & Assurance"
            lead="Tier-1 bill of materials — brand, spec, warranty, and technical points."
          />
          {bom.length > 0 ? (
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
                    style={{ fontSize: "1.15rem", marginTop: "1.25rem" }}
                  >
                    {item.warranty || "—"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <Pending
              title="Bill of materials pending"
              hint="Modules, inverter, and structure will appear once the system is configured."
            />
          )}
        </section>

        {/* 8 — Warranty Matrix */}
        <section className={styles.page}>
          <PageHeader
            title="Warranty Matrix"
            lead={
              warranty.intro ||
              "Manufacturer and workmanship coverages — same assurance story as Golden."
            }
          />
          {warranty.highlights.length > 0 || warranty.rows.length > 0 ? (
            <>
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
                        style={{ fontSize: "1.2rem" }}
                      >
                        {row.duration}
                      </p>
                      <p className={styles.cardBody}>{row.coverage}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <Pending
              title="Warranty details pending"
              hint="Panel, inverter, and workmanship warranties will appear from the BOM."
            />
          )}
        </section>

        {/* 9 — Execution journey */}
        <section className={styles.page}>
          <PageHeader
            title="Execution & Settlement"
            lead="From site survey to go-live — the full installation journey."
          />
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
          ) : (
            <Pending
              title="Execution plan pending"
              hint="Installation process steps will appear once the project plan is set."
            />
          )}
        </section>

        {/* 10 — Payment schedule + bank */}
        <section className={styles.page}>
          <PageHeader
            title="Payment Schedule"
            lead="Milestone-based capital schedule with bank settlement details."
          />
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
          ) : (
            <Pending
              title="Payment schedule pending"
              hint="Booking, dispatch, and commissioning milestones will appear when set."
            />
          )}
          {(execution.bank.company ||
            execution.bank.accountNumber ||
            execution.bank.upiId) && (
            <div className={styles.bankCard}>
              <span className={styles.cardLabel}>Bank details</span>
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

        {/* 11 — Terms + Closing (Golden closing content) */}
        <section className={styles.page}>
          <PageHeader
            title="Terms & Compliance"
            lead="General terms, documents, AMC — then a clear close."
          />

          <div className={styles.sectionBlock}>
            <h3 className={styles.subTitle}>General terms</h3>
            {terms.conditions.length > 0 ? (
              <ul className={styles.bulletList}>
                {terms.conditions.map((c) => (
                  <li key={c} className={styles.bulletItem}>
                    {c}
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
            <h3 className={styles.subTitle}>Documents required</h3>
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
            <h3 className={styles.subTitle}>AMC scope</h3>
            {terms.amcObjective ? <p className={styles.lead}>{terms.amcObjective}</p> : null}
            {terms.amcScope.length > 0 ? (
              <ul className={styles.bulletList}>
                {terms.amcScope.map((a) => (
                  <li key={a} className={styles.bulletItem}>
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <Pending
                title="AMC options pending"
                hint="1 / 5 / 10-year maintenance plans will appear when configured."
              />
            )}
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
            <h3 className={styles.subTitle}>Ready when you are</h3>
            <p className={styles.lead}>
              Prepared for {closing.customerName || customer} by{" "}
              {closing.installerName || brand}.
            </p>
            <div className={styles.heroMetrics}>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Annual units</span>
                <h3 className={styles.cardValue}>
                  {closing.annualUnits > 0
                    ? closing.annualUnits.toLocaleString("en-IN")
                    : "—"}
                </h3>
              </div>
              <div className={`${styles.card} ${styles.cardHighlight}`}>
                <span className={styles.cardLabel}>Lifetime wealth</span>
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
                <img src={closing.qrUrl} alt="Payment / contact QR" className={styles.qrImg} />
                <span className={styles.cardLabel}>Scan to connect</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ZenithProposalRenderer;
