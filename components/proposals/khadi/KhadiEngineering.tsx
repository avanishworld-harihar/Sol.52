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
      <div className={`${styles.mill} ${styles.millInvert}`}>
        <div className={styles.millWork}>
          <p className={styles.kicker}>{copy.engineering.kicker}</p>
          <h1 className={`${styles.displayTitle} ${styles.drawingTitle}`}>
            {copy.engineering.title}
          </h1>
          <p className={`${styles.lead} ${styles.leadShort}`}>{copy.engineering.lead}</p>

          <div className={`${styles.planBoard} ${styles.millPlan}`}>
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
                style={{ "--kh-panel-cols": String(arena.cols) } as CSSProperties}
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

          <div className={styles.millYield}>
            <div className={styles.millCoin}>
              <span>{copy.engineering.peakSun}</span>
              <strong>
                {eng.peakSunHours > 0 ? copy.engineering.hrsDay(eng.peakSunHours) : "—"}
              </strong>
            </div>
            <div className={styles.millCoin}>
              <span>{copy.engineering.specificYield}</span>
              <strong>
                {eng.specificYield > 0 ? `${eng.specificYield}` : "—"}
              </strong>
            </div>
            <div className={`${styles.millCoin} ${styles.millCoinKeep}`}>
              <span>{copy.engineering.loadCoverage}</span>
              <strong>{eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—"}</strong>
            </div>
          </div>
          {insights.length > 0 ? (
            <p className={styles.millCaption}>
              <strong>{insights[0]!.title}</strong>
              {insights[0]!.body}
            </p>
          ) : null}
        </div>

        <aside className={styles.millSelvage}>
          <span className={styles.drawingNo}>{copy.engineering.drawingNo}</span>
          <div className={styles.millStack}>
            <div className={styles.millStamp}>
              <span>{copy.engineering.arrayTitle}</span>
              <strong>
                {arrayMeta}
                {eng.showingPartial
                  ? copy.engineering.showing(eng.visualPanelCount, eng.panelCount)
                  : ""}
              </strong>
            </div>
            <div className={styles.millStamp}>
              <span>{copy.engineering.latitude}</span>
              <strong>{eng.siteLatLabel || "—"}</strong>
              <p>{copy.engineering.latitudeCaption}</p>
            </div>
            <div className={styles.millStamp}>
              <span>{copy.engineering.roofArea}</span>
              <strong>{eng.roofAreaLabel}</strong>
              <p>
                {eng.panelCount > 0
                  ? copy.engineering.roofAreaCaption(eng.panelCount, eng.m2PerPanelLabel)
                  : copy.engineering.roofAreaEmpty}
              </p>
            </div>
            <div className={styles.millParts}>
              {specCards.map((card) => (
                <div key={card.label} className={styles.millStamp}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <p className={styles.millCaption}>
            {eng.cableNote || copy.engineering.cableFallback}
          </p>
        </aside>
      </div>
    </KhadiSheet>
  );
}

export default KhadiEngineering;
