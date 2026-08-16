"use client";

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import styles from "./Jaali.module.css";
import { JaaliSheet } from "./jaali-brand";
import { useJaaliLang } from "./jaali-lang-context";
import {
  formatJaaliKw,
  jaaliEngineeringModel,
  jaaliSunLessons,
} from "./jaali-live";
import { JaaliSunSection } from "./jaali-sun-section";

export function JaaliEngineering({
  data,
  pptInput,
}: {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
}) {
  const { copy, lang } = useJaaliLang();
  const eng = jaaliEngineeringModel(data, pptInput);
  const lessons = jaaliSunLessons(eng, lang);

  const glassValue =
    eng.dcKwp > 0
      ? `${eng.dcKwp.toFixed(2)} kWp`
      : eng.panelCount > 0
        ? `${eng.panelCount}`
        : "—";
  const glassHint =
    eng.panelCount > 0 && eng.panelWatt > 0
      ? copy.engineering.specDcDesc(eng.panelCount, eng.panelWatt)
      : copy.engineering.specDcEmpty;

  const path = [
    {
      n: "1",
      label: copy.engineering.pathSky,
      value: eng.peakSunHours > 0 ? copy.engineering.hrsDay(eng.peakSunHours) : "—",
      hint: copy.engineering.pathSkyHint,
    },
    {
      n: "2",
      label: copy.engineering.pathGlass,
      value: glassValue,
      hint: glassHint,
    },
    {
      n: "3",
      label: copy.engineering.pathKitchen,
      value: eng.acKw > 0 ? `${formatJaaliKw(eng.acKw)} kW AC` : "—",
      hint:
        eng.performanceRatioPct > 0
          ? `PR ${eng.performanceRatioPct}%`
          : copy.engineering.pathKitchenHint,
    },
    {
      n: "4",
      label: copy.engineering.pathHome,
      value: eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—",
      hint:
        eng.dcAcRatio > 0
          ? `DC/AC ${eng.dcAcRatio}`
          : copy.engineering.pathHomeHint,
    },
  ];

  const measures = [
    { label: copy.engineering.measureLat, value: eng.siteLatLabel || "—" },
    {
      label: copy.engineering.measureTilt,
      value: eng.tiltDeg > 0 ? `${eng.tiltDeg}°` : "—",
    },
    {
      label: copy.engineering.measureAz,
      value: eng.azimuthDeg > 0 ? `${eng.azimuthDeg}° S` : "—",
    },
    { label: copy.engineering.measureArea, value: eng.roofAreaLabel || "—" },
    {
      label: copy.engineering.measureYield,
      value: eng.specificYield > 0 ? String(eng.specificYield) : "—",
    },
    {
      label: copy.engineering.measureCover,
      value: eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—",
    },
  ];

  return (
    <JaaliSheet data={data} page="04 / 09" chapter={copy.spine.drawing}>
      <div className={styles.sunPage}>
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

        <figure className={styles.sunPlate}>
          <JaaliSunSection
            tiltDeg={eng.tiltDeg}
            walkLabel={copy.engineering.walkLabel}
            southLabel={copy.engineering.southLabel}
            tiltCaption={copy.engineering.tiltCaption(eng.tiltDeg)}
          />
          <figcaption className={styles.sunCaption}>{copy.engineering.plateCaption}</figcaption>
        </figure>

        <ol className={styles.sunPath}>
          {path.map((step) => (
            <li key={step.n} className={styles.sunStep}>
              <span className={styles.sunStepN}>{step.n}</span>
              <span className={styles.sunStepLab}>{step.label}</span>
              <strong className={styles.sunStepVal}>{step.value}</strong>
              <p className={styles.sunStepHint}>{step.hint}</p>
            </li>
          ))}
        </ol>

        <dl className={styles.sunMeasures}>
          {measures.map((row) => (
            <div key={row.label} className={styles.sunMeasure}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className={styles.cableNote}>
          {eng.cableNote || copy.engineering.cableFallback}
        </p>

        <div className={styles.sunLessons}>
          {lessons.map((card) => (
            <div key={card.title}>
              <p className={styles.insightTitle}>{card.title}</p>
              <p className={styles.insightBody}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </JaaliSheet>
  );
}

export default JaaliEngineering;
