/**
 * Engineering blueprint array visualizer — adapted from Canvas
 * EngineeringBlueprint roof panel (Atelier-local styles).
 */

import type { CSSProperties } from "react";
import styles from "./atelier.module.css";

const MAX_VISUAL_PANELS = 24;

export type AtelierBlueprintArrayProps = {
  panelCount: number;
  tiltDeg: number;
  /** Panel facing direction (0° = north, 180° = true south). */
  azimuthDeg?: number;
  title: string;
  arrayLabel: string;
  tiltAzimuthLine: string;
  showingNote?: string;
};

export function AtelierBlueprintArray({
  panelCount,
  tiltDeg,
  azimuthDeg = 180,
  title,
  arrayLabel,
  tiltAzimuthLine,
  showingNote,
}: AtelierBlueprintArrayProps) {
  const count = Math.max(1, panelCount);
  const visualPanels = Math.min(count, MAX_VISUAL_PANELS);
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(visualPanels))));
  const dense = cols >= 6 || visualPanels >= 20;
  const mid = cols >= 5 || visualPanels >= 16;
  const cellPx = dense ? 22 : mid ? 25 : 28;
  const gapPx = dense ? 3 : 4;
  const scale = dense ? 0.82 : mid ? 0.9 : 1;

  return (
    <div className={styles.blueprintArray}>
      <div className={styles.blueprintHead}>{title}</div>
      <div className={styles.blueprintStage}>
        <div className={styles.blueprintCompass} aria-hidden>
          <span className={styles.blueprintN}>N</span>
          <span className={styles.blueprintE}>E</span>
          <span className={styles.blueprintS}>S</span>
          <span className={styles.blueprintW}>W</span>
        </div>
        <div className={styles.blueprintGrid}>
          <div
            className={styles.blueprintPanels}
            style={
              {
                ["--atelier-bp-cols"]: String(cols),
                ["--atelier-bp-cell"]: `${cellPx}px`,
                ["--atelier-bp-gap"]: `${gapPx}px`,
                ["--atelier-bp-scale"]: String(scale),
                ["--atelier-bp-azimuth"]: String(azimuthDeg),
              } as CSSProperties
            }
          >
            {Array.from({ length: visualPanels }).map((_, i) => (
              <div key={i} className={styles.blueprintPanel} />
            ))}
          </div>
        </div>
        <div className={styles.blueprintCaption}>
          <strong>{arrayLabel}</strong>
          <span>
            {tiltAzimuthLine
              .replace("{tilt}", String(tiltDeg))
              .replace("{azimuth}", String(Math.round(azimuthDeg)))}
            {count > MAX_VISUAL_PANELS && showingNote
              ? ` · ${showingNote
                  .replace("{shown}", String(visualPanels))
                  .replace("{total}", String(count))}`
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
