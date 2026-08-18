"use client";

/**
 * Voltaic — engineering dossier proposal.
 * Preset id: residential_voltaic
 *
 * Structure: every page is a drawing sheet (G / A / F / E / M / Q / P / X / T / Z
 * series) with a title block. The electrical and array sheets carry real design
 * work — temperature-corrected string sizing, a single-line diagram, a cable
 * schedule and a commissioning matrix — and the bill of materials runs down to
 * connectors, earthing electrodes and documentation.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import {
  buildResidentialProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";
import { RESIDENTIAL_ENGINEERING_STANDARDS } from "@/lib/proposal-engineering-metrics";
import { getVoltaicCopy, type VoltaicLang } from "./voltaic-copy";
import {
  buildVoltaicEngineering,
  voltaicBalanceBom,
  voltaicMajorBom,
  VOLTAIC_INVERTER_MAX_DC_V,
  VOLTAIC_MAX_CELL_TEMP_C,
  VOLTAIC_MIN_CELL_TEMP_C,
  VOLTAIC_VOC_TEMP_COEFF,
} from "./voltaic-live";
import { VoltaicGeometryDiagram, VoltaicStackDiagram } from "./voltaic-stack-diagram";
import { VoltaicSld } from "./voltaic-sld";
import { VoltaicCaption, VoltaicHead, VoltaicSheet } from "./voltaic-sheet";
import styles from "./voltaic.module.css";

const LANG_KEY = "sol52-voltaic-lang";

/** Monthly share of annual yield for central India. */
const MONTH_FACTORS = [
  0.082, 0.085, 0.094, 0.095, 0.096, 0.075, 0.062, 0.061, 0.076, 0.088, 0.086, 0.1,
];
const MONTH_KEYS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_KEYS_HI = ["जन", "फर", "मार्च", "अप्रै", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];

function readStoredLang(): VoltaicLang {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(LANG_KEY);
    if (raw === "hi" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  return /^hi\b/i.test(window.navigator?.language || "") ? "hi" : "en";
}

export type VoltaicRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput | null;
  summary?: ProposalDeckSummary | null;
  proposalId?: string;
};

export function VoltaicRenderer({
  data,
  installerLogoUrl,
  pptInput,
  summary,
  proposalId,
}: VoltaicRendererProps) {
  const [lang, setLang] = useState<VoltaicLang>("en");
  const [pdfBusy, setPdfBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLang(readStoredLang());
  }, []);

  const changeLang = (next: VoltaicLang) => {
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const c = getVoltaicCopy(lang);
  const isHi = lang === "hi";

  const eng = useMemo(
    () => buildVoltaicEngineering(data, pptInput, summary, lang),
    [data, pptInput, summary, lang]
  );

  const brand =
    data.meta.brandName?.trim() || data.closing.installerName?.trim() || "Solar Partner";
  const logoUrl = data.meta.brandLogoUrl?.trim() || installerLogoUrl?.trim();
  const client = data.meta.customerName?.trim() || "—";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : eng.metrics.cityLabel;

  const systemKw = data.meta.systemKw;
  const annualUnits = data.closing.annualUnits || eng.metrics.annualGenUnits;
  const showBill = data.bill.hasData && data.bill.months.length > 0;

  const dateLabel = useMemo(() => {
    const raw = data.meta.generatedAt ? new Date(data.meta.generatedAt) : new Date();
    return raw.toLocaleDateString(isHi ? "hi-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [data.meta.generatedAt, isHi]);

  const acCurrentA = useMemo(() => {
    const volts = eng.threePhase ? 415 : 230;
    const factor = eng.threePhase ? 1.732 : 1;
    return Math.round(((systemKw * 1000) / (volts * factor * 0.98)) * 10) / 10;
  }, [systemKw, eng.threePhase]);

  const majorBom = useMemo(
    () =>
      voltaicMajorBom(data, eng.design, {
        panelCount: eng.metrics.panelCount,
        panelWatt: eng.metrics.panelWatt,
        systemKw,
        threePhase: eng.threePhase,
        isHi,
      }),
    [data, eng, systemKw, isHi]
  );

  const bosBom = useMemo(
    () =>
      voltaicBalanceBom(eng.design, eng.cables, {
        threePhase: eng.threePhase,
        panelCount: eng.metrics.panelCount,
        isHi,
      }),
    [eng, isHi]
  );

  const months = useMemo(() => {
    const names = isHi ? MONTH_KEYS_HI : MONTH_KEYS_EN;
    const values = MONTH_FACTORS.map((f) => Math.round(annualUnits * f));
    const max = Math.max(...values, 1);
    return values.map((units, i) => ({
      label: names[i],
      units,
      heightPct: Math.max(8, Math.round((units / max) * 100)),
      isBest: units === max,
    }));
  }, [annualUnits, isHi]);

  const totalSheets = showBill ? 14 : 13;
  let sheetNo = 0;
  const next = () => String(++sheetNo).padStart(2, "0");
  const total = String(totalSheets).padStart(2, "0");

  const sheetLabels = c.sheet;
  const frame = (code: string, kicker: string) => ({
    code,
    kicker,
    index: next(),
    total,
    client,
    project: `${systemKw} kW · ${location}`,
    date: dateLabel,
    scale: sheetLabels.nts,
    drawn: brand,
    labels: sheetLabels,
  });

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(
          await buildResidentialProposalPdf({
            root: rootRef.current,
            customerName: client,
            presetId: "residential_voltaic",
            pageSelector: "[data-voltaic-stage] > section",
          })
        );
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  if (!data) return <div className={styles.loading}>{c.print.loading}</div>;

  const d = eng.design;

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_voltaic"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page voltaic-sheet { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- toolbar chrome
              <img src={logoUrl} alt={brand} className={styles.printBarLogo} />
            ) : null}
            {brand} · {c.print.series}
          </span>
          <div className={styles.printBarActions}>
            <div className={styles.langToggle} role="group" aria-label={c.print.langAria}>
              <button
                type="button"
                className={`${styles.langBtn}${lang === "en" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => changeLang("en")}
                aria-pressed={lang === "en"}
              >
                {c.print.langEn}
              </button>
              <button
                type="button"
                className={`${styles.langBtn}${lang === "hi" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => changeLang("hi")}
                aria-pressed={lang === "hi"}
              >
                {c.print.langHi}
              </button>
            </div>
            <button
              type="button"
              className={styles.printBarBtn}
              onClick={handlePrint}
              disabled={pdfBusy}
            >
              {pdfBusy ? c.print.preparing : c.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.stage} data-voltaic-stage>
        {/* ══ G-001 · COVER ══════════════════════════════════════════ */}
        <VoltaicSheet {...frame("G-001", c.cover.docType)} tone="cyan">
          <div className={styles.coverGrid} aria-hidden />
          <div className={styles.coverInner}>
            <div className={styles.coverBrandRow}>
              {logoUrl ? (
                <span className={styles.coverLogoPlate}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- print asset */}
                  <img src={logoUrl} alt={brand} className={styles.coverLogo} />
                </span>
              ) : null}
              <span className={styles.coverBrandName}>{brand.toUpperCase()}</span>
            </div>

            <div className={styles.coverHero}>
              <h1 className={styles.coverTitle}>
                {c.cover.title1}
                <br />
                <em>{c.cover.title2}</em>
              </h1>
              <p className={styles.coverLead}>{c.cover.lead}</p>
            </div>

            <div className={styles.coverClient}>
              <span className={styles.coverClientLabel}>{c.cover.preparedFor}</span>
              <span className={styles.coverClientName}>{client}</span>
              <span className={styles.coverClientLoc}>{location}</span>
            </div>

            <div className={styles.coverStats}>
              <div className={styles.coverStat}>
                <span className={styles.coverStatVal}>{systemKw}</span>
                <span className={styles.coverStatUnit}>kW</span>
                <span className={styles.coverStatLabel}>{c.cover.capacity}</span>
              </div>
              <div className={styles.coverStat}>
                <span className={styles.coverStatVal}>{eng.metrics.panelCount}</span>
                <span className={styles.coverStatUnit}>× {eng.metrics.panelWatt} Wp</span>
                <span className={styles.coverStatLabel}>{c.cover.modules}</span>
              </div>
              <div className={styles.coverStat}>
                <span className={styles.coverStatVal}>
                  {annualUnits > 0 ? annualUnits.toLocaleString("en-IN") : "—"}
                </span>
                <span className={styles.coverStatUnit}>kWh</span>
                <span className={styles.coverStatLabel}>{c.cover.annual}</span>
              </div>
              <div className={styles.coverStat}>
                <span className={styles.coverStatVal}>
                  {data.economics.paybackYears > 0 ? data.economics.paybackYears.toFixed(1) : "—"}
                </span>
                <span className={styles.coverStatUnit}>{c.econ.yrs}</span>
                <span className={styles.coverStatLabel}>{c.cover.payback}</span>
              </div>
            </div>

            <div className={styles.coverContents}>
              <span className={styles.coverContentsLabel}>{c.cover.contents}</span>
              <ol className={styles.coverContentsList}>
                {c.cover.sections.map((s, i) => (
                  <li key={s}>
                    <span className={styles.coverContentsNum}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ G-002 · THE CASE FOR SOLAR ═════════════════════════════ */}
        <VoltaicSheet {...frame("G-002", c.why.sheet)}>
          <VoltaicHead title={c.why.title} lead={c.why.lead} />

          <div className={styles.whyGrid}>
            {c.why.cards.map((card) => (
              <article key={card.k} className={styles.whyCard}>
                <span className={styles.whyNum}>{card.k}</span>
                <h3 className={styles.whyCardTitle}>{card.t}</h3>
                <p className={styles.whyCardBody}>{card.d}</p>
              </article>
            ))}
          </div>

          {/* Grid cost vs solar cost, drawn as a diverging pair of bars */}
          <div className={styles.whyChart}>
            <VoltaicCaption
              label={c.econ.projTitle}
              right={data.economics.paybackYears > 0 ? `${c.econ.breakEven} ${data.economics.paybackYears.toFixed(1)} ${c.econ.yrs}` : undefined}
            />
            <WealthChart
              points={data.economics.wealthJourney}
              paybackYears={data.economics.paybackYears}
              breakEvenLabel={c.econ.breakEven}
            />
            <p className={styles.pageNote}>{c.econ.projNote}</p>
          </div>

          <div className={styles.mythBlock}>
            <span className={styles.blockLabel}>{c.why.mythTitle}</span>
            <div className={styles.mythGrid}>
              {c.why.myths.map((m) => (
                <div key={m.q} className={styles.mythItem}>
                  <p className={styles.mythQ}>{m.q}</p>
                  <p className={styles.mythA}>{m.a}</p>
                </div>
              ))}
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ A-100 · BILL ANALYSIS (bill-backed only) ═══════════════ */}
        {showBill ? (
          <VoltaicSheet {...frame("A-100", c.bill.sheet)}>
            <VoltaicHead title={c.bill.title} lead={c.bill.lead} />
            <div className={styles.billChart}>
              {data.bill.months.map((m) => (
                <div key={m.label} className={styles.billCol}>
                  <span className={styles.billColVal}>{m.units}</span>
                  <div
                    className={`${styles.billBar}${m.isSummerPeak ? ` ${styles.billBarPeak}` : ""}`}
                    style={{ height: `${m.barHeightPct}%` }}
                  />
                  <span className={styles.billColLabel}>{m.label}</span>
                </div>
              ))}
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{c.bill.month}</th>
                  <th className={styles.num}>{c.bill.units}</th>
                  <th className={styles.num}>{c.bill.energy}</th>
                  <th className={styles.num}>{c.bill.fixed}</th>
                  <th className={styles.num}>{c.bill.duty}</th>
                  <th className={styles.num}>{c.bill.total}</th>
                </tr>
              </thead>
              <tbody>
                {data.bill.months.map((m) => (
                  <tr key={m.label} className={m.isSummerPeak ? styles.rowPeak : undefined}>
                    <td>{m.label}</td>
                    <td className={styles.num}>{m.units}</td>
                    <td className={styles.num}>{formatInr(m.energyInr)}</td>
                    <td className={styles.num}>{formatInr(m.fixedInr)}</td>
                    <td className={styles.num}>{formatInr(m.dutyInr)}</td>
                    <td className={styles.num}>{formatInr(m.netInr)}</td>
                  </tr>
                ))}
                <tr className={styles.rowTotal}>
                  <td>{c.bill.yearTotal}</td>
                  <td className={styles.num}>{data.bill.totals.units}</td>
                  <td className={styles.num}>{formatInr(data.bill.totals.energyInr)}</td>
                  <td className={styles.num}>{formatInr(data.bill.totals.fixedInr)}</td>
                  <td className={styles.num}>{formatInr(data.bill.totals.dutyInr)}</td>
                  <td className={styles.num}>{formatInr(data.bill.totals.netInr)}</td>
                </tr>
              </tbody>
            </table>
          </VoltaicSheet>
        ) : null}

        {/* ══ F-200 · INVESTMENT ════════════════════════════════════ */}
        <VoltaicSheet {...frame("F-200", c.econ.sheet)}>
          <VoltaicHead title={c.econ.title} />

          <div className={styles.moneyRow}>
            <div className={styles.moneyCell}>
              <span className={styles.moneyLabel}>{c.econ.gross}</span>
              <span className={styles.moneyVal}>{formatInr(data.economics.grossInr)}</span>
            </div>
            <span className={styles.moneyOp}>−</span>
            <div className={`${styles.moneyCell} ${styles.moneyCellSub}`}>
              <span className={styles.moneyLabel}>{c.econ.subsidy}</span>
              <span className={styles.moneyVal}>{formatInr(data.economics.subsidyInr)}</span>
            </div>
            <span className={styles.moneyOp}>=</span>
            <div className={`${styles.moneyCell} ${styles.moneyCellNet}`}>
              <span className={styles.moneyLabel}>{c.econ.net}</span>
              <span className={styles.moneyValNet}>{formatInr(data.economics.netInr)}</span>
            </div>
          </div>

          <div className={styles.kpiRow}>
            <div className={styles.kpi}>
              <span className={styles.kpiVal}>{formatInr(data.economics.monthlySavingsInr)}</span>
              <span className={styles.kpiLabel}>{c.econ.monthly}</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiVal}>
                {data.economics.paybackYears > 0
                  ? `${data.economics.paybackYears.toFixed(1)} ${c.econ.yrs}`
                  : "—"}
              </span>
              <span className={styles.kpiLabel}>{c.econ.payback}</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiVal}>
                {formatInrCompact(data.economics.lifetimeProfitInr)}
              </span>
              <span className={styles.kpiLabel}>{c.econ.lifetime}</span>
            </div>
          </div>

          {data.economics.emiRows.length > 0 ? (
            <div className={styles.block}>
              <VoltaicCaption label={c.econ.emiTitle} />
              <p className={styles.pageNote}>
                {c.econ.emiLead(String(data.economics.interestRatePct ?? 7))}
              </p>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{c.econ.tenure}</th>
                    <th className={styles.num}>{c.econ.interest}</th>
                    <th className={styles.num}>{c.econ.emi}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.economics.emiRows.map((row) => (
                    <tr key={row.tenureLabel}>
                      <td>{row.tenureLabel}</td>
                      <td className={styles.num}>
                        {row.interestPaidInr > 0 ? formatInr(row.interestPaidInr) : "—"}
                      </td>
                      <td className={`${styles.num} ${styles.strong}`}>
                        {row.monthlyEmiInr > 0 ? formatInr(row.monthlyEmiInr) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </VoltaicSheet>

        {/* ══ E-101 · ARRAY & STRUCTURAL DESIGN ═════════════════════ */}
        <VoltaicSheet {...frame("E-101", c.array.sheet)} tone="cyan">
          <VoltaicHead title={c.array.title} lead={c.array.lead} />

          <VoltaicCaption label={c.array.assembly} right={c.array.stack.scale} />
          <div className={styles.drawing}>
            <VoltaicStackDiagram labels={c.array.stack} />
          </div>

          <VoltaicCaption label={c.array.geometry} />
          <div className={styles.drawing}>
            <VoltaicGeometryDiagram
              labels={c.array.geom}
              tiltDeg={eng.structural.tiltDeg}
              rowPitchM={eng.structural.rowPitchM}
              clearanceMm={eng.structural.clearanceMm}
              windKmph={eng.structural.windSpeedKmph}
              upliftN={eng.structural.upliftPerModuleN}
            />
          </div>

          <div className={styles.specGrid}>
            <Spec label={c.array.specs.lat} value={`${eng.metrics.siteLat.toFixed(1)}° N`} />
            <Spec label={c.array.specs.tilt} value={`${eng.structural.tiltDeg}°`} />
            <Spec label={c.array.specs.azimuth} value={eng.structural.azimuthLabel} />
            <Spec label={c.array.specs.area} value={`${eng.structural.arrayAreaM2} m²`} />
            <Spec label={c.array.specs.wind} value={`${eng.structural.windSpeedKmph} km/h`} />
            <Spec
              label={c.array.specs.pressure}
              value={`${eng.structural.designWindPressurePa} Pa`}
            />
            <Spec label={c.array.specs.pitch} value={`${eng.structural.rowPitchM.toFixed(2)} m`} />
            <Spec label={c.array.specs.anchor} value={eng.structural.ballastOrAnchorNote} />
          </div>

          <div className={styles.insight}>
            <span className={styles.blockLabel}>{c.array.whyTitle}</span>
            <p>{eng.metrics.tiltRationale}</p>
          </div>
        </VoltaicSheet>

        {/* ══ E-102 · ELECTRICAL DESIGN ═════════════════════════════ */}
        <VoltaicSheet {...frame("E-102", c.elec.sheet)} tone="cyan">
          <VoltaicHead title={c.elec.title} lead={c.elec.lead} />

          <VoltaicCaption label={c.elec.sld.title} right={c.sheet.nts} />
          <div className={styles.drawing}>
            <VoltaicSld
              labels={c.elec.sld}
              design={d}
              systemKw={systemKw}
              threePhase={eng.threePhase}
              acCurrentA={acCurrentA}
            />
          </div>

          <div className={styles.twoCol}>
            <div>
              <VoltaicCaption label={c.elec.stringTitle} />
              <p className={styles.pageNote}>
                {c.elec.stringLead(d.minModulesPerString, d.maxModulesPerString)}
              </p>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{c.elec.cols.param}</th>
                    <th className={styles.num}>{c.elec.cols.value}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{c.elec.params.vocStc}</td>
                    <td className={styles.num}>{d.moduleVocV} V</td>
                  </tr>
                  <tr>
                    <td>{c.elec.params.tempCoeff}</td>
                    <td className={styles.num}>{VOLTAIC_VOC_TEMP_COEFF} %/°C</td>
                  </tr>
                  <tr>
                    <td>{c.elec.params.vocCold(VOLTAIC_MIN_CELL_TEMP_C)}</td>
                    <td className={styles.num}>{d.vocColdV} V</td>
                  </tr>
                  <tr>
                    <td>{c.elec.params.vmpHot(VOLTAIC_MAX_CELL_TEMP_C)}</td>
                    <td className={styles.num}>{d.vmpHotV} V</td>
                  </tr>
                  <tr>
                    <td>{c.elec.params.maxDc}</td>
                    <td className={styles.num}>{VOLTAIC_INVERTER_MAX_DC_V} V</td>
                  </tr>
                  <tr className={styles.rowHighlight}>
                    <td>{c.elec.params.perString}</td>
                    <td className={`${styles.num} ${styles.strong}`}>{d.modulesPerString}</td>
                  </tr>
                  <tr className={styles.rowHighlight}>
                    <td>{c.elec.params.strings}</td>
                    <td className={`${styles.num} ${styles.strong}`}>{d.stringCount}</td>
                  </tr>
                  <tr>
                    <td>{c.elec.params.stringVoc}</td>
                    <td className={styles.num}>{d.stringVocColdV} V</td>
                  </tr>
                  <tr>
                    <td>{c.elec.params.headroom}</td>
                    <td className={styles.num}>{d.headroomPct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <VoltaicCaption label={c.elec.cableTitle} />
              <table className={`${styles.dataTable} ${styles.tableTight}`}>
                <thead>
                  <tr>
                    <th>{c.elec.cols.ref}</th>
                    <th>{c.elec.cols.from}</th>
                    <th className={styles.num}>{c.elec.cols.size}</th>
                    <th className={styles.num}>{c.elec.cols.length}</th>
                    <th className={styles.num}>{c.elec.cols.vd}</th>
                  </tr>
                </thead>
                <tbody>
                  {eng.cables.map((run) => (
                    <tr key={run.ref}>
                      <td className={styles.mono}>{run.ref}</td>
                      <td>{run.from}</td>
                      <td className={styles.num}>{run.sizeSqMm} mm²</td>
                      <td className={styles.num}>{run.lengthM} m</td>
                      <td className={styles.num}>
                        {run.voltageDropPct > 0 ? `${run.voltageDropPct}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.pageNote}>{c.elec.testNote}</p>
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ M-300 · BOM · MAJOR PLANT ═════════════════════════════ */}
        <VoltaicSheet {...frame("M-300", c.bom.sheetMajor)}>
          <VoltaicHead title={c.bom.titleMajor} lead={c.bom.leadMajor} />
          {majorBom.map((group) => (
            <BomGroup key={group.code} group={group} cols={c.bom.cols} noteLabel={c.bom.subNote} />
          ))}
        </VoltaicSheet>

        {/* ══ M-301 · BOM · BALANCE OF SYSTEM ═══════════════════════ */}
        <VoltaicSheet {...frame("M-301", c.bom.sheetBos)}>
          <VoltaicHead title={c.bom.titleBos} lead={c.bom.leadBos} />
          {bosBom.map((group) => (
            <BomGroup
              key={group.code}
              group={group}
              cols={c.bom.cols}
              noteLabel={c.bom.subNote}
              compact
            />
          ))}
        </VoltaicSheet>

        {/* ══ Q-400 · QUALITY & COMMISSIONING ═══════════════════════ */}
        <VoltaicSheet {...frame("Q-400", c.quality.sheet)}>
          <VoltaicHead title={c.quality.title} lead={c.quality.lead} />
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>{c.quality.cols.ref}</th>
                <th>{c.quality.cols.test}</th>
                <th>{c.quality.cols.method}</th>
                <th>{c.quality.cols.acceptance}</th>
              </tr>
            </thead>
            <tbody>
              {eng.tests.map((t) => (
                <tr key={t.ref}>
                  <td className={styles.mono}>{t.ref}</td>
                  <td className={styles.strong}>{t.test}</td>
                  <td>{t.method}</td>
                  <td className={styles.mono}>{t.acceptance}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.twoCol}>
            <div className={styles.block}>
              <span className={styles.blockLabel}>{c.quality.handoverTitle}</span>
              <ul className={styles.checkList}>
                {c.quality.handover.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <div className={styles.block}>
              <span className={styles.blockLabel}>{c.quality.standardsTitle}</span>
              <ul className={styles.stdList}>
                {RESIDENTIAL_ENGINEERING_STANDARDS.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ P-500 · GENERATION FORECAST ═══════════════════════════ */}
        <VoltaicSheet {...frame("P-500", c.gen.sheet)}>
          <VoltaicHead title={c.gen.title} lead={c.gen.lead} />
          <div className={styles.genChart}>
            {months.map((m) => (
              <div key={m.label} className={styles.genCol}>
                <span className={styles.genVal}>{m.units}</span>
                <div
                  className={`${styles.genBar}${m.isBest ? ` ${styles.genBarBest}` : ""}`}
                  style={{ height: `${m.heightPct}%` }}
                />
                <span className={styles.genLabel}>{m.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.kpiRow}>
            <div className={styles.kpi}>
              <span className={styles.kpiVal}>{annualUnits.toLocaleString("en-IN")}</span>
              <span className={styles.kpiLabel}>
                {c.gen.annual} · {c.gen.units}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiVal}>{Math.round(annualUnits / 365)}</span>
              <span className={styles.kpiLabel}>
                {c.gen.daily} · {c.gen.units}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiVal}>{eng.metrics.loadCoveragePct}%</span>
              <span className={styles.kpiLabel}>{c.gen.basis.coverage}</span>
            </div>
          </div>

          <div className={styles.block}>
            <span className={styles.blockLabel}>{c.gen.basisTitle}</span>
            <div className={styles.specGrid}>
              <Spec label={c.gen.basis.dc} value={`${eng.metrics.dcCapacityKwp} kWp`} />
              <Spec label={c.gen.basis.psh} value={`${eng.metrics.peakSunHours} h/day`} />
              <Spec label={c.gen.basis.pr} value={`${eng.metrics.performanceRatioPct}%`} />
              <Spec
                label={c.gen.basis.yield}
                value={`${eng.metrics.specificYieldKwhPerKwp} kWh/kWp`}
              />
              <Spec label={c.gen.basis.degradation} value="≤ 0.55 %/yr" />
              <Spec label={c.gen.basis.coverage} value={`${eng.metrics.loadCoveragePct}%`} />
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ P-501 · IMPACT ════════════════════════════════════════ */}
        <VoltaicSheet {...frame("P-501", c.impact.sheet)}>
          <VoltaicHead title={c.impact.title} note={c.impact.note} />
          <div className={styles.impactRow}>
            <div className={styles.impactCard}>
              <span className={styles.impactVal}>{Math.round(data.impact.co2Tons)}</span>
              <span className={styles.impactUnit}>{c.impact.tons}</span>
              <span className={styles.impactLabel}>{c.impact.co2}</span>
            </div>
            <div className={styles.impactCard}>
              <span className={styles.impactVal}>
                {data.impact.treesEquivalent.toLocaleString("en-IN")}
              </span>
              <span className={styles.impactUnit}>&nbsp;</span>
              <span className={styles.impactLabel}>{c.impact.trees}</span>
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ X-600 · EXECUTION & PAYMENT ═══════════════════════════ */}
        <VoltaicSheet {...frame("X-600", c.exec.sheet)}>
          <VoltaicHead title={c.exec.title} lead={c.exec.lead} />
          <ol className={styles.phaseList}>
            {data.execution.steps.map((s) => (
              <li key={s.num} className={styles.phaseItem}>
                <span className={styles.phaseNum}>{s.num}</span>
                <div>
                  <p className={styles.phaseTitle}>{s.title}</p>
                  <p className={styles.phaseDesc}>{s.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.twoCol}>
            <div className={styles.block}>
              <span className={styles.blockLabel}>{c.exec.payTitle}</span>
              <table className={styles.dataTable}>
                <tbody>
                  {data.execution.payments.map((p) => (
                    <tr key={p.label} className={p.isTotal ? styles.rowTotal : undefined}>
                      <td>{p.label}</td>
                      <td className={styles.num}>{p.pctLabel}</td>
                      <td className={`${styles.num} ${styles.strong}`}>
                        {formatInr(p.amountInr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.block}>
              <span className={styles.blockLabel}>{c.exec.bankTitle}</span>
              <dl className={styles.bankList}>
                <dt>{c.exec.account}</dt>
                <dd className={styles.mono}>{data.execution.bank.accountNumber || "—"}</dd>
                <dt>{c.exec.ifsc}</dt>
                <dd className={styles.mono}>{data.execution.bank.ifsc || "—"}</dd>
                <dt>{c.exec.upi}</dt>
                <dd className={styles.mono}>{data.execution.bank.upiId || "—"}</dd>
              </dl>
            </div>
          </div>
        </VoltaicSheet>

        {/* ══ T-700 · TERMS ═════════════════════════════════════════ */}
        <VoltaicSheet {...frame("T-700", c.terms.sheet)}>
          <VoltaicHead title={c.terms.title} />
          <div className={styles.twoCol}>
            <div className={styles.block}>
              <span className={styles.blockLabel}>{c.terms.conditions}</span>
              <ul className={styles.stdList}>
                {data.terms.conditions.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className={styles.block}>
              <span className={styles.blockLabel}>{c.terms.documents}</span>
              <ul className={styles.checkList}>
                {data.terms.documents.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.block}>
            <span className={styles.blockLabel}>{c.terms.warranty}</span>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{c.terms.item}</th>
                  <th>{c.terms.duration}</th>
                  <th>{c.terms.by}</th>
                </tr>
              </thead>
              <tbody>
                {data.warranty.rows.map((r) => (
                  <tr key={r.item}>
                    <td>{r.item}</td>
                    <td className={styles.strong}>{r.duration}</td>
                    <td>{r.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </VoltaicSheet>

        {/* ══ Z-900 · ACCEPTANCE ════════════════════════════════════ */}
        <VoltaicSheet {...frame("Z-900", c.closing.sheet)} tone="cyan">
          <div className={styles.coverGrid} aria-hidden />
          <div className={styles.closeInner}>
            <h2 className={styles.closeTitle}>
              {c.closing.title1}
              <br />
              <em>{c.closing.title2}</em>
            </h2>
            <p className={styles.closeLead}>{c.closing.lead}</p>

            <div className={styles.closeStats}>
              <div>
                <span className={styles.closeStatVal}>
                  {annualUnits > 0 ? annualUnits.toLocaleString("en-IN") : "—"}
                </span>
                <span className={styles.closeStatLabel}>{c.closing.units}</span>
              </div>
              <div>
                <span className={styles.closeStatVal}>
                  {data.closing.annualSavingsInr > 0
                    ? formatInr(data.closing.annualSavingsInr)
                    : "—"}
                </span>
                <span className={styles.closeStatLabel}>{c.closing.saved}</span>
              </div>
              <div>
                <span className={styles.closeStatVal}>
                  {data.closing.lifetimeWealthInr > 0
                    ? formatInrCompact(data.closing.lifetimeWealthInr)
                    : "—"}
                </span>
                <span className={styles.closeStatLabel}>{c.closing.wealth}</span>
              </div>
            </div>

            <div className={styles.closeSign}>
              <div>
                <span className={styles.closeSignLabel}>{c.closing.signOff}</span>
                <span className={styles.closeBrand}>{brand}</span>
                {data.closing.contactLine ? (
                  <span className={styles.closeContact}>{data.closing.contactLine}</span>
                ) : null}
                {data.closing.address ? (
                  <span className={styles.closeContact}>{data.closing.address}</span>
                ) : null}
                {data.closing.gstNumber ? (
                  <span className={styles.closeContact}>
                    {c.closing.gstin} {data.closing.gstNumber}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className={`${styles.closeBtn} print:hidden`}
                disabled={pdfBusy}
              >
                {pdfBusy ? c.print.preparing : c.closing.cta}
              </button>
            </div>

            <p className={styles.closeValidity}>{c.closing.validity}</p>
          </div>
        </VoltaicSheet>
      </div>
    </div>
  );
}

/* ── Small building blocks ─────────────────────────────────────────── */

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.specCell}>
      <span className={styles.specLabel}>{label}</span>
      <span className={styles.specValue}>{value}</span>
    </div>
  );
}

function BomGroup({
  group,
  cols,
  noteLabel,
  compact,
}: {
  group: { code: string; title: string; lines: import("./voltaic-live").VoltaicBomLine[] };
  cols: {
    ref: string;
    item: string;
    make: string;
    spec: string;
    qty: string;
    standard: string;
    warranty: string;
  };
  noteLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={styles.bomGroup}>
      <div className={styles.bomGroupHead}>
        <span className={styles.bomGroupCode}>{group.code}</span>
        <span className={styles.bomGroupTitle}>{group.title}</span>
      </div>
      <table className={`${styles.dataTable} ${compact ? styles.tableTight : ""}`}>
        <thead>
          <tr>
            <th>{cols.ref}</th>
            <th>{cols.item}</th>
            <th>{cols.make}</th>
            <th>{cols.spec}</th>
            <th className={styles.num}>{cols.qty}</th>
            <th>{cols.standard}</th>
            <th>{cols.warranty}</th>
          </tr>
        </thead>
        <tbody>
          {group.lines.map((line) => (
            <Fragment key={line.ref}>
              <tr>
                <td className={styles.mono}>{line.ref}</td>
                <td className={styles.strong}>{line.item}</td>
                <td>{line.make}</td>
                <td>{line.spec}</td>
                <td className={styles.num}>{line.qty}</td>
                <td className={styles.mono}>{line.standard}</td>
                <td>{line.warranty}</td>
              </tr>
              {line.note ? (
                <tr className={styles.bomNoteRow}>
                  <td />
                  <td colSpan={6}>
                    <span className={styles.bomNoteLabel}>{noteLabel}</span>
                    {line.note}
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WealthChart({
  points,
  paybackYears,
  breakEvenLabel,
}: {
  points: { year: number; cumulativeInr: number }[];
  paybackYears: number;
  breakEvenLabel: string;
}) {
  if (!points || points.length === 0) return null;
  const W = 660;
  const H = 150;
  const padL = 8;
  const padB = 20;
  const max = Math.max(...points.map((p) => p.cumulativeInr), 1);
  const min = Math.min(...points.map((p) => p.cumulativeInr), 0);
  const span = max - min || 1;
  const xFor = (i: number) => padL + (i / (points.length - 1)) * (W - padL * 2);
  const yFor = (v: number) => H - padB - ((v - min) / span) * (H - padB - 10);

  const line = points.map((p, i) => `${xFor(i)},${yFor(p.cumulativeInr)}`).join(" ");
  const area = `M${xFor(0)},${yFor(min)} L${line.split(" ").join(" L")} L${xFor(points.length - 1)},${yFor(min)} Z`;
  const zeroY = yFor(0);
  const paybackIdx = points.findIndex((p) => p.cumulativeInr >= 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.wealthSvg} aria-hidden>
      <defs>
        <linearGradient id="vtWealth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,106,43,0.35)" />
          <stop offset="100%" stopColor="rgba(255,106,43,0.03)" />
        </linearGradient>
      </defs>
      <line x1={padL} y1={zeroY} x2={W - padL} y2={zeroY} stroke="#94A9BC" strokeWidth="0.8" strokeDasharray="4 4" />
      <path d={area} fill="url(#vtWealth)" />
      <polyline points={line} fill="none" stroke="#FF6A2B" strokeWidth="2.2" />
      {paybackIdx > 0 ? (
        <>
          <line
            x1={xFor(paybackIdx)}
            y1={10}
            x2={xFor(paybackIdx)}
            y2={H - padB}
            stroke="#0A2E52"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={xFor(paybackIdx) + 5} y={22} className={styles.wealthMark}>
            {breakEvenLabel} · {paybackYears > 0 ? paybackYears.toFixed(1) : points[paybackIdx].year}
          </text>
        </>
      ) : null}
      {points
        .filter((_, i) => i % 5 === 0 || i === points.length - 1)
        .map((p) => (
          <text
            key={p.year}
            x={xFor(points.indexOf(p))}
            y={H - 6}
            className={styles.wealthAxis}
            textAnchor="middle"
          >
            Y{p.year}
          </text>
        ))}
    </svg>
  );
}

export default VoltaicRenderer;
