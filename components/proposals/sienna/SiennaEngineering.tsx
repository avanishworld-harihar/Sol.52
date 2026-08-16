"use client";

import type { CSSProperties } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import styles from "./Sienna.module.css";
import { siennaArenaLayout } from "./sienna-arena";
import { SiennaDocFooter } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import {
  formatSiennaKw,
  siennaEngineeringInsights,
  siennaEngineeringModel,
} from "./sienna-live";

export function SiennaEngineering({
  data,
  pptInput,
}: {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
}) {
  const { copy, lang } = useSiennaLang();
  const eng = siennaEngineeringModel(data, pptInput);
  const insights = siennaEngineeringInsights(eng, lang);
  const arena = siennaArenaLayout(eng.visualPanelCount);

  const arrayMeta =
    eng.tiltDeg > 0
      ? copy.engineering.arrayTilt(eng.tiltDeg, eng.azimuthDeg)
      : eng.azimuthDeg > 0
        ? copy.engineering.arrayAzimuthOnly(eng.azimuthDeg)
        : copy.engineering.arrayNoTilt;

  const siteItems = [
    {
      label: copy.engineering.latitude,
      value: eng.siteLatLabel || "—",
      caption: copy.engineering.latitudeCaption,
    },
    {
      label: copy.engineering.roofArea,
      value: eng.roofAreaLabel,
      caption:
        eng.panelCount > 0
          ? copy.engineering.roofAreaCaption(eng.panelCount, eng.m2PerPanelLabel)
          : copy.engineering.roofAreaEmpty,
    },
    {
      label: copy.engineering.shadow,
      value: copy.engineering.shadowValue,
      caption: copy.engineering.shadowCaption,
    },
  ];

  const specCards = [
    {
      value: eng.acKw > 0 ? `${formatSiennaKw(eng.acKw)} kW AC` : "—",
      label: copy.engineering.specInverter,
      desc: copy.engineering.specInverterDesc,
    },
    {
      value: eng.dcKwp > 0 ? `${eng.dcKwp.toFixed(2)} kWp` : "—",
      label: copy.engineering.specDc,
      desc:
        eng.panelCount > 0 && eng.panelWatt > 0
          ? copy.engineering.specDcDesc(eng.panelCount, eng.panelWatt)
          : copy.engineering.specDcEmpty,
    },
    {
      value: eng.performanceRatioPct > 0 ? `~${eng.performanceRatioPct}%` : "—",
      label: copy.engineering.specPr,
      desc: copy.engineering.specPrDesc,
    },
    {
      value: eng.dcAcRatio > 0 ? String(eng.dcAcRatio) : "—",
      label: copy.engineering.specDcAc,
      desc: copy.engineering.specDcAcDesc,
    },
  ];

  return (
    <section className={`${styles.a4Sienna} ${styles.innerSheet} ${styles.engSheet}`}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>{copy.engineering.tag}</div>
        <h1 className={styles.clientTitle}>{copy.engineering.title}</h1>
        <p className={styles.subText}>{copy.engineering.lead}</p>

        <div className={styles.engBlueprint}>
          <div className={styles.engRoof}>
            <div className={styles.engCompass} aria-hidden>
              <span className={styles.engCompassN}>N</span>
              <span className={styles.engCompassE}>E</span>
              <span className={styles.engCompassS}>S</span>
              <span className={styles.engCompassW}>W</span>
            </div>
            <div className={styles.engRoofGrid}>
              {eng.visualPanelCount > 0 ? (
                <div
                  className={styles.engPanelLayout}
                  style={{ "--sn-panel-cols": String(arena.cols) } as CSSProperties}
                >
                  {arena.cells.map((filled, i) => (
                    <div
                      key={i}
                      className={filled ? styles.engPanelBox : styles.engPanelGap}
                      aria-hidden={!filled}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.engRoofEmpty}>{copy.engineering.roofEmpty}</p>
              )}
            </div>
            <div className={styles.engRoofCaption}>
              <strong>{copy.engineering.arrayTitle}</strong>
              <span>
                {arrayMeta}
                {eng.showingPartial
                  ? copy.engineering.showing(eng.visualPanelCount, eng.panelCount)
                  : ""}
              </span>
            </div>
          </div>

          <div className={styles.engSite}>
            <h2 className={styles.engSiteTitle}>{copy.engineering.siteTitle}</h2>
            <div className={styles.engSiteList}>
              {siteItems.map((item) => (
                <div key={item.label} className={styles.engSiteItem}>
                  <span className={styles.engSiteLabel}>{item.label}</span>
                  <strong className={styles.engSiteValue}>{item.value}</strong>
                  <small className={styles.engSiteCaption}>{item.caption}</small>
                </div>
              ))}
            </div>
            <p className={styles.engCableNote}>
              {eng.cableNote || copy.engineering.cableFallback}
            </p>
            {eng.tiltNote ? <p className={styles.engCableNote}>{eng.tiltNote}</p> : null}
          </div>
        </div>

        <h2 className={styles.engBlockTitle}>{copy.engineering.specsTitle}</h2>
        <div className={styles.engSpecs}>
          {specCards.map((card) => (
            <div key={card.label} className={styles.engSpecCard}>
              <p className={styles.engSpecValue}>{card.value}</p>
              <p className={styles.engSpecLabel}>{card.label}</p>
              <p className={styles.engSpecDesc}>{card.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.engYieldStrip}>
          <div className={styles.engYieldItem}>
            <span>{copy.engineering.peakSun}</span>
            <strong>
              {eng.peakSunHours > 0 ? copy.engineering.hrsDay(eng.peakSunHours) : "—"}
            </strong>
          </div>
          <div className={styles.engYieldItem}>
            <span>{copy.engineering.specificYield}</span>
            <strong>
              {eng.specificYield > 0 ? `${eng.specificYield} kWh/kWp/yr` : "—"}
            </strong>
          </div>
          <div className={styles.engYieldItem}>
            <span>{copy.engineering.loadCoverage}</span>
            <strong>{eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—"}</strong>
          </div>
        </div>

        <h2 className={styles.engBlockTitle}>{copy.engineering.standards}</h2>
        <div className={styles.engChips}>
          {eng.standards.slice(0, 7).map((s) => (
            <span key={s} className={styles.engChip}>
              {s}
            </span>
          ))}
        </div>

        <aside className={styles.engExpert}>
          <p className={styles.engExpertTag}>{copy.engineering.expertTag}</p>
          <div className={styles.engExpertGrid}>
            {insights.map((card) => (
              <div key={card.title} className={styles.engExpertCard}>
                <h3 className={styles.engExpertTitle}>{card.title}</h3>
                <p className={styles.engExpertBody}>{card.body}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <SiennaDocFooter data={data} page="04 / 09" />
    </section>
  );
}

export default SiennaEngineering;
