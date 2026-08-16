"use client";

import type { CSSProperties } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import styles from "./Khadi.module.css";
import { khadiArenaLayout } from "./khadi-arena";
import { KhadiSheet } from "./khadi-brand";
import { useKhadiLang } from "./khadi-lang-context";
import {
  formatKhadiKw,
  khadiEngineeringInsights,
  khadiEngineeringModel,
} from "./khadi-live";

export function KhadiEngineering({
  data,
  pptInput,
}: {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
}) {
  const { copy, lang } = useKhadiLang();
  const eng = khadiEngineeringModel(data, pptInput);
  const insights = khadiEngineeringInsights(eng, lang);
  const arena = khadiArenaLayout(eng.visualPanelCount);

  const arrayMeta =
    eng.tiltDeg > 0
      ? copy.engineering.arrayTilt(eng.tiltDeg, eng.azimuthDeg)
      : eng.azimuthDeg > 0
        ? copy.engineering.arrayAzimuthOnly(eng.azimuthDeg)
        : copy.engineering.arrayNoTilt;

  const specCards = [
    {
      value: eng.acKw > 0 ? `${formatKhadiKw(eng.acKw)} kW AC` : "—",
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
    <KhadiSheet data={data} page="04 / 09" chapter={copy.spine.drawing}>
      <div className={styles.drawingHead}>
        <div>
          <p className={styles.kicker}>{copy.engineering.kicker}</p>
          <h1 className={`${styles.displayTitle} ${styles.drawingTitle}`}>
            {copy.engineering.title}
          </h1>
        </div>
        <span className={styles.drawingNo}>{copy.engineering.drawingNo}</span>
      </div>
      <p className={`${styles.lead} ${styles.leadShort}`}>{copy.engineering.lead}</p>

      <div className={styles.planBoard}>
        <div className={styles.planGrid} />
        <div className={styles.compass} aria-hidden>
          <span className={styles.compassN}>N</span>
          <span className={styles.compassE}>E</span>
          <span className={styles.compassS}>S</span>
          <span className={styles.compassW}>W</span>
        </div>
        {eng.visualPanelCount > 0 ? (
          <div
            className={styles.planLayout}
            style={{ "--sn-panel-cols": String(arena.cols) } as CSSProperties}
          >
            {arena.cells.map((filled, i) => (
              <div
                key={i}
                className={filled ? styles.planCell : styles.planGap}
                aria-hidden={!filled}
              />
            ))}
          </div>
        ) : (
          <p className={styles.planEmpty}>{copy.engineering.roofEmpty}</p>
        )}
      </div>

      <div className={styles.drawingMeta}>
        <div className={styles.titleBlock}>
          <h2>{copy.engineering.siteTitle}</h2>
          <div className={styles.tbRow}>
            <span className={styles.tbLabel}>{copy.engineering.arrayTitle}</span>
            <strong className={styles.tbValue}>
              {arrayMeta}
              {eng.showingPartial
                ? copy.engineering.showing(eng.visualPanelCount, eng.panelCount)
                : ""}
            </strong>
          </div>
          <div className={styles.tbRow}>
            <span className={styles.tbLabel}>{copy.engineering.latitude}</span>
            <strong className={styles.tbValue}>{eng.siteLatLabel || "—"}</strong>
            <small className={styles.tbCap}>{copy.engineering.latitudeCaption}</small>
          </div>
          <div className={styles.tbRow}>
            <span className={styles.tbLabel}>{copy.engineering.roofArea}</span>
            <strong className={styles.tbValue}>{eng.roofAreaLabel}</strong>
            <small className={styles.tbCap}>
              {eng.panelCount > 0
                ? copy.engineering.roofAreaCaption(eng.panelCount, eng.m2PerPanelLabel)
                : copy.engineering.roofAreaEmpty}
            </small>
          </div>
          <p className={styles.cableNote}>
            {eng.cableNote || copy.engineering.cableFallback}
          </p>
          {eng.tiltNote ? <p className={styles.cableNote}>{eng.tiltNote}</p> : null}
        </div>

        <div className={styles.specStrip}>
          {specCards.map((card) => (
            <div key={card.label} className={styles.specCell}>
              <p className={styles.specVal}>{card.value}</p>
              <p className={styles.specLab}>{card.label}</p>
              <p className={styles.specDesc}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.yieldRail}>
        <div className={styles.yieldCell}>
          <span>{copy.engineering.peakSun}</span>
          <strong>
            {eng.peakSunHours > 0 ? copy.engineering.hrsDay(eng.peakSunHours) : "—"}
          </strong>
        </div>
        <div className={styles.yieldCell}>
          <span>{copy.engineering.specificYield}</span>
          <strong>
            {eng.specificYield > 0 ? `${eng.specificYield} kWh/kWp/yr` : "—"}
          </strong>
        </div>
        <div className={styles.yieldCell}>
          <span>{copy.engineering.loadCoverage}</span>
          <strong>{eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—"}</strong>
        </div>
      </div>

      <aside className={styles.insightBand}>
        <h3>{copy.engineering.expertTag}</h3>
        <div className={styles.insightGrid}>
          {insights.slice(0, 3).map((card) => (
            <div key={card.title}>
              <p className={styles.insightTitle}>{card.title}</p>
              <p className={styles.insightBody}>{card.body}</p>
            </div>
          ))}
        </div>
      </aside>
    </KhadiSheet>
  );
}

export default KhadiEngineering;
