"use client";

import type { CSSProperties } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import styles from "./Jaali.module.css";
import { jaaliArenaLayout } from "./jaali-arena";
import { JaaliSheet } from "./jaali-brand";
import { useJaaliLang } from "./jaali-lang-context";
import {
  formatJaaliKw,
  jaaliEngineeringInsights,
  jaaliEngineeringModel,
} from "./jaali-live";

export function JaaliEngineering({
  data,
  pptInput,
}: {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
}) {
  const { copy, lang } = useJaaliLang();
  const eng = jaaliEngineeringModel(data, pptInput);
  const insights = jaaliEngineeringInsights(eng, lang);
  const arena = jaaliArenaLayout(eng.visualPanelCount);

  const arrayMeta =
    eng.tiltDeg > 0
      ? copy.engineering.arrayTilt(eng.tiltDeg, eng.azimuthDeg)
      : eng.azimuthDeg > 0
        ? copy.engineering.arrayAzimuthOnly(eng.azimuthDeg)
        : copy.engineering.arrayNoTilt;

  const specCards = [
    {
      value: eng.acKw > 0 ? `${formatJaaliKw(eng.acKw)} kW AC` : "—",
      label: copy.engineering.specInverter,
    },
    {
      value: eng.dcKwp > 0 ? `${eng.dcKwp.toFixed(2)} kWp` : "—",
      label: copy.engineering.specDc,
      hint:
        eng.panelCount > 0 && eng.panelWatt > 0
          ? copy.engineering.specDcDesc(eng.panelCount, eng.panelWatt)
          : undefined,
    },
    {
      value: eng.performanceRatioPct > 0 ? `~${eng.performanceRatioPct}%` : "—",
      label: copy.engineering.specPr,
    },
    {
      value: eng.dcAcRatio > 0 ? String(eng.dcAcRatio) : "—",
      label: copy.engineering.specDcAc,
    },
  ];

  const siteFacts = [
    {
      label: copy.engineering.arrayTitle,
      value: arrayMeta,
      hint: eng.showingPartial
        ? copy.engineering.showing(eng.visualPanelCount, eng.panelCount).replace(/^ · /, "")
        : undefined,
    },
    {
      label: copy.engineering.latitude,
      value: eng.siteLatLabel || "—",
      hint: copy.engineering.latitudeCaption,
    },
    {
      label: copy.engineering.roofArea,
      value: eng.roofAreaLabel,
      hint:
        eng.panelCount > 0
          ? copy.engineering.roofAreaCaption(eng.panelCount, eng.m2PerPanelLabel)
          : copy.engineering.roofAreaEmpty,
    },
  ];

  return (
    <JaaliSheet data={data} page="04 / 09" chapter={copy.spine.drawing}>
      <div className={styles.drawPage}>
        <div className={styles.drawHead}>
          <div>
            <p className={styles.kicker}>{copy.engineering.kicker}</p>
            <h1 className={`${styles.displayTitle} ${styles.drawingTitle}`}>
              {copy.engineering.title}
            </h1>
          </div>
          <span className={styles.drawingNo}>{copy.engineering.drawingNo}</span>
        </div>
        <p className={`${styles.lead} ${styles.leadShort}`}>{copy.engineering.lead}</p>

        <div className={styles.planSheet}>
          <div className={`${styles.planBoard} ${styles.window}`}>
            <span className={styles.planTag}>{copy.engineering.planTag}</span>
            <div className={styles.planGrid} />
            <div className={styles.compass} aria-hidden>
              <span className={styles.compassN}>N</span>
              <span className={styles.compassE}>E</span>
              <span className={styles.compassS}>S</span>
              <span className={styles.compassW}>W</span>
            </div>
            {eng.visualPanelCount > 0 ? (
              <div
                className={styles.planStage}
                style={{ "--ja-panel-cols": String(arena.cols) } as CSSProperties}
              >
                <div className={styles.planLayout}>
                  {arena.cells.map((filled, i) => (
                    <div
                      key={i}
                      className={filled ? styles.planCell : styles.planGap}
                      aria-hidden={!filled}
                    />
                  ))}
                </div>
                <span className={styles.planSouth}>{copy.engineering.southEdge}</span>
                <span className={styles.planAisle} aria-hidden />
              </div>
            ) : (
              <p className={styles.planEmpty}>{copy.engineering.roofEmpty}</p>
            )}
          </div>
          <div className={styles.planMeta}>
            <p className={styles.drawLegend}>
              {copy.engineering.planLegend}
              {eng.visualPanelCount > 0 ? ` · ${copy.engineering.tableKind(arena.tableKind)}` : ""}
            </p>
            <p className={styles.planWalkNote}>{copy.engineering.walkAisle}</p>
          </div>
        </div>

        <div className={styles.drawFloor}>
          <div className={styles.courtRow}>
            {siteFacts.map((fact) => (
              <div key={fact.label} className={styles.courtBay}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
                {fact.hint ? <p>{fact.hint}</p> : null}
              </div>
            ))}
          </div>

          <div className={styles.specStrip}>
            {specCards.map((card) => (
              <div key={card.label} className={styles.specCell}>
                <p className={styles.specVal}>{card.value}</p>
                <p className={styles.specLab}>{card.label}</p>
                {card.hint ? <p className={styles.specDesc}>{card.hint}</p> : null}
              </div>
            ))}
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
              <strong>{eng.specificYield > 0 ? `${eng.specificYield}` : "—"}</strong>
            </div>
            <div className={styles.yieldCell}>
              <span>{copy.engineering.loadCoverage}</span>
              <strong>
                {eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—"}
              </strong>
            </div>
          </div>
        </div>

        <p className={styles.cableNote}>
          {eng.cableNote || copy.engineering.cableFallback}
        </p>

        {insights.length > 0 ? (
          <div className={styles.drawNotes}>
            {[insights[0], insights[1], insights[3] ?? insights[2]]
              .filter((card): card is NonNullable<typeof card> => Boolean(card))
              .map((card) => (
                <div key={card.title}>
                  <p className={styles.insightTitle}>{card.title}</p>
                  <p className={styles.insightBody}>{card.body}</p>
                </div>
              ))}
          </div>
        ) : null}
      </div>
    </JaaliSheet>
  );
}

export default JaaliEngineering;
