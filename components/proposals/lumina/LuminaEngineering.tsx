"use client";

import type { CSSProperties } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { LuminaDocFooter } from "./lumina-brand";
import { formatLuminaKw, luminaEngineeringModel } from "./lumina-live";

export function LuminaEngineering({ data }: { data: ProposalData }) {
  const eng = luminaEngineeringModel(data);
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(Math.max(eng.visualPanelCount, 1)))));

  const siteItems = [
    {
      label: "Latitude",
      value: eng.siteLatLabel || "—",
      caption: "Sets the capture angle for this roof.",
    },
    {
      label: "Required roof area",
      value: eng.roofAreaM2 > 0 ? `~${eng.roofAreaM2} m²` : "—",
      caption:
        eng.panelCount > 0
          ? `${eng.panelCount} × ~${eng.m2PerPanel} m²/module (panel + walkway). Final after survey.`
          : "Appears when module count is on this proposal.",
    },
    {
      label: "Shadow tolerance",
      value: "Dual MPPT tracking",
      caption: "Inverter adjusts dynamically to passing clouds.",
    },
  ];

  const specCards = [
    {
      value: eng.acKw > 0 ? `${formatLuminaKw(eng.acKw)} kW AC` : "—",
      label: "Inverter capacity",
      desc: "Max power delivered to the home grid.",
    },
    {
      value: eng.dcKwp > 0 ? `${eng.dcKwp.toFixed(2)} kWp` : "—",
      label: "DC array (panels)",
      desc:
        eng.panelCount > 0 && eng.panelWatt > 0
          ? `${eng.panelCount} × ${eng.panelWatt} Wp modules.`
          : "Module count and wattage from the live BOM.",
    },
    {
      value: eng.performanceRatioPct > 0 ? `~${eng.performanceRatioPct}%` : "—",
      label: "Performance ratio",
      desc: "Typical efficiency after temperature and grid losses.",
    },
    {
      value: eng.dcAcRatio > 0 ? String(eng.dcAcRatio) : "—",
      label: "DC/AC ratio",
      desc: "Over-paneled for stronger morning and evening yield.",
    },
  ];

  return (
    <section className={`${styles.a4Lumina} ${styles.innerSheet}`}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Engineering design</div>
        <h1 className={styles.clientTitle}>Design & Performance.</h1>
        <p className={styles.subText}>
          Rooftop layout, site latitude, tilt, and Indian standards for this plant. Blank
          fields stay blank — they are not guessed.
        </p>

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
                  style={{ "--lu-panel-cols": String(cols) } as CSSProperties}
                >
                  {Array.from({ length: eng.visualPanelCount }).map((_, i) => (
                    <div key={i} className={styles.engPanelBox} />
                  ))}
                </div>
              ) : (
                <p className={styles.engRoofEmpty}>Array layout appears when module count is on file.</p>
              )}
            </div>
            <div className={styles.engRoofCaption}>
              <strong>South-facing array</strong>
              <span>
                {eng.tiltDeg > 0
                  ? `Tilt ${eng.tiltDeg}° · Azimuth ${eng.azimuthDeg}° (true south)`
                  : "Tilt appears when site latitude is on this proposal."}
                {eng.showingPartial ? ` · showing ${eng.visualPanelCount}/${eng.panelCount}` : ""}
              </span>
            </div>
          </div>

          <div className={styles.engSite}>
            <h2 className={styles.engSiteTitle}>Site & roof</h2>
            <div className={styles.engSiteList}>
              {siteItems.map((item) => (
                <div key={item.label} className={styles.engSiteItem}>
                  <span className={styles.engSiteLabel}>{item.label}</span>
                  <strong className={styles.engSiteValue}>{item.value}</strong>
                  <small className={styles.engSiteCaption}>{item.caption}</small>
                </div>
              ))}
            </div>
            {eng.tiltNote ? <p className={styles.engCableNote}>{eng.tiltNote}</p> : null}
          </div>
        </div>

        <h2 className={styles.engBlockTitle}>Technical specifications</h2>
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
            <span>Peak sun hours</span>
            <strong>{eng.peakSunHours > 0 ? `${eng.peakSunHours} hrs/day` : "—"}</strong>
          </div>
          <div className={styles.engYieldItem}>
            <span>Specific yield</span>
            <strong>
              {eng.specificYield > 0 ? `${eng.specificYield} kWh/kWp/yr` : "—"}
            </strong>
          </div>
          <div className={styles.engYieldItem}>
            <span>Load coverage</span>
            <strong>{eng.loadCoveragePct > 0 ? `${eng.loadCoveragePct}%` : "—"}</strong>
          </div>
        </div>

        <h2 className={styles.engBlockTitle}>Standards compliance</h2>
        <div className={styles.engChips}>
          {eng.standards.slice(0, 7).map((s) => (
            <span key={s} className={styles.engChip}>
              {s}
            </span>
          ))}
        </div>

        {eng.dcAcRatio > 0 ? (
          <p className={styles.engInsight}>
            <span>Design note</span>
            We sized around a {eng.dcAcRatio} DC/AC ratio so the inverter stays near capacity on
            low-sun days — steadier yield through winter and monsoon.
          </p>
        ) : null}
      </div>
      <LuminaDocFooter data={data} page="04 / 09" />
    </section>
  );
}

export default LuminaEngineering;
