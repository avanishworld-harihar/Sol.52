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
  title: string;
  arrayLabel: string;
  tiltAzimuthLine: string;
  showingNote?: string;
};

export function AtelierBlueprintArray({
  panelCount,
  tiltDeg,
  title,
  arrayLabel,
  tiltAzimuthLine,
  showingNote,
}: AtelierBlueprintArrayProps) {
  const count = Math.max(1, panelCount);
  const visualPanels = Math.min(count, MAX_VISUAL_PANELS);
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(visualPanels))));

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
            {tiltAzimuthLine.replace("{tilt}", String(tiltDeg))}
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
